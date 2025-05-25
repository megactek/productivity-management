"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

interface SheetProps extends VariantProps<typeof sheetVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, side, children, className }: SheetProps) {
  const [isOpen, setIsOpen] = React.useState(open || false);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      setIsOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  // Memoize the escape handler to avoid recreating it on each render
  const handleEscape = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleOpenChange(false);
      }
    },
    [handleOpenChange]
  );

  // Handle ESC key
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <SheetProvider value={{ isOpen, onOpenChange: handleOpenChange }}>
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100"
          onClick={() => handleOpenChange(false)}
        />
        <div className={cn(sheetVariants({ side }), className)}>{children}</div>
      </div>
    </SheetProvider>
  );
}

interface SheetContextValue {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined);

function SheetProvider({ children, value }: { children: React.ReactNode; value: SheetContextValue }) {
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet");
  }
  return context;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function SheetTrigger({ children, asChild }: SheetTriggerProps) {
  const { onOpenChange } = useSheetContext();

  // For simplicity, we're removing the asChild prop and just using a button
  return (
    <button type="button" onClick={() => onOpenChange(true)} className={asChild ? "inline-flex" : ""}>
      {children}
    </button>
  );
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetContent({ children, className }: SheetContentProps) {
  return <div className={cn("relative h-full flex flex-col", className)}>{children}</div>;
}

interface SheetHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function SheetHeader({ className, children }: SheetHeaderProps) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>{children}</div>;
}

interface SheetTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function SheetTitle({ className, children }: SheetTitleProps) {
  return <h3 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h3>;
}

interface SheetDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function SheetDescription({ className, children }: SheetDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

interface SheetFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function SheetFooter({ className, children }: SheetFooterProps) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
  );
}

interface SheetCloseProps {
  className?: string;
  children?: React.ReactNode;
}

export function SheetClose({ className, children }: SheetCloseProps) {
  const { onOpenChange } = useSheetContext();

  return (
    <button
      type="button"
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
      onClick={() => onOpenChange(false)}
    >
      {children || <X className="h-4 w-4" />}
      <span className="sr-only">Close</span>
    </button>
  );
}
