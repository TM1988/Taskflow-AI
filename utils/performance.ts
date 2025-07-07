"use client";

// Simple performance monitoring utilities
export function measureOperation(name: string, operation: () => void): number {
  const startTime = performance.now();

  try {
    operation();
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && duration > 16) {
      console.warn(
        `⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`
      );
    }

    return duration;
  }
}

// Defer operation to prevent UI blocking
export function deferOperation<T>(
  operation: () => T | Promise<T>,
  delay: number = 0
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

// Check if main thread is responsive
export function isMainThreadResponsive(): boolean {
  const start = performance.now();
  // Synchronous operation that should complete quickly
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += i;
  }
  const duration = performance.now() - start;

  // If this simple operation takes more than 5ms, main thread might be blocked
  return duration < 5;
}

// Schedule work across multiple frames
export function scheduleWork(
  tasks: Array<() => void>,
  onComplete?: () => void
): void {
  if (tasks.length === 0) {
    onComplete?.();
    return;
  }

  const processChunk = () => {
    const startTime = performance.now();

    // Process tasks until we approach the frame budget (5ms)
    while (tasks.length > 0 && performance.now() - startTime < 5) {
      const task = tasks.shift();
      task?.();
    }

    if (tasks.length > 0) {
      // Continue in next frame
      requestAnimationFrame(processChunk);
    } else {
      onComplete?.();
    }
  };

  requestAnimationFrame(processChunk);
}

// Debounce function to prevent excessive calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function to limit call frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
