'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Loading, EmptyState } from '@/components/ui/States';
import { LiveGameCard } from '@/components/live/LiveGameCard';

const REFRESH_MS = 45 * 1000;

interface UniqueGame {
  gameId: string;
  game: any;
  trackedPlayers: any[];
}

export default function LiveGamesPage() {
  const [games, setGames] = useState<UniqueGame[]>([]);
  const [rankByPuuid, setRankByPuuid] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Track which gameIds we've already shown so we only animate genuinely new ones.
  const seen = useRef<Set<string>>(new Set());
  const [animating, setAnimating] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    const [liveRes, lbRes] = await Promise.all([
      window.fetch('/api/livegames'),
      window.fetch('/api/leaderboard').catch(() => null),
    ]);
    const liveData: any[] = await liveRes.json();

    // ranked map (for the focused player's emblem/LP)
    if (lbRes) {
      try {
        const lb: any[] = await lbRes.json();
        const map: Record<string, any> = {};
        for (const p of lb) if (p.puuid && p.ranked) map[p.puuid] = p.ranked;
        setRankByPuuid(map);
      } catch {
        /* ranked is optional decoration */
      }
    }

    // dedupe by gameId, collecting every tracked player in each game
    const byId = new Map<string, UniqueGame>();
    for (const entry of liveData) {
      if (!entry?.game) continue;
      const id = String(entry.game.gameId);
      const existing = byId.get(id);
      if (existing) {
        existing.trackedPlayers.push(entry.player);
      } else {
        byId.set(id, { gameId: id, game: entry.game, trackedPlayers: [entry.player] });
      }
    }
    const unique = Array.from(byId.values());

    // mark newly-appeared games for the entrance animation
    const fresh = unique.map((g) => g.gameId).filter((id) => !seen.current.has(id));
    if (fresh.length) {
      setAnimating((prev) => new Set([...Array.from(prev), ...fresh]));
      fresh.forEach((id) =>
        setTimeout(() => {
          setAnimating((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 2200),
      );
    }
    // forget games that ended so they can animate again if they recur
    seen.current = new Set(unique.map((g) => g.gameId));

    setGames(unique);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 pb-24">
      <PageHeader
        eyebrow="라이브 게임 · Live"
        title="Live Games"
        subtitle="Currently tracked players in game."
        right={
          <div className="flex items-center gap-2 rounded-full border border-steel/70 bg-midnight/60 px-4 py-2 text-xs text-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-[#ff1717]" />
            {lastUpdate
              ? `Updated ${lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading…'}
          </div>
        }
      />

      {loading ? (
        <Loading label="Fetching live games" />
      ) : games.length === 0 ? (
        <EmptyState title="No tracked players are currently in game.">
          When someone on your board starts a ranked game, their match will appear here.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {games.map((g) => (
            <LiveGameCard
              key={g.gameId}
              game={g.game}
              trackedPlayers={g.trackedPlayers}
              rankByPuuid={rankByPuuid}
              isNew={animating.has(g.gameId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
