'use client';

import { useState } from 'react';
import { getChampionIconUrl } from '@/lib/helpers';

export function ChampIcon({
  champion,
  size = 36,
  className = '',
}: {
  champion: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const initials = champion.slice(0, 2).toUpperCase();

  if (errored) {
    return (
      <div
        className={`grid place-items-center rounded-xl border border-steel/70 bg-steel-soft text-[11px] font-semibold uppercase tracking-[0.18em] text-faint ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getChampionIconUrl(champion)}
      alt={champion}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-xl border border-steel/70 bg-steel-soft object-cover ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
