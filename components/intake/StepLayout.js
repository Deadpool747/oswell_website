export function StepLayout({ eyebrow, title, description, children, aside }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <div className="space-y-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            {eyebrow}
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
          </div>
        </div>
        {children}
      </div>
      <div className="lg:sticky lg:top-10">{aside}</div>
    </div>
  );
}
