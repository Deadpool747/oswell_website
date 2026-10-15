import { DEVICE_OPTIONS, TARGET_USER_SUGGESTIONS } from "@/lib/intake";

export function TargetUsersStep({ formData, onTextChange, onToggleUser, onDeviceChange, error }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-200">Who will use this product?</label>
        <textarea
          value={formData.targetUsers}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Example: Small retail teams who need to track orders, assign staff, and follow up with customers."
          className="min-h-36 w-full rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 text-base text-white outline-none transition focus:border-emerald-300"
        />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-200">Quick audience tags</p>
        <div className="flex flex-wrap gap-3">
          {TARGET_USER_SUGGESTIONS.map((option) => {
            const selected = formData.selectedUsers.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggleUser(option)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selected
                    ? "border-emerald-300 bg-emerald-400/15 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-200">Primary device experience</p>
        <div className="flex flex-wrap gap-3">
          {DEVICE_OPTIONS.map((option) => {
            const selected = formData.device === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onDeviceChange(option)}
                className={`rounded-2xl border px-5 py-3 text-sm transition ${
                  selected
                    ? "border-cyan-300 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
