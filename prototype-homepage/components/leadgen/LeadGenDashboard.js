import Link from "next/link";

const stats = [
  { label: "Companies discovered", value: "1,535", detail: "YC + seed sources" },
  { label: "Leads extracted", value: "110", detail: "Public executive rows" },
  { label: "Public pages crawled", value: "501", detail: "About, team, contact" },
  { label: "Lead target", value: "1,000", detail: "Batch stop condition" },
];

const pipeline = [
  {
    step: "1",
    title: "Discover startups",
    text: "YC directory, seed CSVs, and public registry sources build the company queue.",
  },
  {
    step: "2",
    title: "Crawl public pages",
    text: "The crawler visits about, team, leadership, and contact pages with robots awareness.",
  },
  {
    step: "3",
    title: "Extract decision-makers",
    text: "The parser and extractor normalize titles and collect public emails, phones, and social links.",
  },
  {
    step: "4",
    title: "Store and export",
    text: "Leads are deduped, stored in SQLite, and exported to CSV/JSON for review or outreach.",
  },
];

const qualifiedLeads = [
  {
    company: "Scale AI",
    title: "CEO",
    person: "Jason Droege",
    source: "https://scale.com/",
  },
  {
    company: "Podium",
    title: "CEO",
    person: "Kevin Garrity",
    source: "https://podium.com/",
  },
  {
    company: "Amplitude",
    title: "CEO",
    person: "Spenser Skates",
    source: "https://amplitude.com/",
  },
  {
    company: "Brex",
    title: "CEO",
    person: "Pedro Franceschi",
    source: "https://www.brex.com/",
  },
];

const filters = [
  "Fintech",
  "Healthcare",
  "Startup",
  "CEO",
  "Founder",
  "Public email",
];

const sources = [
  "Y Combinator startup directory",
  "Companies House",
  "Seed CSV imports",
  "Public company websites",
];

export function LeadGenDashboard() {
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
                  Discover public business data, crawl company websites, extract decision-makers,
                  and export qualified leads from a single self-hosted dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/idea"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Open Intake Flow
              </Link>
              <a
                href="/output/executive_leads.csv"
                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25"
              >
                Download CSV
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[1.8rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.28)]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <h2 className="text-3xl font-semibold text-white">{stat.value}</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                  {stat.detail}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pipeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">How the system flows</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Resume enabled
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {pipeline.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-[1.6rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-sm font-semibold text-emerald-100">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Filters</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                  >
                    {filter}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">State</span>
                  <input
                    defaultValue="California"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Industry</span>
                  <input
                    defaultValue="Fintech"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</span>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Available</option>
                    <option>Any</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</span>
                  <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option>Available</option>
                    <option>Any</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-400/15 bg-emerald-400/10 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Current lead target</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h2 className="text-4xl font-semibold text-white">1,000</h2>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/15 px-3 py-1 text-xs text-emerald-100">
                  batch mode
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-50/85">
                The pipeline keeps discovering, crawling, and extracting until the lead goal is reached.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Qualified leads</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent extracted decision-makers</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Public sources only
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full border-collapse text-left">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifiedLeads.map((lead) => (
                    <tr key={`${lead.company}-${lead.person}`} className="border-t border-white/10 bg-slate-950/40">
                      <td className="px-4 py-4 text-sm font-medium text-white">{lead.company}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{lead.person}</td>
                      <td className="px-4 py-4 text-sm text-emerald-100">{lead.title}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Discovery sources</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">What feeds the queue</h2>

            <div className="mt-5 grid gap-4">
              {sources.map((source) => (
                <div key={source} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{source}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Automation</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                n8n and queue workers will eventually handle discovery, crawl, verification, enrichment,
                and export as scheduled jobs or campaign-triggered workflows.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
