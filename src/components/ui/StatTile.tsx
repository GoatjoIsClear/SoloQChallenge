import { ReactNode } from 'react';

type Accent = 'gold' | 'ice' | 'win' | 'loss' | 'neutral';

const ACCENT: Record<Accent, string> = {
  gold: 'text-gold',
  ice: 'text-ice',
  win: 'text-win',
  loss: 'text-loss',
  neutral: 'text-ink',
};

export function StatTile({
  label,
  value,
  sub,
  accent = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-steel/70 bg-midnight/70 p-6 transition-colors duration-200 hover:border-gold/40">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel to-transparent" />
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-semibold tabular ${ACCENT[accent]}`}>{value}</div>
      {sub ? <div className="mt-2 text-xs text-faint">{sub}</div> : null}
    </div>
  );
}
