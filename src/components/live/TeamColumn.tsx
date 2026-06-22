'use client';

import { LiveGameParticipant } from './LiveGameParticipant';

export function TeamColumn({
  side,
  participants,
  trackedPuuids,
}: {
  side: 'blue' | 'red';
  participants: any[];
  trackedPuuids: Set<string>;
}) {
  const blue = side === 'blue';
  const label = blue ? 'Blue side' : 'Red side';
  const labelColor = blue ? 'text-[#4f98ff]' : 'text-[#ff5d6c]';
  const bg = blue
    ? 'bg-gradient-to-b from-[#0a1c3a]/70 via-[#091428]/40 to-transparent'
    : 'bg-gradient-to-b from-[#3a0d12]/70 via-[#280a0f]/40 to-transparent';

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 p-4 ${bg}`}>
      <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelColor} ${blue ? 'text-left' : 'text-right'}`}>
        {label}
      </div>

      <div className="flex flex-col gap-2">
        {participants.map((p, i) => (
          <LiveGameParticipant
            key={p.puuid || i}
            participant={p}
            isTracked={!!p.puuid && trackedPuuids.has(p.puuid)}
            mirror={!blue}
          />
        ))}
      </div>

      <div className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] opacity-70 ${labelColor} ${blue ? 'text-left' : 'text-right'}`}>
        {label}
      </div>
    </div>
  );
}

export default TeamColumn;
