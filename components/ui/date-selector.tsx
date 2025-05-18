"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  position?: "above" | "below" | "center"; // Add position prop
}

export function DateSelector({
  value,
  onChange,
  label,
  placeholder = "Select date",
  className,
  position = "above", // Default to above
}: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

  // Position calculation for the calendar
  const calculatePosition = React.useCallback(() => {
    if (!buttonRef.current || !calendarRef.current) return;

    if (position === "center") {
      // Center in the viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const calendarWidth = calendarRef.current.offsetWidth;
      const calendarHeight = calendarRef.current.offsetHeight;

      calendarRef.current.style.left = `${Math.max(0, (viewportWidth - calendarWidth) / 2)}px`;
      calendarRef.current.style.top = `${Math.max(0, (viewportHeight - calendarHeight) / 2)}px`;
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const calendarHeight = calendarRef.current.offsetHeight;
    const calendarWidth = calendarRef.current.offsetWidth;

    // Calculate horizontal position
    let leftPos = buttonRect.left + window.scrollX;
    // Ensure it doesn't go off-screen to the right
    if (leftPos + calendarWidth > window.innerWidth) {
      leftPos = Math.max(0, window.innerWidth - calendarWidth - 10);
    }
    calendarRef.current.style.left = `${leftPos}px`;

    if (position === "above") {
      // Try to position above first
      const topPos = buttonRect.top + window.scrollY - calendarHeight - 8;

      // If there's not enough space above, position it below
      if (topPos < window.scrollY) {
        calendarRef.current.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
      } else {
        calendarRef.current.style.top = `${topPos}px`;
      }
    } else {
      // Position below
      calendarRef.current.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
    }
  }, [position]);

  // Toggle calendar and update position
  const toggleCalendar = React.useCallback(() => {
    setShowCalendar((prev) => !prev);
    // Allow the calendar to render before calculating position
    setTimeout(calculatePosition, 10); // Increased timeout for more reliability
  }, [calculatePosition]);

  // Close calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    // Recalculate position on window resize
    const handleResize = () => {
      if (showCalendar) {
        calculatePosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    // Calculate initial position when shown
    if (showCalendar) {
      calculatePosition();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [showCalendar, calculatePosition]);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && <label className="text-sm font-medium block">{label}</label>}

      <div className="relative">
        {/* Button to toggle calendar */}
        <button
          type="button"
          ref={buttonRef}
          onClick={toggleCalendar}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "justify-between items-center text-left font-normal",
          )}
        >
          <span className={!value ? "text-muted-foreground" : ""}>
            {value ? format(value, "MMMM d, yyyy") : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4" />
        </button>

        {/* Show clear button if a date is selected */}
        {value && (
          <button
            type="button"
            className="absolute right-10 top-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Calendar dropdown in a portal to avoid containment issues */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="fixed z-[9999] bg-popover border rounded-md shadow-md w-auto"
          style={{
            minWidth: buttonRef.current
              ? buttonRef.current.offsetWidth
              : "auto",
          }}
        >
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm">Select Date</h3>
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setShowCalendar(false);
            }}
            initialFocus
          />
          <div className="p-3 border-t flex justify-between">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 py-2 bg-muted hover:bg-muted/80"
              onClick={() => {
                onChange(undefined);
                setShowCalendar(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowCalendar(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
