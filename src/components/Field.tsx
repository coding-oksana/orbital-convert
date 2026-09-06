interface FieldProps {
  symbol: string;
  label?: string;
  value: string;
  unit: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export function Field({ symbol, label, value, unit, readOnly = false, onChange }: FieldProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <span className="w-8 text-sm text-slate-800 font-medium shrink-0">{symbol}</span>
      {label ? <span className="flex-1 text-sm text-slate-400">{label}</span> : <span className="flex-1" />}
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`
          w-28 text-right text-sm font-medium text-slate-800 tabular-nums
          border border-slate-200 rounded-lg px-3 py-1.5 bg-white
          transition-colors outline-none
          ${readOnly ? 'cursor-default' : 'focus:border-slate-400'}
        `}
      />
      <span className="w-8 text-sm text-slate-400 shrink-0">{unit}</span>
    </div>
  );
}