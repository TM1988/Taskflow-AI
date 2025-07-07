"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NonBlockingDialogOptions {
  onOpen?: () => void;
  onClose?: () => void;
  deferInitialization?: boolean;
  initializationDelay?: number;
  performanceThreshold?: number;
}

interface NonBlockingDialogReturn {
  isOpen: boolean;
  isInitialized: boolean;
  isPerformanceGood: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setOpen: (open: boolean) => void;
  deferOperation: <T>(
    operation: () => Promise<T> | T,
    delay?: number,
  ) => Promise<T>;
  measurePerformance: (name: string, operation: () => void) => void;
}

export function useNonBlockingDialog(
  initialOpen = false,
  options: NonBlockingDialogOptions = {},
): NonBlockingDialogReturn {
  const {
    onOpen,
    onClose,
    deferInitialization = true,
    initializationDelay = 50,
    performanceThreshold = 16, // 16ms = 60fps threshold
  } = options;

  const [isOpen, setIsOpenState] = useState(initialOpen);
  const [isInitialized, setIsInitialized] = useState(!deferInitialization);
  const [isPerformanceGood, setIsPerformanceGood] = useState(true);

  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const performanceRef = useRef<{ [key: string]: number }>({});
  const lastFrameTimeRef = useRef(performance.now());

  // Monitor frame rate to detect performance issues
  useEffect(() => {
    let animationFrameId: number;

    const checkFrameRate = () => {
      const now = performance.now();
      const frameDuration = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // If frame duration exceeds threshold, performance is poor
      setIsPerformanceGood(frameDuration <= performanceThreshold);

      animationFrameId = requestAnimationFrame(checkFrameRate);
    };

    if (isOpen) {
      animationFrameId = requestAnimationFrame(checkFrameRate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, performanceThreshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Initialize dialog content with delay
  const initializeDialog = useCallback(() => {
    if (deferInitialization && !isInitialized) {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      initTimeoutRef.current = setTimeout(() => {
        setIsInitialized(true);
      }, initializationDelay);
    }
  }, [deferInitialization, isInitialized, initializationDelay]);

  // Open dialog with deferred initialization
  const openDialog = useCallback(() => {
    setIsOpenState(true);
    initializeDialog();
    onOpen?.();
  }, [initializeDialog, onOpen]);

  // Close dialog and reset initialization
  const closeDialog = useCallback(() => {
    setIsOpenState(false);
    if (deferInitialization) {
      setIsInitialized(false);
    }
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    onClose?.();
  }, [deferInitialization, onClose]);

  // Set open state with proper handling
  const setOpen = useCallback(
    (open: boolean) => {
      if (open) {
        openDialog();
      } else {
        closeDialog();
      }
    },
    [openDialog, closeDialog],
  );

  // Defer heavy operations to prevent blocking
  const deferOperation = useCallback(
    async <T>(operation: () => Promise<T> | T, delay = 0): Promise<T> => {
      // If performance is poor, increase delay
      const actualDelay = isPerformanceGood ? delay : Math.max(delay, 100);

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, actualDelay);
      });
    },
    [isPerformanceGood],
  );

  // Measure operation performance
  const measurePerformance = useCallback(
    (name: string, operation: () => void) => {
      const startTime = performance.now();

      try {
        operation();
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;

        performanceRef.current[name] = duration;

        // Log slow operations in development
        if (
          process.env.NODE_ENV === "development" &&
          duration > performanceThreshold
        ) {
          console.warn(
            `⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
          );
        }
      }
    },
    [performanceThreshold],
  );

  // Initialize immediately if dialog is already open
  useEffect(() => {
    if (isOpen && !isInitialized && deferInitialization) {
      initializeDialog();
    }
  }, [isOpen, isInitialized, deferInitialization, initializeDialog]);

  return {
    isOpen,
    isInitialized,
    isPerformanceGood,
    openDialog,
    closeDialog,
    setOpen,
    deferOperation,
    measurePerformance,
  };
}

// Hook for detecting main thread blocking
export function useMainThreadMonitor(threshold = 100) {
  const [isBlocked, setIsBlocked] = useState(false);
  const lastCheckRef = useRef(performance.now());

  useEffect(() => {
    const checkMainThread = () => {
      const now = performance.now();
      const gap = now - lastCheckRef.current;

      // If gap is significantly larger than expected, main thread was blocked
      if (gap > threshold) {
        setIsBlocked(true);
        if (process.env.NODE_ENV === "development") {
          console.warn(`🚨 Main thread blocked for ${gap.toFixed(2)}ms`);
        }

        // Reset after a short delay
        setTimeout(() => setIsBlocked(false), 1000);
      }

      lastCheckRef.current = now;
    };

    const intervalId = setInterval(checkMainThread, 50);
    return () => clearInterval(intervalId);
  }, [threshold]);

  return isBlocked;
}

// Utility to schedule work across multiple frames
export function useScheduledWork() {
  const scheduledWorkRef = useRef<Array<() => void>>([]);
  const isProcessingRef = useRef(false);

  const scheduleWork = useCallback((work: () => void) => {
    scheduledWorkRef.current.push(work);
    processScheduledWork();
  }, []);

  const processScheduledWork = useCallback(() => {
    if (isProcessingRef.current || scheduledWorkRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    const processChunk = () => {
      const startTime = performance.now();

      // Process work until we approach the frame budget (5ms)
      while (
        scheduledWorkRef.current.length > 0 &&
        performance.now() - startTime < 5
      ) {
        const work = scheduledWorkRef.current.shift();
        work?.();
      }

      if (scheduledWorkRef.current.length > 0) {
        // Continue in next frame
        requestAnimationFrame(processChunk);
      } else {
        isProcessingRef.current = false;
      }
    };

    requestAnimationFrame(processChunk);
  }, []);

  return { scheduleWork };
}
