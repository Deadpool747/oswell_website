import { PROJECT_TYPES } from "@/lib/intake";

export function ProjectTypeStep({ value, onChange, error }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PROJECT_TYPES.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[2rem] border p-5 text-left transition duration-200 ${
              selected
                ? "border-emerald-300 bg-emerald-400/12 shadow-[0_18px_40px_rgba(16,185,129,0.15)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-white">{option.value}</h3>
              <p className="text-sm leading-6 text-slate-300">{option.description}</p>
            </div>
          </button>
        );
      })}
      {error ? <p className="sm:col-span-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
