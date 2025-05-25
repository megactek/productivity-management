"use client";

import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border bg-background",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-500 text-white",
        warning: "border-yellow-500 bg-yellow-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group toast group",
          title: "toast-title",
          description: "toast-description",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
          error: toastVariants({ variant: "destructive" }),
          success: toastVariants({ variant: "success" }),
          warning: toastVariants({ variant: "warning" }),
          info: toastVariants({ variant: "default" }),
        },
      }}
    />
  );
}

type ToastFunction = (props: ToastProps) => void;

interface ToastApi {
  toast: ToastFunction;
  success: (props: Omit<ToastProps, "variant">) => void;
  error: (props: Omit<ToastProps, "variant">) => void;
  warning: (props: Omit<ToastProps, "variant">) => void;
}

import { toast as sonnerToast } from "sonner";

export const toast: ToastApi = {
  toast: ({ title, description, variant, action }) => {
    sonnerToast(title, {
      description,
      action,
      className: cn(toastVariants({ variant })),
    });
  },
  success: ({ title, description, action }) => {
    sonnerToast.success(title, {
      description,
      action,
    });
  },
  error: ({ title, description, action }) => {
    sonnerToast.error(title, {
      description,
      action,
    });
  },
  warning: ({ title, description, action }) => {
    sonnerToast.warning(title, {
      description,
      action,
    });
  },
};
