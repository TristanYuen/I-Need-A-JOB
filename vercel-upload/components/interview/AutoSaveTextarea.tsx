type AutoSaveTextareaProps = {
  label: string;
  description: string;
  value?: string;
  rows: number;
  onChange: (value: string) => void;
};

export function AutoSaveTextarea({ label, description, value, rows, onChange }: AutoSaveTextareaProps) {
  return (
    <label className="grid gap-3 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <span className="text-lg font-semibold tracking-normal text-slate-950">{label}</span>
      <span className="text-sm leading-6 text-slate-500">{description}</span>
      <textarea
        value={value ?? ""}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-64 w-full resize-y rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
      />
      <span className="text-xs font-medium text-emerald-600">已自动保存</span>
    </label>
  );
}
