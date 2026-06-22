import { ReactNode } from 'react';
import { SectionLabel } from './SectionLabel';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="animate-rise flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="mt-4 font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-4 text-[15px] leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-4">{right}</div> : null}
    </section>
  );
}
