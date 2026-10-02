interface FieldProps {
  symbol: string;
  label?: string;
  value: string;
  unit: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

// optional sign, digits, optional single decimal point
const NUMERIC_INPUT = /^[-−–—]?\d*\.?\d*$/;

export function Field({ symbol, label, value, unit, readOnly = false, onChange }: FieldProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="w-5 text-xs text-slate-700 font-medium shrink-0">{symbol}</span>
      {label
        ? <span className="flex-1 text-xs text-slate-400 truncate">{label}</span>
        : <span className="flex-1" />
      }
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        inputMode="decimal"
        onChange={e => {
          const next = e.target.value.replace(',', '.');
          if (NUMERIC_INPUT.test(next)) onChange?.(next);
        }}
        className={`
          w-20 text-right text-xs font-medium text-slate-800 tabular-nums
          border border-slate-200 rounded-md px-2 py-1 bg-white
          outline-none transition-colors
          ${readOnly ? 'cursor-default text-slate-600' : 'focus:border-slate-400'}
        `}
      />
      <span className="w-7 text-[10px] text-slate-400 shrink-0">{unit}</span>
    </div>
  );
}