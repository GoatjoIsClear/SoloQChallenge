import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-steel/80 bg-gradient-to-b from-abyss/90 to-midnight/95 shadow-[var(--shadow-panel)] ${
        glow ? 'ring-1 ring-gold/30' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
}: {
  title: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-steel/60 px-6 py-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ink">{title}</h3>
      {meta ? <div className="text-xs text-muted">{meta}</div> : null}
    </div>
  );
}
