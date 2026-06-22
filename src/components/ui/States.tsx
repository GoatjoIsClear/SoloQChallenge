import { ReactNode } from 'react';

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-24 text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-steel border-t-gold" />
      <span className="font-display text-sm uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-steel/80 bg-midnight/40 py-20 text-center">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {children ? <p className="max-w-sm text-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
