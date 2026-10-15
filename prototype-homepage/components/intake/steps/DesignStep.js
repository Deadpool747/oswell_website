import { DESIGN_OPTIONS } from "@/lib/intake";

export function DesignStep({ value, onChange, error }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {DESIGN_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[2rem] border p-5 text-left transition ${
              selected
                ? "border-white/20 bg-white/14 shadow-[0_18px_40px_rgba(148,163,184,0.12)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            <p className="text-lg font-medium text-white">{option.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{option.description}</p>
          </button>
        );
      })}
      {error ? <p className="sm:col-span-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
