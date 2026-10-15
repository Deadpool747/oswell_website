"use client";

import { ArrowDownUp, ChevronLeft, ChevronRight, MoreVertical, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge, DotStatus } from "@/components/badges/status-badge";
import { SecurityRiskBadge } from "@/components/security/security-risk-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TableColumn, TableRow } from "@/types/dashboard";

type DataTableProps = {
  columns: TableColumn[];
  rows: TableRow[];
  selectedId?: string;
  onSelect: (row: TableRow) => void;
  onRowAction: (label: string, row: TableRow) => void;
  onBulkAction?: (label: string, rows: TableRow[]) => void;
};

const pageSizeOptions = [10, 25, 50, 100];

export function DataTable({ columns, rows, selectedId, onSelect, onRowAction, onBulkAction }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [menuRowId, setMenuRowId] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aValue = sortableValue(a[sortKey]);
      const bValue = sortableValue(b[sortKey]);
      const result = typeof aValue === "number" && typeof bValue === "number" ? aValue - bValue : String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? result : -result;
    });
  }, [rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedRows = rows.filter((row) => checkedIds.includes(row.id));
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => checkedIds.includes(row.id));

  function toggleSort(column: TableColumn) {
    if (!column.sortable) return;
    if (sortKey === column.key && sortDirection === "desc") {
      setSortKey(null);
      setSortDirection("asc");
    } else if (sortKey === column.key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#162131] bg-[#09111C]">
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#162131] bg-[#07101B] px-4 py-2 text-xs text-[#DCE5F2]">
          <span className="font-medium text-white">{selectedRows.length} selected</span>
          {["Deactivate", "Assign Owner", "Export CSV", "Delete"].map((action) => (
            <Button key={action} size="sm" variant={action === "Delete" ? "danger" : "secondary"} onClick={() => onBulkAction?.(action, selectedRows)}>
              {action}
            </Button>
          ))}
          <button onClick={() => setCheckedIds([])} className="ml-auto text-[#A78BFA] hover:text-white">
            Deselect
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-b border-[#162131] bg-[#07101B]">
              <th className="w-10 px-3 py-3 text-left">
                <input
                  aria-label="Select all visible rows"
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) =>
                    setCheckedIds((current) =>
                      event.target.checked
                        ? Array.from(new Set([...current, ...visibleRows.map((row) => row.id)]))
                        : current.filter((id) => !visibleRows.some((row) => row.id === id))
                    )
                  }
                  className="h-3.5 w-3.5 rounded border-[#24334A] bg-[#050B14]"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className="px-3 py-3 text-left text-[11px] font-semibold text-[#94A3B8]"
                >
                  <button
                    onClick={() => toggleSort(column)}
                    className={cn("inline-flex items-center gap-1", column.sortable && "hover:text-white")}
                  >
                    {column.label}
                    {column.sortable && <ArrowDownUp className="h-3 w-3 opacity-60" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const selected = row.id === selectedId;
              const checked = checkedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row)}
                  className={cn(
                    "group relative h-[56px] border-b border-[#111B2A] bg-[#09111C] transition-colors hover:bg-[#0D1826]",
                    selected && "bg-[#111A2B]"
                  )}
                >
                  <td className="relative px-3">
                    {selected && <span className="absolute left-0 top-0 h-full w-0.5 bg-[#7C5CFF]" />}
                    <input
                      aria-label={`Select ${row.name ?? row.id}`}
                      type="checkbox"
                      checked={checked}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        setCheckedIds((current) => (event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id)))
                      }
                      className="h-3.5 w-3.5 rounded border-[#24334A] bg-[#050B14]"
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="max-w-[340px] px-3 py-2 align-middle text-[12px] text-[#DCE5F2]">
                      <Cell column={column} row={row} onRowAction={onRowAction} menuOpen={menuRowId === row.id} onToggleMenu={() => setMenuRowId((current) => (current === row.id ? null : row.id))} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#162131] px-4 py-3 text-xs text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing {sortedRows.length ? (safePage - 1) * pageSize + 1 : 0} to {Math.min(safePage * pageSize, sortedRows.length)} of {sortedRows.length} records
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border border-[#162131] bg-[#07101B] px-2 text-xs text-[#DCE5F2]"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              size="sm"
              variant={pageNumber === safePage ? "primary" : "ghost"}
              onClick={() => setPage(pageNumber)}
              className="w-8 px-0"
            >
              {pageNumber}
            </Button>
          ))}
          {totalPages > 5 && <span className="px-1">...</span>}
          {totalPages > 5 && (
            <Button size="sm" variant="ghost" onClick={() => setPage(totalPages)} className="w-8 px-0">
              {totalPages}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function sortableValue(value: TableRow[string]) {
  const text = String(value ?? "").replace(/[$,%]/g, "");
  const number = Number(text);
  if (Number.isFinite(number) && text.trim() !== "") return number;
  return String(value ?? "").toLowerCase();
}

function Cell({
  column,
  row,
  onRowAction,
  menuOpen,
  onToggleMenu
}: {
  column: TableColumn;
  row: TableRow;
  onRowAction: (label: string, row: TableRow) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const value = row[column.key];
  switch (column.type) {
    case "entity":
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#1B123C] text-[10px] font-semibold text-[#A78BFA]">
            {String(row.name ?? row.id).slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{row.name ?? row.id}</div>
            {row.description && <div className="truncate text-[10px] text-[#94A3B8]">{row.description}</div>}
          </div>
        </div>
      );
    case "badge":
      return <StatusBadge value={String(value ?? "")} />;
    case "status":
      return <DotStatus value={String(value ?? "")} />;
    case "environment":
      return <StatusBadge value={String(value ?? "")} />;
    case "risk":
      return <SecurityRiskBadge value={String(value ?? "")} />;
    case "progress": {
      const number = Number(value ?? row.progress ?? 0);
      const color = number < 75 ? "bg-[#EF4444]" : number < 88 ? "bg-[#F59E0B]" : "bg-[#10B981]";
      return (
        <div className="flex min-w-[110px] items-center gap-2">
          <span className="w-10 text-[11px] text-white">{Number.isFinite(number) ? `${number}%` : value}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1A2636]">
            <span className={cn("block h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, number))}%` }} />
          </span>
        </div>
      );
    }
    case "avatar":
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#0EA5E9] text-[10px] font-bold text-white">
            {row.avatar ?? "JS"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] text-white">{value}</div>
            {row.ownerRole && <div className="truncate text-[10px] text-[#94A3B8]">{row.ownerRole}</div>}
          </div>
        </div>
      );
    case "rating": {
      const count = Number(value ?? 0);
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={cn("h-3.5 w-3.5", index < count ? "fill-[#FBBF24] text-[#FBBF24]" : "text-[#334155]")} />
          ))}
        </div>
      );
    }
    case "tools": {
      const tools = Array.isArray(value) ? value : [];
      return (
        <div className="flex items-center gap-1">
          {tools.slice(0, 2).map((tool, index) => (
            <span key={`${tool}-${index}`} className="rounded bg-[#0B2340] px-1.5 py-0.5 text-[10px] text-[#60A5FA]">
              {tool.slice(0, 3)}
            </span>
          ))}
          {tools.length > 2 && <span className="text-[10px] text-[#94A3B8]">+{tools.length - 2}</span>}
        </div>
      );
    }
    case "actions":
      return (
        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu();
            }}
            className="rounded p-1 text-[#94A3B8] transition-colors hover:bg-[#162131] hover:text-white"
            aria-label="Open row actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 grid w-40 overflow-hidden rounded-md border border-[#24334A] bg-[#07101B] p-1 shadow-xl shadow-black/40">
              {rowActions(row).map((action) => (
                <button
                  key={action}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRowAction(action, row);
                    onToggleMenu();
                  }}
                  className={cn("rounded px-2 py-1.5 text-left text-[11px] hover:bg-[#101B2B] hover:text-white", action === "Delete" ? "text-[#FCA5A5]" : "text-[#DCE5F2]")}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    default:
      return <span className="block truncate whitespace-pre-line">{String(value ?? "")}</span>;
  }
}

function rowActions(row: TableRow) {
  const status = String(row.status ?? "").toLowerCase();
  return [
    "View Details",
    "Edit",
    "Clone",
    status.includes("active") || status.includes("enabled") ? "Deactivate" : "Activate",
    "Run Agent",
    "Test Connection",
    "Approve",
    "Reject",
    "Escalate",
    "Contain",
    "Resolve",
    "Sync Now",
    "Rotate",
    "Clear",
    "Copy ID",
    "Export JSON",
    "Delete"
  ];
}
