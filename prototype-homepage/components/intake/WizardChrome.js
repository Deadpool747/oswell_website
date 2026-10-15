export function WizardChrome({ estimate, budgetLabel, projectType, featureCount, deadline }) {
  return (
    <aside className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.4)] backdrop-blur">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Live Estimate</p>
          <h2 className="text-3xl font-semibold text-white">{estimate}</h2>
          <p className="text-sm leading-6 text-slate-300">
            A directional estimate based on product type, selected features, and delivery urgency.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Product</p>
            <p className="mt-2 text-lg font-medium text-white">{projectType || "Not selected"}</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feature Scope</p>
            <p className="mt-2 text-lg font-medium text-white">{featureCount} selected</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Target Budget</p>
            <p className="mt-2 text-lg font-medium text-white">{budgetLabel}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Timeline</p>
          <p className="mt-2 text-lg font-medium text-white">{deadline}</p>
        </div>
      </div>
    </aside>
  );
}
