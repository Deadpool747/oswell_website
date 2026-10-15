import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-[#162131] bg-[#07101B] px-3 text-xs text-[#F5F7FA] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6D4AFF]/70",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
