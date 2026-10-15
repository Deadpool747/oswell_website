import type { Accent, DetailSection, Kpi, TableColumn, TableRow } from "@/types/dashboard";

export const people = [
  ["Amit Kapoor", "IT Ops", "AK"],
  ["Priya Nair", "Platform Team", "PN"],
  ["Neha Sharma", "Data Governance", "NS"],
  ["Rahul Verma", "Security", "RV"],
  ["Vikram Singh", "AI Ethics", "VS"],
  ["Meera Joshi", "AI Governance", "MJ"],
  ["Arjun Patel", "Engineering", "AP"],
  ["Rohit Mehta", "AI Engineers", "RM"],
  ["Sneha Iyer", "Marketing", "SI"],
  ["Data Team", "Risk", "DT"]
];

export const months = [
  "Apr 26",
  "Apr 28",
  "May 1",
  "May 3",
  "May 6",
  "May 8",
  "May 11",
  "May 13",
  "May 16",
  "May 18",
  "May 21",
  "May 23",
  "May 25"
];

export const trendData = months.map((name, index) => ({
  name,
  value: Math.round(45 + index * 4 + Math.sin(index) * 14),
  secondary: Math.round(68 + index * 1.8 + Math.cos(index) * 8),
  cost: Math.round(22000 + index * 9200 + Math.sin(index / 2) * 9000)
}));

export const donutData = [
  { name: "Azure OpenAI Service", value: 42, color: "#6D4AFF" },
  { name: "Embedding Service", value: 15, color: "#3B82F6" },
  { name: "Vector DB", value: 12, color: "#06B6D4" },
  { name: "Data Storage", value: 9, color: "#F59E0B" },
  { name: "Compute", value: 8, color: "#10B981" },
  { name: "Other Services", value: 14, color: "#94A3B8" }
];

export const sentimentData = [
  { name: "Positive", value: 78.6, color: "#10B981" },
  { name: "Neutral", value: 13.9, color: "#3B82F6" },
  { name: "Negative", value: 7.5, color: "#EF4444" }
];

export const barData = [
  { name: "End User", value: 64.6 },
  { name: "Agent Rating", value: 20.9 },
  { name: "Support Ticket", value: 9.6 },
  { name: "Manual Review", value: 4.9 }
];

export function owner(index: number) {
  const [name, role, avatar] = people[index % people.length];
  return { owner: name, ownerRole: role, avatar };
}

export function makeRows(
  seed: TableRow[],
  total: number,
  variants: Partial<TableRow>[] = []
): TableRow[] {
  return Array.from({ length: total }, (_, index) => {
    const base = seed[index % seed.length];
    const variant = variants[index % Math.max(variants.length, 1)] ?? {};
    const person = owner(index);
    return {
      ...base,
      ...variant,
      ...person,
      id: `${base.id}-${index + 1}`,
      version: base.version ?? `v${1 + (index % 3)}.${index % 10}.${index % 4}`,
      time: base.time ?? `${2 + index * 3} mins ago`,
      lastUpdated: base.lastUpdated ?? `May ${15 - (index % 8)}, 2024\n${10 - (index % 5)}:${(20 + index * 7) % 60} AM`
    };
  });
}

export function defaultSections(title: string): DetailSection[] {
  return [
    {
      title: "Summary",
      text: `${title} is monitored across production controls, governance policies, and operational health signals.`,
      rows: [
        { label: "Environment", value: "Production", tone: "green" },
        { label: "Owner", value: "Amit Kapoor (IT Ops)" },
        { label: "Last Updated", value: "May 15, 2024 10:32 AM" }
      ]
    },
    {
      title: "Health & Usage",
      chart: "score",
      rows: [
        { label: "Health Score", value: "98%", tone: "green" },
        { label: "Risk Level", value: "Low", tone: "green" },
        { label: "Policy Status", value: "Allowed", tone: "green" }
      ]
    },
    {
      title: "Quick Actions",
      actions: ["Edit", "Clone", "View Audit Log", "Deactivate"]
    }
  ];
}

export function kpi(label: string, value: string, icon: string, accent: Accent, trend?: string, trendDirection: Kpi["trendDirection"] = "up"): Kpi {
  return { label, value, icon, accent, trend, trendDirection };
}

export const baseListColumns: TableColumn[] = [
  { key: "name", label: "Name", type: "entity", sortable: true, width: "260px" },
  { key: "type", label: "Type", type: "badge", sortable: true },
  { key: "environment", label: "Environment", type: "environment", sortable: true },
  { key: "status", label: "Status", type: "status", sortable: true },
  { key: "progress", label: "Health", type: "progress", sortable: true },
  { key: "risk", label: "Risk Level", type: "risk", sortable: true },
  { key: "time", label: "Last Activity", type: "text", sortable: true },
  { key: "owner", label: "Owner", type: "avatar", sortable: true },
  { key: "actions", label: "Actions", type: "actions" }
];
