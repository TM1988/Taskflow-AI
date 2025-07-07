"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownSimpleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

interface DropdownSeparatorProps {
  className?: string;
}

const DropdownSimple = React.forwardRef<HTMLDivElement, DropdownSimpleProps>(
  ({ trigger, children, open, onOpenChange, align = "end", side = "bottom", className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const controlled = open !== undefined;
    const actualOpen = controlled ? open : isOpen;

    const handleToggle = React.useCallback(() => {
      if (controlled) {
        onOpenChange?.(!actualOpen);
      } else {
        setIsOpen(!actualOpen);
      }
    }, [controlled, onOpenChange, actualOpen]);

    const handleClose = React.useCallback(() => {
      if (controlled) {
        onOpenChange?.(false);
      } else {
        setIsOpen(false);
      }
    }, [controlled, onOpenChange]);

    // Position calculation
    React.useEffect(() => {
      if (actualOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let x = rect.left;
        let y = rect.bottom + 4;

        // Align horizontally
        if (align === "center") {
          x = rect.left + rect.width / 2;
        } else if (align === "end") {
          x = rect.right;
        }

        // Position vertically
        if (side === "top") {
          y = rect.top - 4;
        }

        setPosition({ x, y });
      }
    }, [actualOpen, align, side]);

    // Click outside handler
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          actualOpen &&
          triggerRef.current &&
          contentRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !contentRef.current.contains(event.target as Node)
        ) {
          handleClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [actualOpen, handleClose]);

    // Escape key handler
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && actualOpen) {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [actualOpen, handleClose]);

    return (
      <div ref={ref} className="relative">
        <div ref={triggerRef} onClick={handleToggle}>
          {trigger}
        </div>

        {actualOpen && (
          <div
            ref={contentRef}
            className={cn(
              "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              side === "top" && "origin-bottom",
              side === "bottom" && "origin-top",
              align === "end" && "origin-top-right",
              align === "start" && "origin-top-left",
              className
            )}
            style={{
              position: "fixed",
              left: align === "end" ? position.x - 128 : position.x,
              top: side === "top" ? position.y - 200 : position.y,
              transform: side === "top" ? "translateY(-100%)" : undefined,
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

DropdownSimple.displayName = "DropdownSimple";

const DropdownItemSimple = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ children, onClick, disabled = false, className }, ref) => {
    const handleClick = React.useCallback(() => {
      if (!disabled && onClick) {
        onClick();
      }
    }, [disabled, onClick]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          disabled
            ? "pointer-events-none opacity-50"
            : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  }
);

DropdownItemSimple.displayName = "DropdownItemSimple";

const DropdownSeparatorSimple = React.forwardRef<HTMLDivElement, DropdownSeparatorProps>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
    />
  )
);

DropdownSeparatorSimple.displayName = "DropdownSeparatorSimple";

const DropdownLabelSimple = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));

DropdownLabelSimple.displayName = "DropdownLabelSimple";

export {
  DropdownSimple,
  DropdownItemSimple,
  DropdownSeparatorSimple,
  DropdownLabelSimple,
};
