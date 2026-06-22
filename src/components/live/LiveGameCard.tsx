'use client';

import { getChampionIconUrl, getChampionNameById } from '@/lib/helpers';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { LiveBadge } from './LiveBadge';
import { GameTimer } from './GameTimer';
import { TeamColumn } from './TeamColumn';

export interface LiveGameCardProps {
  game: any;
  /** All tracked players present in this game (deduped by gameId upstream). */
  trackedPlayers: any[];
  /** puuid -> ranked stats { tier, rank, leaguePoints }, for the focused player. */
  rankByPuuid: Record<string, any>;
  /** true only on the poll where this game first appears, to trigger the entrance. */
  isNew?: boolean;
}

export function LiveGameCard({ game, trackedPlayers, rankByPuuid, isNew }: LiveGameCardProps) {
  const participants: any[] = game.participants ?? [];
  const blue = participants.filter((p) => p.teamId === 100);
  const red = participants.filter((p) => p.teamId === 200);
  const trackedPuuids = new Set<string>(trackedPlayers.map((p) => p.puuid).filter(Boolean));

  // Focused = first tracked player; find their participant for champion + side.
  const focused = trackedPlayers[0];
  const focusedPart = participants.find((p) => p.puuid === focused?.puuid);
  const focusedSide: 'blue' | 'red' = focusedPart?.teamId === 200 ? 'red' : 'blue';
  const focusedChamp = focusedPart
    ? focusedPart.championName || getChampionNameById(focusedPart.championId)
    : null;
  const ranked = focused?.puuid ? rankByPuuid[focused.puuid] : null;

  const sideBadge =
    focusedSide === 'blue'
      ? 'border-[#4f98ff]/40 bg-[#006dff]/15 text-[#7fb6ff]'
      : 'border-[#ff5d6c]/40 bg-[#ff2d2d]/15 text-[#ff9aa3]';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#07101f] shadow-[0_24px_60px_-28px_rgba(0,0,0,.85)] ${
        isNew ? 'live-card-enter' : ''
      }`}
    >
      {/* gold top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f4c873] to-transparent" />
      {/* side glows */}
      <div className="pointer-events-none absolute -left-24 top-1/2 size-64 -translate-y-1/2 rounded-full bg-[#006dff]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/2 size-64 -translate-y-1/2 rounded-full bg-[#ff2d2d]/15 blur-3xl" />
      {/* bottom corner gradients */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-1/2 bg-gradient-to-tr from-[#006dff]/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-28 w-1/2 bg-gradient-to-tl from-[#ff2d2d]/20 to-transparent" />

      <div className="relative p-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <LiveBadge />
          <GameTimer startTime={game.gameStartTime} fallbackSeconds={game.gameLength ?? game.gameDuration ?? 0} />
        </div>

        {/* focused player */}
        {focused ? (
          <div className="mt-6 flex items-center gap-4 border-b border-white/10 pb-6">
            {focusedChamp ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getChampionIconUrl(focusedChamp)}
                alt={focusedChamp}
                width={70}
                height={70}
                style={{ width: 70, height: 70 }}
                className="shrink-0 rounded-full border-2 border-gold/60 object-cover shadow-[0_0_18px_rgba(244,200,115,.35)]"
                onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')}
              />
            ) : null}
            <div className="min-w-0">
              <div className="truncate font-display text-2xl font-bold italic uppercase tracking-tight text-white">
                {focused.gameName}
                <span className="ml-1 text-base font-medium not-italic text-faint">#{focused.tagLine}</span>
              </div>
              <div className="mt-2">
                <RankEmblem tier={ranked?.tier} division={ranked?.rank} lp={ranked?.leaguePoints} size={32} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] ${sideBadge}`}>
                  {focusedSide === 'blue' ? 'Blue side' : 'Red side'}
                </span>
                {focusedChamp ? <span className="text-xs text-muted">Playing {focusedChamp}</span> : null}
                {trackedPlayers.length > 1 ? (
                  <span className="text-xs text-gold">+{trackedPlayers.length - 1} tracked</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* teams */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <TeamColumn side="blue" participants={blue} trackedPuuids={trackedPuuids} />
          <TeamColumn side="red" participants={red} trackedPuuids={trackedPuuids} />
        </div>
      </div>
    </div>
  );
}

export default LiveGameCard;
