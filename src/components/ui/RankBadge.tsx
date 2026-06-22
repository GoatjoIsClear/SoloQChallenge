import { TIER_COLORS, formatRank } from '@/lib/helpers';

/** Tier name without the LP/division suffix, e.g. "Diamond". */
function tierLabel(tier?: string, division?: string): string {
  if (!tier || tier === 'UNRANKED') return 'Unranked';
  return formatRank(tier, division ?? '', 0).split('—')[0].trim();
}

export function RankBadge({
  tier,
  division,
  size = 'md',
}: {
  tier?: string;
  division?: string;
  size?: 'sm' | 'md';
}) {
  const key = tier ?? 'UNRANKED';
  const color = TIER_COLORS[key] ?? '#555';
  const label = tierLabel(tier, division);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-medium text-ink ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-[13px]'
      }`}
      style={{
        borderColor: `${color}55`,
        background: tier === 'UNRANKED' ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${color}22, ${color}12)`,
      }}
    >
      <span
        className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 10px ${color}99`,
        }}
      />
      {label}
    </span>
  );
}
