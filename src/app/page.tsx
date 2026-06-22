"use client";
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { PlayerWithStats } from '@/types';
import { TIER_COLORS, formatRank, getRankScore, getWinRate } from '@/lib/helpers';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { StatTile } from '@/components/ui/StatTile';
import { WinRateBar } from '@/components/ui/WinRateBar';
import { PlayerIdentity } from '@/components/ui/PlayerIdentity';
import { ChampIcon } from '@/components/ui/ChampIcon';
import { RankEmblem } from '@/components/ui/RankEmblem';
import { Loading, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';

const REFRESH_MS = 3 * 60 * 1000;

// Columns: Player | Elo | +/- LPS | M | W | L | WR | STREAK
const COLS = 'minmax(200px,1.2fr) minmax(440px,2.8fr) 96px 64px 64px 64px 120px minmax(440px,1.1fr)';

function tierLabel(tier?: string, division?: string): string {
  if (!tier || tier === 'UNRANKED') return 'Unranked';
  return formatRank(tier, division ?? '', 0).split('—')[0].trim();
}

function RecentChampions({ matches }: { matches: any[] }) {
  if (!matches.length) {
    return <span className="text-xs text-faint">No recent games</span>;
  }

  // Show a fixed number to avoid horizontal scrolling and keep layout stable
  const items = matches.slice(0, 8);

  return (
    <div className="flex items-center gap-4">
      {items.map((m) => (
        <div key={m.matchId} className="relative flex flex-col items-center" title={`${m.championName} • ${m.win ? 'Win' : 'Loss'}`}>
          <ChampIcon
            champion={m.championName}
            size={36}
            className="filter grayscale-[100%] opacity-70"
          />

          <div className={`mt-2 h-1 w-8 rounded-full ${m.win ? 'bg-win' : 'bg-loss'}`} />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [history, setHistory] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const [lbRes, histRes] = await Promise.all([
      window.fetch('/api/leaderboard'),
      window.fetch('/api/history').catch(() => null),
    ]);
    const data = await lbRes.json();
    setPlayers(data);
    if (histRes) {
      try {
        setHistory(await histRes.json());
      } catch {
        /* history is optional decoration; ignore failures */
      }
    }
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  const averageWR = players.length
    ? Math.round(
        players.reduce((sum, p) => {
          const r = p.ranked;
          return sum + (r ? getWinRate(r.wins ?? 0, r.losses ?? 0) : 0);
        }, 0) / players.length,
      )
    : 0;

  const topRank = players[0]?.ranked
    ? formatRank(players[0].ranked.tier, players[0].ranked.rank, 0).split('—')[0].trim()
    : 'Unranked';

  const sortedByScore = players
    .filter((p) => p.ranked)
    .slice()
    .sort((a, b) =>
      getRankScore(b.ranked!.tier, b.ranked!.rank, b.ranked!.leaguePoints) -
      getRankScore(a.ranked!.tier, a.ranked!.rank, a.ranked!.leaguePoints),
    );

  const topLPPlayer = sortedByScore[0];
  const bestWinRatePlayer = players
    .filter((p) => (p.wins ?? 0) + (p.losses ?? 0) > 0)
    .slice()
    .sort(
      (a, b) =>
        getWinRate(b.wins ?? 0, b.losses ?? 0) -
        getWinRate(a.wins ?? 0, a.losses ?? 0),
    )[0];

  const mostGamesPlayer = players
    .slice()
    .sort((a, b) => (b.games ?? 0) - (a.games ?? 0))[0];

  const recentActivity = players
    .flatMap((p) => (history[p.id] ?? p.recent ?? []).map((match) => ({
      ...match,
      playerName: p.gameName,
      region: p.region,
    })))
    .sort((a, b) => b.gameCreation - a.gameCreation)
    .slice(0, 8);

  return (
    <div className="mx-auto w-[95vw] max-w-none px-4 sm:px-8 pb-8">
      <PageHeader
        eyebrow="순위 · Leaderboard"
        title="Leaderboard"
        subtitle="Live ranked standings for your tracked players."
      />

      {loading ? (
        <Loading />
      ) : players.length === 0 ? (
        <EmptyState
          title="No players yet"
          action={
            <Link
              href="/admin"
              className="inline-flex rounded-lg border border-gold/40 px-6 py-4 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
            >
              Add your first player
            </Link>
          }
        >
          Add friends from the Players page to start building the leaderboard.
        </EmptyState>
      ) : (
        <>
        <section className="mt-6">
          <div className="border border-steel/60 bg-midnight/95">
            <div className="overflow-x-auto">
             <div className="min-w-[1600px]">
                  {/* Header */}
                  <div
                    className="grid items-center gap-4 border-b border-steel/30 bg-midnight/85 px-[18px] py-[14px] text-[12px] font-semibold uppercase tracking-[0.08em] text-faint"
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span>Player</span>
                    <span className="text-left">Elo</span>
                    <span className="text-center">+/- LPS</span>
                    <span className="text-center">M</span>
                    <span className="text-center">W</span>
                    <span className="text-center">L</span>
                    <span>WR</span>
                    <span>STREAK</span>
                  </div>

                  {/* Rows */}
                  {players.map((p) => {
                    const r = p.ranked as any;
                    const rankError = (p as any).rankFetchError as { status: number; message: string } | undefined;
                    const tier = rankError ? 'ERROR' : r?.tier ?? 'UNRANKED';
                    const wins = p.wins ?? r?.wins ?? 0;
                    const losses = p.losses ?? r?.losses ?? 0;
                    const games = p.games ?? (wins + losses);
                    const wr = p.winRate ?? getWinRate(wins, losses);
                    const recent = history[p.id] ?? p.recent ?? [];

                    return (
                      <div
                        key={p.id}
                        className="grid items-center gap-4 border-b border-steel/20 bg-midnight/95 px-[18px] py-[18px] transition duration-150 last:border-b-0 hover:border-gold/20"
                        style={{ gridTemplateColumns: COLS }}
                      >
                        {/* player */}
                        <div className="min-w-0">
                          <PlayerIdentity
                            gameName={p.gameName}
                            tagLine={p.tagLine}
                            profileIconId={p.profileIconId}
                            size="md"
                          />
                        </div>

                        {/* Elo */}
                        <div className="flex items-center gap-4">
                          {rankError ? (
                            <div className="text-rose-300">Rank unavailable</div>
                          ) : (
                            <RankEmblem tier={tier} division={r?.rank} lp={r?.leaguePoints} size={80} />
                          )}
                        </div>

                        {/* +/- LPS */}
                        <div className="text-center font-mono text-sm tabular">
                          {typeof p.lpDelta === 'number' ? (
                            <span className={`${p.lpDelta >= 0 ? 'text-win' : 'text-loss'} font-semibold`}>
                              {p.lpDelta >= 0 ? `+${p.lpDelta}` : p.lpDelta}
                            </span>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </div>

                        {/* M */}
                        <div className="text-center font-mono text-sm tabular text-ink">{games}</div>

                        {/* W */}
                        <div className="text-center font-mono text-sm tabular text-win">{wins}</div>

                        {/* L */}
                        <div className="text-center font-mono text-sm tabular text-loss">{losses}</div>

                        {/* WR */}
                        <div className="text-center font-mono font-semibold">{games > 0 ? `${wr}%` : <span className="text-xs text-faint">—</span>}</div>

                        {/* STREAK — always 10 ranked solo (queue 420) slots, newest → oldest */}
                        <div className="flex flex-nowrap items-center gap-2">
                          {Array.from({ length: 10 }).map((_, idx) => {
                            const m = (recent || [])[idx];
                            if (!m) {
                              return (
                                <div
                                  key={`empty-${idx}`}
                                  className="h-[34px] w-[34px] shrink-0 rounded-sm border-b-4 border-steel/40 bg-steel-soft/30"
                                  aria-hidden
                                />
                              );
                            }
                            return (
                              <div
                                key={m.matchId}
                                className={`shrink-0 overflow-hidden rounded-sm border-b-4 ${m.win ? 'border-win' : 'border-loss'}`}
                                title={`${m.championName} • ${m.win ? 'Win' : 'Loss'}`}
                              >
                                <ChampIcon champion={m.championName} size={34} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
            </div>
        </section>
        </>
      )}
    </div>
  );
}
