export function ContactStep({ formData, onChange, errors }) {
  const fields = [
    { key: "name", label: "Name", type: "text", placeholder: "Your full name" },
    { key: "email", label: "Email", type: "email", placeholder: "you@company.com" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+447442256653" },
  ];

  return (
    <div className="grid gap-5">
      {fields.map((field) => (
        <label key={field.key} className="space-y-2">
          <span className="text-sm font-medium text-slate-200">{field.label}</span>
          <input
            type={field.type}
            value={formData[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-emerald-300"
          />
          {errors[field.key] ? <p className="text-sm text-rose-300">{errors[field.key]}</p> : null}
        </label>
      ))}
    </div>
  );
}
