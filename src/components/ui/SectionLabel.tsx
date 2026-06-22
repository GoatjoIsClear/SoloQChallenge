export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px w-6 bg-gradient-to-r from-gold to-transparent" />
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
        {children}
      </span>
    </div>
  );
}
