import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  active: "bg-[#10B981]/10 text-[#34D399]",
  healthy: "bg-[#10B981]/10 text-[#34D399]",
  completed: "bg-[#10B981]/10 text-[#34D399]",
  passed: "bg-[#10B981]/10 text-[#34D399]",
  positive: "bg-[#10B981]/10 text-[#34D399]",
  allowed: "bg-[#10B981]/10 text-[#34D399]",
  approved: "bg-[#10B981]/10 text-[#34D399]",
  contained: "bg-[#10B981]/10 text-[#34D399]",
  enabled: "bg-[#10B981]/10 text-[#34D399]",
  trusted: "bg-[#10B981]/10 text-[#34D399]",
  production: "bg-[#10B981]/10 text-[#34D399]",
  staging: "bg-[#3B82F6]/10 text-[#60A5FA]",
  development: "bg-[#6D4AFF]/12 text-[#A78BFA]",
  uat: "bg-[#6D4AFF]/12 text-[#A78BFA]",
  warning: "bg-[#F59E0B]/12 text-[#FBBF24]",
  medium: "bg-[#F59E0B]/12 text-[#FBBF24]",
  pending: "bg-[#F59E0B]/12 text-[#FBBF24]",
  conditional: "bg-[#F59E0B]/12 text-[#FBBF24]",
  quarantined: "bg-[#F59E0B]/12 text-[#FBBF24]",
  elevated: "bg-[#F59E0B]/12 text-[#FBBF24]",
  "in review": "bg-[#F59E0B]/12 text-[#FBBF24]",
  "review required": "bg-[#F59E0B]/12 text-[#FBBF24]",
  high: "bg-[#EF4444]/12 text-[#F87171]",
  critical: "bg-[#EF4444]/12 text-[#F87171]",
  failed: "bg-[#EF4444]/12 text-[#F87171]",
  blocked: "bg-[#EF4444]/12 text-[#F87171]",
  rejected: "bg-[#EF4444]/12 text-[#F87171]",
  expired: "bg-[#EF4444]/12 text-[#F87171]",
  negative: "bg-[#EF4444]/12 text-[#F87171]",
  disabled: "bg-[#64748B]/12 text-[#94A3B8]",
  inactive: "bg-[#64748B]/12 text-[#94A3B8]",
  draft: "bg-[#3B82F6]/10 text-[#60A5FA]",
  deprecated: "bg-[#64748B]/12 text-[#94A3B8]",
  low: "bg-[#10B981]/10 text-[#34D399]",
  neutral: "bg-[#3B82F6]/10 text-[#60A5FA]"
};

export function StatusBadge({ value, className }: { value?: string | number; className?: string }) {
  const text = String(value ?? "N/A");
  const key = text.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center rounded px-1.5 text-[10px] font-medium leading-none",
        tones[key] ?? "bg-[#6D4AFF]/12 text-[#A78BFA]",
        className
      )}
    >
      <span className="truncate">{text}</span>
    </span>
  );
}

export function DotStatus({ value }: { value?: string }) {
  const key = (value ?? "").toLowerCase();
  const color = key.includes("fail") || key.includes("high") || key.includes("blocked") ? "bg-[#EF4444]" : key.includes("warn") || key.includes("medium") ? "bg-[#F59E0B]" : key.includes("inactive") || key.includes("offline") ? "bg-[#64748B]" : "bg-[#10B981]";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#DCE5F2]">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      {value}
    </span>
  );
}
