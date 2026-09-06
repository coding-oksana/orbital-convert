interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase mt-6 mb-1 first:mt-0">
      {children}
    </p>
  );
}