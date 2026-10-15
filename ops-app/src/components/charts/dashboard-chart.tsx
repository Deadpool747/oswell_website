"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardChart } from "@/types/dashboard";
import { barData, donutData, sentimentData, trendData } from "@/data/common";

const tooltipStyle = {
  background: "#09111C",
  border: "1px solid #24334A",
  borderRadius: 8,
  color: "#F5F7FA",
  fontSize: 12
};

export function ChartPanel({ chart, onViewAll }: { chart: DashboardChart; onViewAll?: () => void }) {
  return (
    <div className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">{chart.title}</h3>
        <button onClick={onViewAll} className="text-xs font-medium text-[#A78BFA] hover:text-white">View All</button>
      </div>
      <div className="h-[230px]">
        <ChartRenderer chart={chart} />
      </div>
    </div>
  );
}

export function MiniChart({ type = "line" }: { type?: "line" | "donut" | "bars" | "score" }) {
  if (type === "score") {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-[#10B981] bg-[#07101B] text-center">
          <div>
            <div className="text-2xl font-semibold text-white">0.91</div>
            <div className="text-[10px] text-[#94A3B8]">Score</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-28">
      <ChartRenderer chart={{ title: "", type: type === "donut" ? "donut" : type === "bars" ? "bars" : "line" }} compact />
    </div>
  );
}

function ChartRenderer({ chart, compact = false }: { chart: DashboardChart; compact?: boolean }) {
  if (chart.type === "donut") {
    const data = chart.data ?? (chart.title.includes("Sentiment") ? sentimentData : donutData);
    return (
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <PieChart>
          <Pie data={data} innerRadius={compact ? 32 : 56} outerRadius={compact ? 48 : 82} paddingAngle={2} dataKey="value" isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={String(entry.color ?? "#6D4AFF")} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "bars") {
    const data = chart.data ?? barData;
    return (
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart data={data} layout={compact ? "horizontal" : "vertical"} margin={{ left: compact ? 0 : 22, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#162131" strokeDasharray="3 3" horizontal={!compact} vertical={compact} />
          <XAxis type={compact ? "category" : "number"} dataKey={compact ? "name" : undefined} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis type={compact ? "number" : "category"} dataKey={compact ? undefined : "name"} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} width={compact ? 24 : 96} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill="#6D4AFF" radius={[3, 3, 3, 3]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "area") {
    const data = chart.data ?? trendData;
    const series = chart.series ?? [{ key: chart.dataKey ?? "value", label: chart.title, color: "#7C5CFF" }];
    return (
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="purpleArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#162131" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={chart.yDomain} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {series.map((item, index) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              fill={index === 0 ? "url(#purpleArea)" : item.color}
              fillOpacity={index === 0 ? 1 : 0.04}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  const data = chart.data ?? trendData;
  const series = chart.series ?? [
    { key: "value", label: chart.title, color: "#7C5CFF" },
    ...(chart.secondaryKey || chart.title.includes("Feedback") ? [{ key: "secondary", label: "Secondary", color: "#10B981" }] : [])
  ];

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={50}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
        <CartesianGrid stroke="#162131" strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis domain={chart.yDomain} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.map((item) => (
          <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
