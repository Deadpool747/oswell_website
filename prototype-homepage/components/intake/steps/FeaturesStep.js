import { FEATURE_OPTIONS } from "@/lib/intake";

export function FeaturesStep({ value, onToggle, error }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {FEATURE_OPTIONS.map((feature) => {
          const selected = value.includes(feature);
          return (
            <button
              key={feature}
              type="button"
              onClick={() => onToggle(feature)}
              className={`rounded-full border px-5 py-3 text-sm transition ${
                selected
                  ? "border-emerald-300 bg-emerald-400/15 text-emerald-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              }`}
            >
              {feature}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
