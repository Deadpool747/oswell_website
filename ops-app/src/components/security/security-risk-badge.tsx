import { cn } from "@/lib/utils";

const riskTone: Record<string, string> = {
  critical: "bg-[#EF4444]/15 text-[#FCA5A5] ring-[#EF4444]/25",
  high: "bg-[#F97316]/15 text-[#FDBA74] ring-[#F97316]/25",
  medium: "bg-[#F59E0B]/12 text-[#FBBF24] ring-[#F59E0B]/25",
  low: "bg-[#10B981]/10 text-[#34D399] ring-[#10B981]/25",
  informational: "bg-[#3B82F6]/10 text-[#60A5FA] ring-[#3B82F6]/25"
};

export function SecurityRiskBadge({ value, className }: { value?: string; className?: string }) {
  const text = value ?? "Informational";
  const key = text.toLowerCase();

  return (
    <span className={cn("inline-flex h-5 max-w-full items-center rounded px-1.5 text-[10px] font-medium leading-none ring-1", riskTone[key] ?? riskTone.informational, className)}>
      <span className="truncate">{text}</span>
    </span>
  );
}
