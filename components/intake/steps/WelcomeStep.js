export function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          "Interactive scoping, not a static questionnaire",
          "Fast estimate and design direction in one flow",
          "Built to feel like premium SaaS onboarding",
        ].map((item) => (
          <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
            {item}
          </div>
        ))}
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-[0_16px_60px_rgba(15,23,42,0.2)]">
        <p className="text-sm leading-7 text-slate-300">
          Tell us what you want to build, who it is for, which features matter, and how fast you need it.
          We will turn it into a sharper discovery brief you can actually use.
        </p>
      </div>
    </div>
  );
}
