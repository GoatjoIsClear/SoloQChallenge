'use client';

import { useEffect, useState } from 'react';
import { getWinRate } from '@/lib/helpers';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { WinRateBar } from '@/components/ui/WinRateBar';
import { ChampIcon } from '@/components/ui/ChampIcon';
import { Tabs, TabOption } from '@/components/ui/Tabs';
import { Loading, EmptyState } from '@/components/ui/States';

export default function StatsPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<number, any>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window
      .fetch('/api/players')
      .then((r) => r.json())
      .then((ps: any[]) => {
        setPlayers(ps);
        if (ps.length) setSelected(ps[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    window
      .fetch(`/api/stats?playerId=${selected}`)
      .then((r) => r.json())
      .then((data) => {
        setStats((prev) => ({ ...prev, [selected]: data }));
        setLoading(false);
      });
  }, [selected]);

  const currentStats = selected ? stats[selected] : null;
  const tabOptions: TabOption[] = players.map((p) => ({ key: p.id, label: p.gameName }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8 pb-20">
      <PageHeader
        eyebrow="통계 · Statistics"
        title="Player performance breakdown"
        subtitle="Aggregate KDA, win rate and champion pool from saved games."
      />

      <div className="mt-4 mb-6">
        {players.length > 0 ? (
          <Tabs
            options={tabOptions}
            value={selected ?? ''}
            onChange={(k) => setSelected(k as number)}
          />
        ) : null}
      </div>

      {loading ? (
        <Loading />
      ) : !currentStats ? (
        <EmptyState title="No data">No games have been saved for this player yet.</EmptyState>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Total games" value={currentStats.totalGames} accent="ice" />
            <StatTile label="Win rate" value={`${currentStats.winRate}%`} accent="gold" />
            <StatTile label="Wins" value={currentStats.wins} accent="win" />
            <StatTile label="Losses" value={currentStats.losses} accent="loss" />
            <StatTile label="Avg. KDA" value={currentStats.avgKDA} accent="neutral" />
            <StatTile label="Avg. kills" value={currentStats.avgKills} accent="neutral" />
            <StatTile label="Avg. deaths" value={currentStats.avgDeaths} accent="neutral" />
            <StatTile label="Avg. assists" value={currentStats.avgAssists} accent="neutral" />
            <StatTile label="Avg. CS" value={currentStats.avgCS} accent="neutral" />
          </section>

          <section className="mt-6">
            <Card>
              <CardHeader title="Most played champions" />
              <div className="divide-y divide-steel/40">
                {currentStats.championStats.map((c: any) => {
                  const wr = getWinRate(c.wins, c.games);
                  const kda =
                    c.deaths === 0
                      ? (c.kills + c.assists).toFixed(1)
                      : ((c.kills + c.assists) / c.deaths).toFixed(2);
                  return (
                    <div key={c.championName} className="flex items-center gap-4 px-4 py-4">
                      <ChampIcon champion={c.championName} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{c.championName}</div>
                        <div className="text-xs text-faint">{c.games} games</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs text-muted">{kda} KDA</div>
                      </div>
                      <div className="w-[120px]">
                        <WinRateBar winRate={wr} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
