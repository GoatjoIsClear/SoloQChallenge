'use client';

import { useState } from 'react';
import { getDDragonVersion } from '@/lib/helpers';

export function PlayerIdentity({
  gameName,
  tagLine,
  profileIconId,
  size = 'md',
}: {
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  size?: 'sm' | 'md';
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const version = getDDragonVersion();
  const px = size === 'sm' ? 40 : 52;

  const hasImage = profileIconId && !imageFailed;

  return (
    <div className="flex items-center gap-4">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`}
          alt={`${gameName} profile icon`}
          style={{ width: px, height: px }}
          className={`rounded-full border border-steel/80 object-cover bg-steel-soft`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          style={{ width: px, height: px }}
          className={`rounded-full border border-steel/80 bg-steel-soft`}
        />
      )}

      <div className="min-w-0">
        <div className="truncate font-medium text-ink">{gameName}</div>
        <div className="truncate font-mono text-xs text-faint">#{tagLine}</div>
      </div>
    </div>
  );
}
