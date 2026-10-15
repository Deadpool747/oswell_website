import { cn } from "@/lib/utils";

function labelForScore(score: number) {
  if (score >= 95) return { label: "Excellent", color: "#10B981" };
  if (score >= 88) return { label: "Good", color: "#34D399" };
  if (score >= 75) return { label: "Moderate", color: "#F59E0B" };
  if (score >= 55) return { label: "At Risk", color: "#F97316" };
  return { label: "Critical", color: "#EF4444" };
}

export function SecurityScore({ score, compact = false, className }: { score: number; compact?: boolean; className?: string }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const meta = labelForScore(safeScore);

  if (compact) {
    return (
      <div className={cn("min-w-[120px]", className)}>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-medium text-white">{safeScore}%</span>
          <span className="text-[#94A3B8]">{meta.label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1A2636]">
          <div className="h-full rounded-full" style={{ width: `${safeScore}%`, backgroundColor: meta.color }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] bg-[#07101B] text-center" style={{ borderColor: meta.color }}>
        <div>
          <div className="text-2xl font-semibold text-white">{safeScore}%</div>
          <div className="text-[10px] text-[#94A3B8]">{meta.label}</div>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-white">Security Score</div>
        <div className="mt-1 text-xs text-[#94A3B8]">Identity, context, memory, MCP, and policy signals.</div>
      </div>
    </div>
  );
}
