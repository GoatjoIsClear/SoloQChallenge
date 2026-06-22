'use client';

import { getChampionIconUrl, getChampionNameById } from '@/lib/helpers';

export function LiveGameParticipant({
  participant,
  isTracked = false,
  mirror = false,
  size = 36,
}: {
  participant: any;
  isTracked?: boolean;
  mirror?: boolean;
  size?: number;
}) {
  const champ = participant.championName || getChampionNameById(participant.championId);
  const name = participant.riotId?.split('#')[0] || participant.summonerName || 'Unknown';

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-150 ${
        mirror ? 'flex-row-reverse text-right' : ''
      } ${isTracked ? 'bg-gold/10 ring-1 ring-gold/30' : 'hover:bg-white/5'}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getChampionIconUrl(champ)}
        alt={champ}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full border border-white/15 object-cover transition-shadow duration-150 group-hover:shadow-[0_0_12px_rgba(244,200,115,.45)]"
        onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')}
      />
      <div className="min-w-0">
        <div
          className={`truncate text-sm italic ${
            isTracked ? 'font-bold text-gold' : 'font-medium text-ink'
          }`}
        >
          {name}
        </div>
        <div className="truncate text-[11px] text-faint">{champ}</div>
      </div>
    </div>
  );
}

export default LiveGameParticipant;
