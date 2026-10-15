export function BudgetTimelineStep({ budget, deadline, onBudgetChange, onDeadlineChange, error }) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-200">Target budget</label>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(budget)}
          </span>
        </div>
        <input
          type="range"
          min="50000"
          max="500000"
          step="10000"
          value={budget}
          onChange={(event) => onBudgetChange(event.target.value)}
          className="w-full accent-emerald-400"
        />
        <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
          <span>50k</span>
          <span>500k+</span>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-200">Preferred launch deadline</label>
        <input
          type="date"
          min={today}
          value={deadline}
          onChange={(event) => onDeadlineChange(event.target.value)}
          className="w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-emerald-300"
        />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
