export type Accent = "purple" | "green" | "blue" | "orange" | "red" | "cyan" | "slate";

export type Kpi = {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  description?: string;
  accent?: Accent;
};

export type RowValue = string | number | boolean | string[] | undefined;

export type TableRow = {
  id: string;
  name?: string;
  description?: string;
  owner?: string;
  ownerRole?: string;
  avatar?: string;
  status?: string;
  environment?: string;
  risk?: string;
  health?: string;
  progress?: number;
  time?: string;
  [key: string]: RowValue;
};

export type TableColumn = {
  key: string;
  label: string;
  type?:
    | "text"
    | "entity"
    | "badge"
    | "status"
    | "environment"
    | "risk"
    | "progress"
    | "avatar"
    | "actions"
    | "rating"
    | "tools";
  sortable?: boolean;
  width?: string;
};

export type DetailMetric = {
  label: string;
  value: string;
  tone?: Accent;
};

export type DetailSection = {
  title: string;
  rows?: DetailMetric[];
  text?: string;
  chart?: "line" | "donut" | "bars" | "score";
  actions?: string[];
};

export type DashboardChart = {
  title: string;
  type: "line" | "area" | "donut" | "bars" | "spark";
  dataKey?: string;
  secondaryKey?: string;
  data?: Array<Record<string, string | number | undefined>>;
  series?: Array<{ key: string; label: string; color: string }>;
  yDomain?: [number, number];
};

export type DashboardConfig = {
  title: string;
  subtitle: string;
  actionLabel: string;
  searchPlaceholder: string;
  kpis: Kpi[];
  tabs: string[];
  filters: {
    label: string;
    options: string[];
  }[];
  columns: TableColumn[];
  rows: TableRow[];
  details: {
    title: string;
    eyebrow?: string;
    status?: string;
    tabs?: string[];
    sections: DetailSection[];
  };
  charts?: DashboardChart[];
  sideCards?: DetailSection[];
  heroCards?: DetailSection[];
  pageKind?: "table" | "analytics" | "detail" | "workspace";
};
