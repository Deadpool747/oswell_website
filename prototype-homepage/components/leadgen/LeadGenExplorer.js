"use client";

import { useEffect, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").trim();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function matchesQuery(lead, query) {
  if (!query) return true;
  const haystack = [
    lead.company_name,
    lead.name,
    lead.title,
    lead.normalized_title,
    lead.industry,
    lead.state,
    lead.city,
    lead.email,
    lead.phone,
    lead.source_url,
  ]
    .map((item) => normalize(item).toLowerCase())
    .join(" ");
  return haystack.includes(query.toLowerCase());
}

function StatCard({ label, value, subtext }) {
  return (
    <article className="rounded-[1.8rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-semibold text-white">{value}</h2>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
          {subtext}
        </span>
      </div>
    </article>
  );
}

function LeadDrawer({ lead, onClose }) {
  if (!lead) {
    return (
      <aside className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lead details</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Select a lead</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Click any row in the table to open a CRM-style detail panel with the source, contact info,
          and crawl context.
        </p>
      </aside>
    );
  }

  const fields = [
    ["Company", lead.company_name],
    ["Person", lead.name],
    ["Title", lead.title],
    ["Email", lead.email || "Not public"],
    ["Phone", lead.phone || "Not public"],
    ["LinkedIn", lead.linkedin || "Not public"],
    ["Twitter/X", lead.twitter || "Not public"],
    ["Industry", lead.industry || "Not set"],
    ["Location", [lead.city, lead.state, lead.country].filter(Boolean).join(", ") || "Not set"],
    ["Source URL", lead.source_url || "Not set"],
    ["Last Crawled", lead.last_crawled || "Not set"],
  ];

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lead details</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{lead.company_name}</h2>
          <p className="mt-2 text-sm text-emerald-100">{lead.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20"
        >
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 break-words text-sm leading-6 text-white">{value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LeadGenExplorer({ initialData }) {
  const snapshotUrl = "/leadgen-data.json";
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [selectedLead, setSelectedLead] = useState(initialData.leads[0] || null);
  const [error, setError] = useState("");

  const allLeads = data.leads || [];
  const allStats = data.stats || {};

  useEffect(() => {
    setSelectedLead((current) => current || data.leads[0] || null);
  }, [data]);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const response = await fetch(`${snapshotUrl}?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Refresh failed (${response.status})`);
        }
        const payload = await response.json();
        if (mounted) {
          setData(payload);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load live lead data");
        }
      }
    }

    const timer = setInterval(refresh, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const industries = useMemo(() => {
    const values = new Set();
    allLeads.forEach((lead) => {
      const value = normalize(lead.industry);
      if (value) values.add(value);
    });
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [allLeads]);

  const states = useMemo(() => {
    const values = new Set();
    allLeads.forEach((lead) => {
      const value = normalize(lead.state);
      if (value) values.add(value);
    });
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      if (!matchesQuery(lead, query)) return false;
      if (industry !== "All" && normalize(lead.industry) !== industry) return false;
      if (stateFilter !== "All" && normalize(lead.state) !== stateFilter) return false;
      if (hasEmail && !normalize(lead.email)) return false;
      if (hasPhone && !normalize(lead.phone)) return false;
      return true;
    });
  }, [allLeads, query, industry, stateFilter, hasEmail, hasPhone]);

  const filteredStats = useMemo(() => {
    const companies = new Set(filteredLeads.map((lead) => lead.company_name).filter(Boolean));
    return {
      leads: filteredLeads.length,
      companies: companies.size,
      emails: filteredLeads.filter((lead) => normalize(lead.email)).length,
      phones: filteredLeads.filter((lead) => normalize(lead.phone)).length,
    };
  }, [filteredLeads]);

  useEffect(() => {
    if (!selectedLead && filteredLeads.length > 0) {
      setSelectedLead(filteredLeads[0]);
      return;
    }
    if (selectedLead && !filteredLeads.some((lead) => lead.company_name === selectedLead.company_name && lead.name === selectedLead.name)) {
      setSelectedLead(filteredLeads[0] || null);
    }
  }, [filteredLeads, selectedLead]);

  async function refreshNow() {
    setLoading(true);
    try {
      const response = await fetch(`${snapshotUrl}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Refresh failed (${response.status})`);
      }
      const payload = await response.json();
      setData(payload);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live lead data");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setIndustry("All");
    setStateFilter("All");
    setHasEmail(false);
    setHasPhone(false);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/6 px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                Open-source Apollo alternative
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Lead intelligence for startups and SMBs
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Discover public business data, crawl company websites, extract decision-makers, and
                  manage leads from a single self-hosted dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/idea"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Open Intake Flow
              </a>
              <a
                href="/output/executive_leads.csv"
                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25"
              >
                Download CSV
              </a>
              <button
                type="button"
                onClick={refreshNow}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/30"
              >
                {loading ? "Refreshing..." : "Refresh Snapshot"}
              </button>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Companies discovered" value={formatNumber(allStats.companies)} subtext="Live SQLite" />
          <StatCard label="Leads extracted" value={formatNumber(allStats.leads)} subtext="Public executive rows" />
          <StatCard label="Public pages crawled" value={formatNumber(allStats.pages)} subtext="About, team, contact" />
          <StatCard label="Lead target" value="1,000" subtext="Batch stop condition" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Filters</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Search and narrow leads</h2>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20"
                >
                  Reset
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Search</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Company, person, title, email..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Industry</span>
                    <select
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    >
                      {industries.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">State</span>
                    <select
                      value={stateFilter}
                      onChange={(event) => setStateFilter(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    >
                      {states.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    ["Email available", hasEmail, setHasEmail],
                    ["Phone available", hasPhone, setHasPhone],
                  ].map(([label, checked, setter]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setter((current) => !current)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        checked
                          ? "border-emerald-300 bg-emerald-400/15 text-emerald-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-400/15 bg-emerald-400/10 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Current lead target</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h2 className="text-4xl font-semibold text-white">{formatNumber(filteredStats.leads)}</h2>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-xs text-emerald-100">
                  filtered
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-50/85">
                {formatNumber(filteredStats.companies)} companies, {formatNumber(filteredStats.emails)} public emails,
                and {formatNumber(filteredStats.phones)} public phones in the current view.
              </p>
            </div>
          </aside>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Qualified leads</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Recent extracted decision-makers</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {filteredLeads.length} shown
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
                <div className="max-h-[36rem] overflow-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Person</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr
                          key={`${lead.company_name}-${lead.name}-${lead.title}`}
                          onClick={() => setSelectedLead(lead)}
                          className={`cursor-pointer border-t border-white/10 transition hover:bg-white/5 ${
                            selectedLead &&
                            selectedLead.company_name === lead.company_name &&
                            selectedLead.name === lead.name &&
                            selectedLead.title === lead.title
                              ? "bg-white/5"
                              : "bg-slate-950/40"
                          }`}
                        >
                          <td className="px-4 py-4 text-sm font-medium text-white">{lead.company_name}</td>
                          <td className="px-4 py-4 text-sm text-slate-300">{lead.name}</td>
                          <td className="px-4 py-4 text-sm text-emerald-100">{lead.title}</td>
                          <td className="px-4 py-4 text-sm text-slate-400">
                            {[lead.city, lead.state].filter(Boolean).join(", ") || lead.country || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Discovery sources</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What feeds the queue</h2>

            <div className="mt-5 grid gap-4">
              {[
                "Y Combinator startup directory",
                "Companies House",
                "Seed CSV imports",
                "Public company websites",
              ].map((source) => (
                <div key={source} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{source}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Automation</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Static snapshot and workflow layer</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The dashboard reads a build-time snapshot from the local SQLite lead store. As the crawler
              runs, the snapshot can be regenerated, and the view can refresh, filter, and surface the
              most relevant decision-makers for outreach.
            </p>

            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Discovery, crawling, and extraction stay in the Python engine. The UI provides CRM-style
                visibility, search, and manual review on top.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
