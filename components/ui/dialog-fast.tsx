'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const DialogFast = DialogPrimitive.Root;

const DialogTriggerFast = DialogPrimitive.Trigger;

const DialogPortalFast = DialogPrimitive.Portal;

const DialogCloseFast = DialogPrimitive.Close;

// OPTIMIZED: Removed all blocking animations
const DialogOverlayFast = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // REMOVED: data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
      // KEPT: Only essential styling without animations
      'fixed inset-0 z-50 bg-black/80',
      className
    )}
    {...props}
  />
));
DialogOverlayFast.displayName = DialogPrimitive.Overlay.displayName;

// OPTIMIZED: Removed all blocking animations and transitions
const DialogContentFast = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortalFast>
    <DialogOverlayFast />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // REMOVED: All animate-in/out classes that cause freezing:
        // data-[state=open]:animate-in data-[state=closed]:animate-out
        // data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
        // data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
        // data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
        // data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
        // duration-200

        // KEPT: Only essential positioning and styling
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortalFast>
));
DialogContentFast.displayName = DialogPrimitive.Content.displayName;

const DialogHeaderFast = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeaderFast.displayName = 'DialogHeaderFast';

const DialogFooterFast = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooterFast.displayName = 'DialogFooterFast';

const DialogTitleFast = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitleFast.displayName = DialogPrimitive.Title.displayName;

const DialogDescriptionFast = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescriptionFast.displayName = DialogPrimitive.Description.displayName;

export {
  DialogFast,
  DialogPortalFast,
  DialogOverlayFast,
  DialogCloseFast,
  DialogTriggerFast,
  DialogContentFast,
  DialogHeaderFast,
  DialogFooterFast,
  DialogTitleFast,
  DialogDescriptionFast,
};
