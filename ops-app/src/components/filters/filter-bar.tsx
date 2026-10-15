"use client";

import { RefObject } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FilterBarProps = {
  search: string;
  onSearch: (value: string) => void;
  filters: { label: string; options: string[] }[];
  values: Record<string, string>;
  onChange: (label: string, value: string) => void;
  onClear: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
};

export function FilterBar({ search, onSearch, filters, values, onChange, onClear, searchRef }: FilterBarProps) {
  return (
    <div className="mb-3 rounded-lg border border-[#162131] bg-[#07101B] p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
          <Input ref={searchRef} value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search current table..." className="pl-8" />
        </div>
        <div className="grid flex-[2] grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {filters.slice(0, 5).map((filter, index) => (
            <Select key={`${filter.label}-${index}`} value={values[filter.label] ?? filter.options[0]} onChange={(value) => onChange(filter.label, value)} options={filter.options} ariaLabel={filter.label} />
          ))}
        </div>
        <button onClick={onClear} className="h-9 whitespace-nowrap px-2 text-xs font-medium text-[#A78BFA] transition-colors hover:text-white">
          Clear Filters
        </button>
      </div>
    </div>
  );
}
