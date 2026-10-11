interface FieldProps {
  name: string;
  symbol: string;
  label?: string;
  value: string;
  unit: string;
  readOnly?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
}

// optional sign, digits, optional single decimal point
const NUMERIC_INPUT = /^[-−–—]?\d*\.?\d*$/;

export function Field({
  name,
  symbol,
  label,
  value,
  unit,
  readOnly = false,
  invalid = false,
  onChange,
}: FieldProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="w-5 text-xs text-slate-700 font-medium shrink-0">
        {symbol}
      </span>
      {label ? (
        <span className="flex-1 text-xs text-slate-400 truncate">{label}</span>
      ) : (
        <span className="flex-1" />
      )}
      <input
        type="text"
        name={name}
        aria-label={label ? `${label} (${symbol})` : symbol}
        data-cy={`field-${name}`}
        value={value}
        readOnly={readOnly}
        inputMode="decimal"
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const next = e.target.value.replace(',', '.');
          if (NUMERIC_INPUT.test(next)) onChange?.(next);
        }}
        className={`
          w-20 text-right text-xs font-medium text-slate-800 tabular-nums
          border rounded-md px-2 py-1
          outline-none transition-colors
          ${invalid ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200 bg-white'}
          ${readOnly ? 'cursor-default text-slate-600' : invalid ? '' : 'focus:border-slate-400'}
        `}
      />
      <span className="w-7 text-[10px] text-slate-400 shrink-0">{unit}</span>
    </div>
  );
}
