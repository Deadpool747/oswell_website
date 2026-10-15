"use client";

import { Download, Filter, Menu, Plus, Search } from "lucide-react";
import { OswellMark } from "@/components/branding/oswell-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppShell } from "@/components/layout/app-shell";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actionLabel: string;
  searchPlaceholder: string;
  search: string;
  onSearch: (value: string) => void;
  onAction: (label: string) => void;
  activeFilterCount?: number;
  actionsDisabled?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  showAction?: boolean;
};

export function PageHeader({ title, subtitle, actionLabel, searchPlaceholder, search, onSearch, onAction, activeFilterCount = 0, actionsDisabled = false, showSearch = true, showFilters = true, showExport = true, showAction = true }: PageHeaderProps) {
  const { openMobileNav } = useAppShell();

  return (
    <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 xl:hidden">
          <Button variant="ghost" size="sm" aria-label="Open navigation" onClick={openMobileNav}>
            <Menu className="h-4 w-4" />
          </Button>
          <OswellMark className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Oswell</span>
        </div>
        <h1 className="text-[27px] font-semibold leading-tight text-white sm:text-[30px]">{title}</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[#94A3B8]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && <div className="relative w-full min-w-[260px] sm:w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholder} className="pl-8" disabled={actionsDisabled} />
        </div>}
        {showFilters && <Button onClick={() => onAction("Filters")} disabled={actionsDisabled}>
          <Filter className="h-4 w-4" />
          Filters
          <span className="rounded bg-[#1B123C] px-1.5 text-[10px] text-[#C4B5FD]">{activeFilterCount}</span>
        </Button>}
        {showExport && <Button onClick={() => onAction("Export CSV")} disabled={actionsDisabled}>
          <Download className="h-4 w-4" />
          Export
        </Button>}
        {showAction && <Button variant="primary" onClick={() => onAction(actionLabel)} disabled={actionsDisabled}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>}
      </div>
    </header>
  );
}
