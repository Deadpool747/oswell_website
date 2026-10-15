"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Kpi } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { iconMap } from "@/components/navigation/sidebar";

const accents = {
  purple: "bg-[#6D4AFF]/12 text-[#8B6CFF] ring-[#6D4AFF]/20",
  green: "bg-[#10B981]/12 text-[#34D399] ring-[#10B981]/20",
  blue: "bg-[#3B82F6]/12 text-[#60A5FA] ring-[#3B82F6]/20",
  orange: "bg-[#F59E0B]/12 text-[#FBBF24] ring-[#F59E0B]/20",
  red: "bg-[#EF4444]/12 text-[#F87171] ring-[#EF4444]/20",
  cyan: "bg-[#06B6D4]/12 text-[#22D3EE] ring-[#06B6D4]/20",
  slate: "bg-[#64748B]/12 text-[#CBD5E1] ring-[#64748B]/20"
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = iconMap[kpi.icon as keyof typeof iconMap] ?? iconMap.Activity;
  const TrendIcon = kpi.trendDirection === "down" ? ArrowDown : kpi.trendDirection === "neutral" ? Minus : ArrowUp;
  const trendColor = kpi.trendDirection === "down" ? "text-[#F87171]" : kpi.trendDirection === "neutral" ? "text-[#94A3B8]" : "text-[#34D399]";

  return (
    <div className="min-h-[88px] rounded-lg border border-[#162131] bg-[#09111C] p-4 transition-colors hover:border-[#26364E] hover:bg-[#0B1420]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{kpi.label}</div>
          <div className="mt-2 text-[23px] font-semibold leading-none text-white">{kpi.value}</div>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", accents[kpi.accent ?? "purple"])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {kpi.trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-[11px]", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span className="truncate">{kpi.trend}</span>
        </div>
      )}
    </div>
  );
}
