"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardTabs } from "@/components/dashboard/tabs";
import { FilterBar } from "@/components/filters/filter-bar";
import { DataTable } from "@/components/tables/data-table";
import { EntityDetailsPanel } from "@/components/drawers/entity-details-panel";
import { OpenAIConnectionCard } from "@/components/connections/openai-connection-card";
import { FoundryConnectionCard } from "@/components/connections/foundry-connection-card";
import { FoundryAgentsPanel } from "@/components/agents/foundry-agents-panel";
import { ChartPanel, MiniChart } from "@/components/charts/dashboard-chart";
import { StatusBadge } from "@/components/badges/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveDataUnavailableNotice } from "@/components/dashboard/demo-data-notice";
import { useOswellStore } from "@/store/oswell-store";
import { connectionStages } from "@/services/demoConnectionTester";
import { runStages } from "@/services/demoExecutionEngine";
import { testStages } from "@/services/demoTestRunner";
import { copyJSON, copyText, downloadCSV, downloadJSON } from "@/services/exportService";
import type { DashboardConfig, DetailSection, TableRow } from "@/types/dashboard";
import { demoDataEnabled } from "@/lib/runtime/demo-data";

const reviewStages = ["Collecting Evidence", "Analyzing Signals", "Scoring Risk", "Preparing Findings", "Ready"];
const isDemoMode = process.env.NEXT_PUBLIC_APP_MODE === "demo";

export function DashboardPage({ config }: { config: DashboardConfig }) {
  const store = useOswellStore();
  const rows = store.getRows(config);
  const stateKey = store.getKey(config);
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeTab, setActiveTab] = useState(config.tabs[0] ?? "Overview");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<TableRow | undefined>(rows[0]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState(config.details.tabs?.[0] ?? "Overview");
  const [form, setForm] = useState<{ mode: "create" | "edit"; row?: TableRow } | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; row?: TableRow; rows?: TableRow[] } | null>(null);
  const [progress, setProgress] = useState<{ title: string; stages: string[]; step: number; row?: TableRow; kind: "run" | "connection" | "sync" | "test" | "review" } | null>(null);
  const [showReset, setShowReset] = useState(false);
  const filterSearchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selected || !rows.some((row) => row.id === selected.id)) {
      setSelected(rows[0]);
    } else {
      setSelected(rows.find((row) => row.id === selected.id));
    }
  }, [rows, selected?.id]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function focusFilters() {
    const input = filterSearchRef.current;
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
      notify("Focused the filters.");
      return;
    }
    notify("Filters are ready below.");
  }

  function openRowDetails(row = selected, preferredTab?: string, message?: string) {
    if (!row) {
      notify("No records are available.");
      return;
    }
    setSelected(row);
    setPanelOpen(true);
    if (preferredTab) {
      setActiveDetailsTab(preferredTab);
    }
    if (message) {
      notify(message);
    }
  }

  function handleTopLevelTabChange(tab: string) {
    setActiveTab(tab);
  }

  async function handleAction(label: string, row = selected) {
    const lower = label.toLowerCase();

    try {
      if (lower.includes("filter")) {
        focusFilters();
        return;
      }
      if (lower.includes("export csv") || lower === "export") {
        downloadCSV(scopeName(config.title), filteredRows);
        notify(`Exported ${filteredRows.length} records to CSV.`);
        return;
      }
      if (lower.includes("export json")) {
        downloadJSON(scopeName(config.title), row ? [row] : filteredRows);
        notify("JSON export downloaded.");
        return;
      }
      if (lower.includes("copy")) {
        void (lower.includes("json") ? copyJSON(row ?? filteredRows) : copyText(String(row?.id ?? config.title))).then(() => notify("Copied to clipboard."));
        return;
      }
      if (isCreateAction(label)) {
        setForm({ mode: "create" });
        return;
      }
      if (lower === "edit" && row) {
        setForm({ mode: "edit", row });
        return;
      }
      if (lower === "delete" && row) {
        setConfirm({ action: "Delete", row });
        return;
      }
      if (lower === "clone" && row) {
        const clone = await store.cloneRow(stateKey, row);
        setSelected(clone);
        notify(`${clone.name ?? clone.id} created.`);
        return;
      }
      if (lower.includes("import azure")) {
        const response = await store.executeAction("import-azure-agents");
        notify(`Imported ${response.imported ?? 0} Azure agents from the backend.`);
        return;
      }
      if ((lower.includes("create new version") || lower.includes("change prompt")) && row) {
        const response = await store.executeAction("change-prompt", { row, key: stateKey });
        const nextRow = response.row ?? row;
        setSelected(nextRow);
        notify(`${nextRow.name ?? nextRow.id} advanced to ${nextRow.version ?? "a new version"}.`);
        return;
      }
      if (lower === "run") {
        setProgress({ title: "Run Agent", stages: runStages, step: 0, row: row ?? filteredRows[0], kind: "run" });
        return;
      }
      if (lower.includes("open details") || lower.includes("view details")) {
        openRowDetails(row);
        return;
      }
      if (lower.includes("run agent") || lower.includes("retry") || lower.includes("replay") || lower.includes("test prompt")) {
        setProgress({ title: "Run Agent", stages: runStages, step: 0, row, kind: "run" });
        return;
      }
      if (lower.includes("test connection")) {
        setProgress({ title: "Test Connection", stages: connectionStages, step: 0, row, kind: "connection" });
        return;
      }
      if (lower.includes("run test")) {
        setProgress({ title: "Run Test Suite", stages: testStages, step: 0, row, kind: "test" });
        return;
      }
      if (lower.includes("run security review") || lower.startsWith("review ") || lower.startsWith("assess ") || lower.startsWith("scan ")) {
        setProgress({ title: label, stages: reviewStages, step: 0, row, kind: "review" });
        return;
      }
      if (lower.includes("sync") || lower.includes("index") || lower.includes("backup")) {
        setProgress({ title: label, stages: ["Connecting", "Scanning", "Importing", "Chunking", "Indexing", "Ready"], step: 0, row, kind: "sync" });
        return;
      }
      if (row && ["activate", "deactivate", "enable", "disable", "approve", "reject", "escalate", "contain", "resolve", "reopen", "block", "allow", "quarantine", "revoke", "rotate", "clear"].some((item) => lower.includes(item))) {
        setConfirm({ action: label, row });
        return;
      }
      if (lower.includes("reset demo data")) {
        setShowReset(true);
        return;
      }
      if (lower.includes("view security")) {
        window.location.href = "/security/identity-access";
        return;
      }
      const preferredTab = guessDetailsTab(label, config.details.tabs ?? []);
      if (preferredTab && row) {
        openRowDetails(row, preferredTab);
        return;
      }
      notify(`${label} updated the current Oswell backend state.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : `${label} failed.`);
    }
  }

  const tabFilteredRows = useMemo(() => {
    return rows.filter((row) => matchesActiveTab(config, activeTab, row));
  }, [activeTab, config, rows]);

  const visibleCharts = useMemo(() => {
    return getVisibleDashboardItems(config, activeTab, config.charts);
  }, [activeTab, config]);

  const visibleSideCards = useMemo(() => {
    return getVisibleDashboardItems(config, activeTab, config.sideCards);
  }, [activeTab, config]);

  const filteredRows = useMemo(() => {
    const query = `${search} ${tableSearch}`.trim().toLowerCase();
    return tabFilteredRows.filter((row) => {
      const matchesQuery = !query || Object.values(row).join(" ").toLowerCase().includes(query);
      const matchesFilters = Object.entries(filters).every(([label, value]) => {
        if (!value || value.startsWith("All ")) return true;
        return matchesFilterValue(row, label, value);
      });
      return matchesQuery && matchesFilters;
    });
  }, [filters, search, tabFilteredRows, tableSearch]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelected(undefined);
      return;
    }

    if (!selected || !filteredRows.some((row) => row.id === selected.id)) {
      setSelected(filteredRows[0]);
    }
  }, [filteredRows, selected]);

  useEffect(() => {
    if (!progress) return;
    if (progress.step >= progress.stages.length - 1) {
      const timer = window.setTimeout(() => {
        void completeProgress(progress);
      }, 550);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setProgress((current) => (current ? { ...current, step: current.step + 1 } : current)), progress.kind === "run" ? 650 : 500);
    return () => window.clearTimeout(timer);
  }, [progress]);

  async function completeProgress(current: NonNullable<typeof progress>) {
    try {
      if (current.kind === "run") {
        const response = await store.executeAction("run-agent", { row: current.row, key: stateKey });
        const run = response.row;
        if (run) {
          notify(`${run.id} finished with status ${run.status}.`);
        } else {
          notify("Run completed.");
        }
      }
      if (current.kind === "connection" && current.row) {
        const response = await store.executeAction("test-connection", { row: current.row, key: stateKey });
        notify(response.result?.message ?? "Connection test completed.");
      }
      if (current.kind === "sync" && current.row) {
        await store.executeAction("sync-row", { row: current.row, key: stateKey });
        notify(`${current.title} completed.`);
      }
      if (current.kind === "test" && current.row) {
        const response = await store.executeAction("run-test", { row: current.row, key: stateKey });
        const result = response.row;
        if (result) {
          notify(`${result.name} completed with ${result.progress}% pass rate.`);
        } else {
          notify("Test suite completed.");
        }
      }
      if (current.kind === "review") {
        if (current.row) {
          await store.updateRow(stateKey, current.row.id, { lastUpdated: new Date().toLocaleString(), time: "Just now" }, `${current.title} Completed`);
          openRowDetails(current.row, guessDetailsTab(current.title, config.details.tabs ?? []) ?? undefined);
        }
        notify(`${current.title} completed.`);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : `${current.title} failed.`);
    } finally {
      setProgress(null);
    }
  }

  const activeFilterCount = Object.values(filters).filter((value) => value && !value.startsWith("All ")).length + (tableSearch ? 1 : 0);
  const demoDataDisabled = !demoDataEnabled();

  if (demoDataDisabled) {
    return (
      <AppShell>
        <PageHeader
          title={config.title}
          subtitle={config.subtitle}
          actionLabel={config.actionLabel}
          searchPlaceholder="Live data source not connected"
          search=""
          onSearch={() => undefined}
          onAction={() => undefined}
          activeFilterCount={0}
          actionsDisabled
        />
        <LiveDataUnavailableNotice title={config.title} />
        {config.title === "Connection Center" && <div className="mt-4"><FoundryConnectionCard /></div>}
        {config.title === "Agent Registry" && <div className="mt-4"><FoundryAgentsPanel /></div>}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actionLabel={config.actionLabel}
        searchPlaceholder={config.searchPlaceholder}
        search={search}
        onSearch={setSearch}
        onAction={handleAction}
        activeFilterCount={activeFilterCount}
      />

      {config.title === "Connection Center" && <><FoundryConnectionCard /><OpenAIConnectionCard /></>}
      {config.title === "Agent Registry" && <FoundryAgentsPanel />}

      {store.error && (
        <div className="mb-3 rounded-lg border border-[#7F1D1D] bg-[#2A1014] px-4 py-3 text-xs text-[#FCA5A5]">
          Backend sync issue: {store.error}
        </div>
      )}

      {store.loading && (
        <div className="mb-3 rounded-lg border border-[#162131] bg-[#09111C] px-4 py-3 text-xs text-[#94A3B8]">
          Loading backend data...
        </div>
      )}

      {isDemoMode && config.heroCards && (
        <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {config.heroCards.map((card, index) => (
            <div key={`${card.title}-${index}`} className="flex items-center justify-between rounded-lg border border-[#162131] bg-[#09111C] px-4 py-3">
              <div className="text-sm font-semibold text-white">{card.title}</div>
              <StatusBadge value={getHeroCardStatus(config, store.records, card.title, card.rows?.[0]?.value)} />
            </div>
          ))}
        </div>
      )}

      <section className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        {(isDemoMode ? config.kpis : [{ label: "Records", value: String(rows.length), icon: "Database", description: "Records returned by the Oswell API", accent: "blue" as const }]).map((item, index) => (
          <KpiCard key={`${item.label}-${index}`} kpi={item} />
        ))}
      </section>

      <DashboardTabs tabs={config.tabs} value={activeTab} onChange={handleTopLevelTabChange} />

      {isDemoMode && visibleCharts && (
        <section className="mb-4 grid gap-3 lg:grid-cols-2">
          {visibleCharts.slice(0, config.pageKind === "analytics" ? 4 : 3).map((chart, index) => (
            <ChartPanel key={`${chart.title}-${index}`} chart={chart} onViewAll={() => handleAction(`View All ${chart.title}`)} />
          ))}
        </section>
      )}

      {isDemoMode && visibleSideCards && (
        <section className="mb-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visibleSideCards.map((card, index) => (
            <DetailCard key={`${card.title}-${index}`} section={card} onAction={handleAction} />
          ))}
        </section>
      )}

      <FilterBar
        search={tableSearch}
        onSearch={setTableSearch}
        filters={config.filters}
        values={filters}
        onChange={(label, value) => setFilters((current) => ({ ...current, [label]: value }))}
        onClear={() => {
          setFilters({});
          setTableSearch("");
          notify("Filters cleared.");
        }}
        searchRef={filterSearchRef}
      />

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={config.columns}
            rows={filteredRows}
            selectedId={selected?.id}
            onSelect={(row) => {
              setSelected(row);
              setPanelOpen(true);
            }}
            onRowAction={(label, row) => handleAction(label, row)}
            onBulkAction={(label, selectedRows) => (label === "Export CSV" ? downloadCSV(scopeName(config.title), selectedRows) : setConfirm({ action: label, rows: selectedRows }))}
          />
        </div>
        <EntityDetailsPanel
          config={config}
          selected={selected}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          onAction={(label) => handleAction(label, selected)}
          activeTab={activeDetailsTab}
          onTabChange={setActiveDetailsTab}
        />
      </div>

      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-5 right-5 z-30 rounded-lg border border-[#6D4AFF]/40 bg-[#1B123C] px-3 py-2 text-xs font-medium text-white shadow-lg shadow-black/30"
        >
          Open Details
        </button>
      )}

      <AnimatePresence>
        {form && <EntityForm config={config} initial={form.row} mode={form.mode} onClose={() => setForm(null)} onSave={async (row) => {
          try {
            if (form.mode === "create") {
              const next = { ...row, id: row.id || generateId(stateKey), time: "Just now", status: row.status || (String(row.name ?? "").includes("Draft") ? "Draft" : "Active") };
              const created = await store.createRow(stateKey, next, "Created");
              setSelected(created);
              notify(`${created.name ?? created.id} created.`);
            } else if (form.row) {
              await store.updateRow(stateKey, form.row.id, row, "Edited");
              setSelected((currentSelected) => (currentSelected?.id === form.row?.id ? { ...currentSelected, ...row } : currentSelected));
              notify(`${row.name ?? form.row.name ?? form.row.id} saved.`);
            }
            setForm(null);
          } catch (error) {
            notify(error instanceof Error ? error.message : "Save failed.");
          }
        }} />}
        {confirm && <ConfirmDialog action={confirm.action} name={confirm.row?.name ?? confirm.row?.id ?? `${confirm.rows?.length ?? 0} records`} onCancel={() => setConfirm(null)} onConfirm={async () => {
          try {
            const targets = confirm.rows ?? (confirm.row ? [confirm.row] : []);
            await Promise.all(targets.map((target) => applyConfirmedAction(confirm.action, target, stateKey, store)));
            notify(`${confirm.action} completed for ${targets.length} record${targets.length === 1 ? "" : "s"}.`);
            setConfirm(null);
          } catch (error) {
            notify(error instanceof Error ? error.message : `${confirm.action} failed.`);
          }
        }} />}
        {progress && <ProgressDialog progress={progress} />}
        {showReset && <ConfirmDialog action="Reset Demo Data" name="all Oswell backend demo changes" destructive onCancel={() => setShowReset(false)} onConfirm={async () => {
          try {
            await store.resetDemo();
            setShowReset(false);
            notify("Original Oswell sample data restored.");
          } catch (error) {
            notify(error instanceof Error ? error.message : "Reset failed.");
          }
        }} />}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#24334A] bg-[#09111C] px-4 py-3 text-xs text-white shadow-xl shadow-black/40"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function DetailCard({ section, onAction }: { section: DetailSection; onAction: (label: string) => void }) {
  return (
    <section className="rounded-lg border border-[#162131] bg-[#09111C] p-4">
      <h3 className="mb-3 text-[15px] font-semibold text-white">{section.title}</h3>
      {section.text && <p className="mb-3 whitespace-pre-line text-[12px] leading-5 text-[#B6C2D2]">{section.text}</p>}
      {section.chart && <MiniChart type={section.chart} />}
      {section.rows && (
        <div className="space-y-2">
          {section.rows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#94A3B8]">{row.label}</span>
              <span className="max-w-[190px] truncate text-right font-medium text-white">
                {row.tone ? <StatusBadge value={row.value} /> : row.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {section.actions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {section.actions.map((action, index) => (
            <Button key={`${action}-${index}`} size="sm" variant={action.toLowerCase().includes("delete") || action.toLowerCase().includes("revoke") ? "danger" : "secondary"} onClick={() => onAction(action)}>
              {action}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}

export function NotFoundDashboard() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-[#162131] bg-[#09111C] p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Dashboard Not Found</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">This route is not configured in the Oswell AI Operations Platform.</p>
          <Button asChild className="mt-5" variant="primary">
            <a href="/live-runs">Go to Live Runs</a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function EntityForm({ config, initial, mode, onClose, onSave }: { config: DashboardConfig; initial?: TableRow; mode: "create" | "edit"; onClose: () => void; onSave: (row: TableRow) => void | Promise<void> }) {
  const fieldKeys = Array.from(new Set(["name", "description", ...config.columns.map((column) => column.key)])).filter((key) => !["actions", "owner", "avatar", "lastUpdated", "time"].includes(key));
  const [values, setValues] = useState<TableRow>(() => initial ?? { id: "", name: "", status: "Active", environment: "Production", risk: "Low" });
  const nameMissing = !String(values.name ?? values.agent ?? "").trim();
  return (
    <ModalShell title={mode === "create" ? config.actionLabel : `Edit ${initial?.name ?? initial?.id}`}>
      <div className="grid gap-3 md:grid-cols-2">
        {fieldKeys.slice(0, 12).map((key) => (
          <label key={key} className={key === "description" ? "md:col-span-2" : ""}>
            <span className="mb-1 block text-[11px] font-medium capitalize text-[#94A3B8]">{key.replace(/([A-Z])/g, " $1")}</span>
            <Input value={String(values[key] ?? "")} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
          </label>
        ))}
      </div>
      {nameMissing && <div className="mt-3 text-xs text-[#FCA5A5]">Name or primary label is required.</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        {mode === "create" && <Button onClick={() => void onSave({ ...values, status: "Draft" })} disabled={nameMissing}>Save Draft</Button>}
        <Button variant="primary" onClick={() => void onSave(values)} disabled={nameMissing}>{mode === "create" ? "Create" : "Save Changes"}</Button>
      </div>
    </ModalShell>
  );
}

function ConfirmDialog({ action, name, destructive, onCancel, onConfirm }: { action: string; name: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void | Promise<void> }) {
  const isDestructive = destructive || ["delete", "clear", "revoke", "reset"].some((word) => action.toLowerCase().includes(word));
  return (
    <ModalShell title={action}>
      <p className="text-sm leading-6 text-[#B6C2D2]">
        Confirm <span className="font-semibold text-white">{action}</span> for <span className="font-semibold text-white">{name}</span>. This will update Oswell data, related tables, activity, and audit history.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={isDestructive ? "danger" : "primary"} onClick={() => void onConfirm()}>{action}</Button>
      </div>
    </ModalShell>
  );
}

function ProgressDialog({ progress }: { progress: { title: string; stages: string[]; step: number } }) {
  const percent = Math.round(((progress.step + 1) / progress.stages.length) * 100);
  return (
    <ModalShell title={progress.title}>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#1A2636]">
        <div className="h-full rounded-full bg-[#7C5CFF] transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="space-y-2">
        {progress.stages.map((stage, index) => (
          <div key={`${stage}-${index}`} className="flex items-center justify-between rounded-md border border-[#162131] bg-[#07101B] px-3 py-2 text-xs">
            <span className={index <= progress.step ? "text-white" : "text-[#64748B]"}>{stage}</span>
            <StatusBadge value={index < progress.step ? "Completed" : index === progress.step ? "Active" : "Pending"} />
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-2xl rounded-xl border border-[#24334A] bg-[#09111C] p-5 shadow-2xl shadow-black/50">
        <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function isCreateAction(label: string) {
  const lower = label.toLowerCase();
  return ["create", "add", "register", "submit feedback", "set budget", "new "].some((word) => lower.includes(word)) && !lower.includes("incident from");
}

function matchesActiveTab(config: DashboardConfig, activeTab: string, row: TableRow) {
  const tab = activeTab.trim().toLowerCase();
  if (!tab || tab === "overview" || tab.startsWith("all ")) return true;

  const values = Object.values(row).join(" ").toLowerCase();

  if (config.title === "Live Runs") {
    if (tab.includes("azure")) return values.includes("azure ai foundry");
    if (tab.includes("copilot")) return values.includes("copilot studio");
    if (tab.includes("app insights")) return values.includes("app insights");
    if (tab.includes("power platform")) return values.includes("power platform");
  }

  if (config.title === "Agent Registry") {
    if (tab.includes("task")) return String(row.type ?? "").toLowerCase() === "task";
    if (tab.includes("assistant")) return String(row.type ?? "").toLowerCase() === "assistant";
    if (tab.includes("analysis")) return String(row.type ?? "").toLowerCase() === "analysis";
    if (tab.includes("generator")) return String(row.type ?? "").toLowerCase() === "generator";
    if (tab.includes("draft")) return String(row.status ?? "").toLowerCase().includes("draft");
  }

  if (config.title === "Connector & MCP Governance") {
    if (tab.includes("mcp")) return values.includes("mcp");
    if (tab.includes("datastore")) return /(database|data warehouse|document store|file storage|knowledge base)/.test(values);
    if (tab.includes("api")) return /api|oauth|payment|crm/.test(values);
    if (tab.includes("service")) return /service|collaboration|itsm|ai service/.test(values);
    if (tab.includes("custom")) return values.includes("custom");
  }

  if (config.title === "Policy Center") {
    if (tab.includes("data")) return String(row.type ?? "").toLowerCase() === "data";
    if (tab.includes("security")) return String(row.type ?? "").toLowerCase() === "security";
    if (tab.includes("usage")) return String(row.type ?? "").toLowerCase() === "usage";
    if (tab.includes("access")) return /(access)/.test(values);
    if (tab.includes("compliance")) return /(compliance)/.test(String(row.type ?? "").toLowerCase());
    if (tab.includes("custom")) return /(ai governance|custom)/.test(values);
  }

  if (config.title === "Approvals & Audit") {
    if (tab.includes("audit")) return true;
    return String(row.status ?? "").toLowerCase() === tab;
  }

  if (config.title === "Configuration Center") {
    if (tab.includes("model")) return String(row.type ?? "").toLowerCase() === "model";
    if (tab.includes("prompt")) return String(row.type ?? "").toLowerCase() === "prompt";
    if (tab.includes("tool")) return /(tool|mcp server)/.test(String(row.type ?? "").toLowerCase());
    if (tab.includes("guardrail")) return String(row.type ?? "").toLowerCase() === "guardrail";
    if (tab.includes("routing")) return String(row.type ?? "").toLowerCase() === "routing";
    if (tab.includes("quota")) return String(row.type ?? "").toLowerCase() === "quota";
    if (tab.includes("environment")) return String(row.type ?? "").toLowerCase() === "environment";
    if (tab.includes("connector")) return /(connector|mcp server)/.test(String(row.type ?? "").toLowerCase());
  }

  if (config.title === "RAG & Knowledge Governance") {
    if (tab.includes("knowledge")) return true;
    if (tab.includes("vector")) return /(vector|chunk|index)/.test(values);
    if (tab.includes("retrieval")) return /(retrieval|policy|relevance)/.test(values);
    if (tab.includes("citation") || tab.includes("grounding")) return /(citation|grounding|relevance|progress)/.test(values);
    if (tab.includes("access") || tab.includes("lineage")) return /(access|lineage|sensitivity|confidential|internal|public)/.test(values);
  }

  if (config.title === "Secrets & Credentials") {
    if (tab.includes("vault")) return /(vault)/.test(String(row.vault ?? ""));
    if (tab.includes("api key")) return String(row.type ?? "").toLowerCase() === "api key";
    if (tab.includes("oauth")) return String(row.type ?? "").toLowerCase() === "oauth client";
    if (tab.includes("certificate")) return String(row.type ?? "").toLowerCase() === "certificate";
    if (tab.includes("service principal")) return String(row.type ?? "").toLowerCase() === "service principal";
  }

  if (config.title === "AI Security Center") {
    if (tab === "overview" || tab === "threats") return true;
    if (tab.includes("identity")) return /(privilege|credential|oauth|permission|identity)/.test(values);
    if (tab.includes("mcp")) return /(mcp|tool call|refund\\.execute)/.test(values);
    if (tab.includes("context")) return /(context|retrieved document|agent context)/.test(values);
    if (tab.includes("memory")) return /(memory|conversation memory)/.test(values);
    if (tab.includes("incident")) return /(critical|contained|open)/.test(String(row.status ?? "").toLowerCase());
  }

  if (config.title === "Agent Identity & Access") {
    if (tab.includes("agent ident")) return true;
    if (tab.includes("delegation")) return Boolean(row.delegatedBy);
    if (tab.includes("owners")) return Boolean(row.delegatedBy || row.name);
    if (tab.includes("audit")) return /(review required|elevated|high)/.test(values);
  }

  if (config.title === "MCP & Tool Security") {
    if (tab.includes("mcp server")) return true;
    if (tab.includes("authorization")) return /(approval|authentication|oidc|mtls|session broker)/.test(values);
    if (tab.includes("isolation")) return /(sandbox|private network|vendor vpn|restricted|isolat)/.test(values);
    if (tab.includes("egress")) return /(egress|allowlisted|private network|browser sandbox|vendor vpn)/.test(values);
    if (tab.includes("audit")) return /(anomalies|review required|conditional|restricted)/.test(values);
  }

  if (config.title === "Context Security") {
    if (tab === "threats" || tab.includes("audit")) return true;
    if (tab.includes("prompt injection")) return /(prompt injection|policy override phrase|instruction boundary)/.test(values);
    if (tab.includes("rag context")) return /(retrieved document|rag context|document context)/.test(values);
    if (tab.includes("tool outputs")) return /(tool result|tool context|tool output)/.test(values);
    if (tab.includes("boundaries")) return /(boundary|source verification|schema validation)/.test(values);
  }

  if (config.title === "Memory Security") {
    if (tab === "signals" || tab.includes("audit")) return true;
    if (tab.includes("provenance")) return Boolean(row.provenance);
    if (tab.includes("quarantine")) return /(quarantined|contained|write blocked)/.test(values);
    if (tab.includes("retention")) return Boolean(row.retention);
    if (tab.includes("shared memory")) return /(shared)/.test(String(row.store ?? row.name ?? "").toLowerCase());
  }

  if (config.title === "Threats & Incidents") {
    if (tab === "incidents" || tab.includes("timeline") || tab.includes("playbooks") || tab.includes("evidence") || tab.includes("reports")) return true;
    if (tab.includes("owners")) return Boolean(row.owner);
  }

  if (config.title === "Memory & State Management") {
    if (tab.includes("memory store")) return true;
    if (tab.includes("session")) return /(session)/.test(values);
    if (tab.includes("agent state")) return /(agent|workflow state)/.test(values);
    if (tab.includes("conversation state")) return /(conversation)/.test(values);
    if (tab.includes("retention")) return Boolean(row.retention);
    if (tab.includes("backup")) return /(backup|long term|shared)/.test(values);
  }

  if (config.title === "Testing & Regression Suite") {
    if (tab.includes("test suite")) return true;
    if (tab.includes("test run")) return /(passed|failed|warning|run)/.test(values);
    if (tab.includes("dataset")) return /(dataset|regression|load|compliance)/.test(values);
    if (tab.includes("evaluation")) return String(row.type ?? "").toLowerCase() === "evaluation";
    if (tab.includes("baseline")) return Boolean(row.baseline);
    if (tab.includes("schedule")) return /(staging|production|time|schedule)/.test(values);
    if (tab.includes("environment")) return Boolean(row.environment);
  }

  if (config.title === "Feedback & Quality Loop") {
    if (tab === "feedback") return true;
    if (tab.includes("quality")) return /(rating|sentiment|positive|neutral|negative|quality)/.test(values);
    if (tab.includes("issue")) return /(negative|neutral|issue|error|problem|missing|slow)/.test(values);
    if (tab.includes("improvement")) return /(negative|neutral|improvement|backlog|feature|request)/.test(values);
    if (tab.includes("action")) return /(assign|analyze|create|backlog|issue)/.test(values);
    if (tab.includes("report") || tab.includes("setting")) return true;
  }

  if (config.title === "Quota, Cost & Capacity") {
    if (tab.includes("quota")) return Number(row.progress ?? 0) >= 70;
    if (tab.includes("cost")) return Number(String(row.spend ?? "").replace(/[$,]/g, "")) >= 15000;
    if (tab.includes("capacity")) return Number(row.progress ?? 0) < 80;
    if (tab.includes("usage")) return Number(String(row.tokens ?? "").replace(/[^0-9.]/g, "")) >= 150;
    if (tab.includes("budget")) return Number(String(row.spend ?? "").replace(/[$,]/g, "")) >= 25000;
    if (tab.includes("forecast")) return Number(row.progress ?? 0) < 60;
  }

  return values.includes(tab);
}

function matchesFilterValue(row: TableRow, label: string, value: string) {
  const normalizedLabel = label.trim().toLowerCase();
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) return true;
  if (normalizedLabel.includes("range") || normalizedLabel.includes("time")) return true;

  const keyMap: Record<string, string[]> = {
    agent: ["agent", "name"],
    capability: ["capability"],
    environment: ["environment"],
    framework: ["framework"],
    impact: ["impact"],
    owner: ["owner"],
    policy: ["policy"],
    reviewer: ["reviewer", "owner"],
    risk: ["risk"],
    "risk level": ["risk"],
    rotation: ["rotation"],
    "rotation policy": ["rotation"],
    sensitivity: ["sensitivity"],
    sentiment: ["sentiment"],
    source: ["source"],
    status: ["status"],
    tenant: ["tenant", "environment"],
    type: ["type"],
  };

  const candidateKeys = keyMap[normalizedLabel] ?? [labelToKey(label)];
  for (const key of candidateKeys) {
    const fieldValue = row[key];
    if (fieldValue == null) continue;
    if (String(fieldValue).toLowerCase().includes(normalizedValue)) {
      return true;
    }
  }

  return Object.values(row).join(" ").toLowerCase().includes(normalizedValue);
}

function labelToKey(label: string) {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^./, (char) => char.toLowerCase());
}

function getVisibleDashboardItems<T extends { title?: string; text?: string; rows?: Array<{ label: string; value: string }>; actions?: string[] }>(
  config: DashboardConfig,
  activeTab: string,
  items?: T[]
) {
  if (!items?.length) return items;

  const tab = activeTab.trim().toLowerCase();
  if (!tab || tab === "overview" || tab.startsWith("all ")) {
    return items;
  }

  const matched = items.filter((item) => {
    const haystack = [
      item.title,
      item.text,
      ...(item.rows ?? []).flatMap((row) => [row.label, row.value]),
      ...(item.actions ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (config.title === "Quota, Cost & Capacity") {
      if (tab.includes("quota")) return /quota|utilization/.test(haystack);
      if (tab.includes("cost")) return /cost|spend|budget/.test(haystack);
      if (tab.includes("capacity")) return /capacity|health/.test(haystack);
      if (tab.includes("usage")) return /usage|token|api call/.test(haystack);
      if (tab.includes("budget")) return /budget|spend/.test(haystack);
      if (tab.includes("forecast")) return /trend|forecast|over time/.test(haystack);
    }

    if (config.title === "Feedback & Quality Loop") {
      if (tab === "feedback") return /feedback|sentiment|rating/.test(haystack);
      if (tab.includes("quality")) return /quality|trend|rating|sentiment/.test(haystack);
      if (tab.includes("issue")) return /issue|incorrect|missing|slow|negative/.test(haystack);
      if (tab.includes("improvement")) return /improvement|backlog|recent improvements/.test(haystack);
      if (tab.includes("action")) return /action|assign|analyze|create/.test(haystack);
      if (tab.includes("report")) return /report|trend/.test(haystack);
      if (tab.includes("setting")) return /setting|sla/.test(haystack);
    }

    if (config.title === "Testing & Regression Suite") {
      if (tab.includes("test run")) return /run|pass rate|test/.test(haystack);
      if (tab.includes("dataset")) return /dataset/.test(haystack);
      if (tab.includes("evaluation")) return /evaluation/.test(haystack);
      if (tab.includes("baseline")) return /baseline|compare/.test(haystack);
      if (tab.includes("schedule")) return /schedule/.test(haystack);
      if (tab.includes("environment")) return /environment/.test(haystack);
    }

    if (config.title === "RAG & Knowledge Governance") {
      if (tab.includes("vector")) return /vector|chunk|index/.test(haystack);
      if (tab.includes("retrieval")) return /retrieval|policy/.test(haystack);
      if (tab.includes("citation") || tab.includes("grounding")) return /citation|grounding|relevance/.test(haystack);
      if (tab.includes("access") || tab.includes("lineage")) return /access|lineage|sensitivity/.test(haystack);
    }

    if (config.title === "Memory & State Management") {
      if (tab.includes("session")) return /session/.test(haystack);
      if (tab.includes("agent state")) return /agent|workflow|state/.test(haystack);
      if (tab.includes("conversation state")) return /conversation/.test(haystack);
      if (tab.includes("retention")) return /retention/.test(haystack);
      if (tab.includes("backup")) return /backup/.test(haystack);
    }

    return haystack.includes(tab);
  });

  return matched.length ? matched : items;
}

function generateId(key: string) {
  const prefix = key.slice(0, 3).toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;
}

function scopeName(title: string) {
  return title.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function guessDetailsTab(action: string, tabs: string[]) {
  const normalizedAction = action.trim().toLowerCase();
  if (!tabs.length) return null;

  const direct = tabs.find((tab) => normalizedAction.includes(tab.trim().toLowerCase()));
  if (direct) return direct;
  if (/invoice|tax|cost|billing|charge|spend/.test(normalizedAction)) {
    return tabs.find((tab) => /cost|billing|spend/.test(tab.trim().toLowerCase())) ?? tabs[0];
  }
  if (/audit|policy|risk|approval|guardrail|compliance/.test(normalizedAction)) {
    return tabs.find((tab) => /policy|audit|risk/.test(tab.trim().toLowerCase())) ?? tabs[0];
  }
  if (/prompt|replay|input|message/.test(normalizedAction)) {
    return tabs.find((tab) => /prompt|replay|input/.test(tab.trim().toLowerCase())) ?? tabs[0];
  }
  if (/overview|details|run/.test(normalizedAction)) {
    return tabs.find((tab) => /overview|details/.test(tab.trim().toLowerCase())) ?? tabs[0];
  }

  return null;
}

function getHeroCardStatus(
  config: DashboardConfig,
  records: Record<string, TableRow[]>,
  title: string,
  fallback?: TableRow[string]
) {
  if (config.title !== "Live Runs") {
    return String(fallback ?? "Active");
  }

  const normalizedTitle = title.trim().toLowerCase();
  const connectors = records.connectors ?? [];

  const matchingConnector = connectors.find((row) => {
    const haystack = [row.id, row.name, row.source, row.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (normalizedTitle.includes("azure")) return haystack.includes("azure");
    if (normalizedTitle.includes("copilot")) return haystack.includes("copilot");
    if (normalizedTitle.includes("app insights")) return haystack.includes("app insights");
    if (normalizedTitle.includes("power platform")) return haystack.includes("power platform");
    return haystack.includes(normalizedTitle);
  });

  if (matchingConnector) {
    return String(matchingConnector.status ?? matchingConnector.health ?? fallback ?? "Unknown");
  }

  return "Not Connected";
}

async function applyConfirmedAction(action: string, row: TableRow, key: string, store: ReturnType<typeof useOswellStore>) {
  const lower = action.toLowerCase();
  if (lower.includes("delete")) {
    await store.deleteRow(key, row.id);
    return;
  }
  if (lower.includes("activate") || lower.includes("enable") || lower.includes("allow")) await store.updateRow(key, row.id, { status: "Active", progress: Math.max(Number(row.progress ?? 90), 90) }, action);
  else if (lower.includes("deactivate") || lower.includes("disable")) await store.updateRow(key, row.id, { status: "Inactive", progress: 0 }, action);
  else if (lower.includes("approve")) await store.updateRow(key, row.id, { status: "Approved" }, action);
  else if (lower.includes("reject")) await store.updateRow(key, row.id, { status: "Rejected" }, action);
  else if (lower.includes("escalate")) await store.updateRow(key, row.id, { status: "Escalated", risk: "High" }, action);
  else if (lower.includes("contain")) await store.updateRow(key, row.id, { status: "Contained" }, action);
  else if (lower.includes("resolve")) await store.updateRow(key, row.id, { status: "Resolved", resolvedAt: new Date().toLocaleString() }, action);
  else if (lower.includes("reopen")) await store.updateRow(key, row.id, { status: "Open" }, action);
  else if (lower.includes("block")) await store.updateRow(key, row.id, { status: "Blocked", action: "Blocked", risk: "High" }, action);
  else if (lower.includes("quarantine")) await store.updateRow(key, row.id, { status: "Quarantined", retrievable: false }, action);
  else if (lower.includes("revoke")) await store.updateRow(key, row.id, { status: "Revoked" }, action);
  else if (lower.includes("rotate")) await store.updateRow(key, row.id, { version: `v${Number(String(row.version ?? "v1").replace(/\D/g, "")) + 1}`, lastRotated: new Date().toLocaleString(), time: "Just now" }, action);
  else if (lower.includes("clear")) await store.updateRow(key, row.id, { records: "0", progress: 0, status: "Active" }, action);
  else await store.updateRow(key, row.id, { lastUpdated: new Date().toLocaleString() }, action);
}
