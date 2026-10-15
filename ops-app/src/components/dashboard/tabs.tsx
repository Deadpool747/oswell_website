"use client";

import { cn } from "@/lib/utils";

export function DashboardTabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-3 flex gap-6 overflow-x-auto border-b border-[#162131]">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "relative h-10 shrink-0 text-xs font-medium text-[#94A3B8] transition-colors hover:text-white",
            value === tab && "text-[#C4B5FD]"
          )}
        >
          {tab}
          {value === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#7C5CFF]" />}
        </button>
      ))}
    </div>
  );
}
