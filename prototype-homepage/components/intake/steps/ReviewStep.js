export function ReviewStep({ summaryItems }) {
  return (
    <div className="grid gap-4">
      {summaryItems.map((item) => (
        <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
          <p className="mt-2 text-base leading-7 text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
