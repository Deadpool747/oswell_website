"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  ariaLabel?: string;
};

export function Select({ value, onChange, options, className, ariaLabel }: SelectProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{ariaLabel ?? "Select option"}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-[#162131] bg-[#07101B] px-3 pr-8 text-xs text-[#DCE5F2] outline-none transition-colors hover:border-[#26364E] focus:border-[#6D4AFF]/70"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
    </label>
  );
}
