'use client';

import { useEffect, useState } from 'react';
import { formatDuration, timeAgo, QUEUE_NAMES } from '@/lib/helpers';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { ChampIcon } from '@/components/ui/ChampIcon';
import { Tabs, TabOption } from '@/components/ui/Tabs';
import { Loading, EmptyState } from '@/components/ui/States';

function MatchRow({ m }: { m: any }) {
  const kda =
    m.deaths === 0
      ? (m.kills + m.assists).toFixed(1)
      : ((m.kills + m.assists) / m.deaths).toFixed(2);
  const queueName = QUEUE_NAMES[m.queueId] ?? m.gameMode;
  const accent = m.win ? 'border-l-win bg-win/[0.04]' : 'border-l-loss bg-loss/[0.04]';

  return (
    <div className={`flex items-center gap-4 border-l-2 ${accent} px-4 py-4`}>
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-md font-display text-xs font-bold ${
          m.win ? 'bg-win/15 text-win' : 'bg-loss/15 text-loss'
        }`}
      >
        {m.win ? 'W' : 'L'}
      </span>
      <ChampIcon champion={m.championName} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{m.championName}</div>
        <div className="text-xs text-faint">{queueName}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm tabular">
          <span className="text-win">{m.kills}</span>
          <span className="text-faint"> / </span>
          <span className="text-loss">{m.deaths}</span>
          <span className="text-faint"> / </span>
          <span className="text-ink">{m.assists}</span>
        </div>
        <div className="font-mono text-xs text-muted">{kda} KDA</div>
      </div>
      <div className="hidden w-16 text-right text-xs text-muted sm:block">
        <div>{m.cs} CS</div>
        <div>{formatDuration(m.gameDuration)}</div>
      </div>
      <div className="hidden w-20 text-right text-xs text-faint md:block">
        {timeAgo(m.gameCreation)}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<Record<number, any[]>>({});
  const [selected, setSelected] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch('/api/players').then((r) => r.json()).then(setPlayers);
    window
      .fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      });
  }, []);

  const displayPlayers =
    selected === 'all' ? players : players.filter((p) => p.id === selected);

  const tabOptions: TabOption[] = [
    { key: 'all', label: 'All players' },
    ...players.map((p) => ({ key: p.id, label: p.gameName })),
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8 pb-20">
      <PageHeader
        eyebrow="전적 · History"
        title="Recent match history"
        subtitle="The latest games for everyone on the board, newest first."
      />

      <div className="mb-6">
        <Tabs options={tabOptions} value={selected} onChange={(k) => setSelected(k as number | 'all')} />
      </div>

      {loading ? (
        <Loading />
      ) : displayPlayers.length === 0 ? (
        <EmptyState title="No players">Add players to start collecting match history.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {displayPlayers.map((player) => {
            const playerMatches = matches[player.id] ?? [];
            return (
              <Card key={player.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {player.gameName}
                      <span className="font-mono text-xs font-normal normal-case tracking-normal text-faint">
                        #{player.tagLine}
                      </span>
                      <span className="rounded bg-steel-soft px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-muted">
                        {player.region}
                      </span>
                    </span>
                  }
                  meta={`${playerMatches.length} game${playerMatches.length === 1 ? '' : 's'}`}
                />
                {playerMatches.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted">No games found.</div>
                ) : (
                  <div className="divide-y divide-steel/40">
                    {playerMatches.map((m: any) => (
                      <MatchRow key={m.matchId} m={m} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
