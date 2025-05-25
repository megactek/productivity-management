"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "./Button";
import { useAppNavigation } from "@/utils/navigation";

interface BackButtonProps {
  label?: string;
  className?: string;
  fallbackPath?: string;
}

export function BackButton({ label = "Back", className = "", fallbackPath }: BackButtonProps) {
  const { goBack, navigate } = useAppNavigation();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      goBack();
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate("/");
    }
  };

  return (
    <Button variant="ghost" size="sm" className={`mb-4 pl-1 ${className}`} onClick={handleClick}>
      <ChevronLeft className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
