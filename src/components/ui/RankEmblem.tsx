import React, { useState } from 'react';

const EMBLEM_MAP: Record<string, string> = {
  IRON: 'iron.png',
  BRONZE: 'bronze.png',
  SILVER: 'silver.png',
  GOLD: 'gold.png',
  PLATINUM: 'platinum.png',
  EMERALD: 'emerald.png',
  DIAMOND: 'diamond.png',
  MASTER: 'master.png',
  GRANDMASTER: 'grandmaster.png',
  CHALLENGER: 'challenger.png',
};

export function RankEmblem({
  tier,
  division,
  lp,
  size = 80,
  showText = true,
}: {
  tier?: string | null;
  division?: string | null;
  lp?: number | null;
  size?: number;
  showText?: boolean;
}) {
  const key = (tier || 'UNRANKED').toUpperCase();
  const file = EMBLEM_MAP[key];
  const [imgError, setImgError] = useState(false);
  const label = !tier || tier === 'UNRANKED' ? 'Unranked' : `${tier}${division ? ' ' + division : ''}`;

  return (
    <div className="flex items-center gap-4 whitespace-nowrap">
      {file && !imgError ? (
        // The emblem is the focal point of the ELO column. The PNGs are now
        // tightly cropped squares, so we drive sizing by height and let width
        // follow naturally — aspect ratio preserved, no CSS scaling/transforms,
        // and no max-width/height caps.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/emblems/${file}`}
          alt={label}
          height={size}
          onError={() => setImgError(true)}
          style={{
            height: size,
            width: 'auto',
            maxWidth: 'none',
            maxHeight: 'none',
            display: 'block',
            flexShrink: 0,
          }}
        />
      ) : null}

      {showText ? (
        <span className="truncate font-display text-base font-semibold uppercase tracking-[0.04em] text-ink">
          {label} <span className="text-ice">• {lp ?? 0} LP</span>
        </span>
      ) : null}
    </div>
  );
}

export default RankEmblem;
