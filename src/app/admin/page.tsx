'use client';

import { useEffect, useState } from 'react';
import { Region } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';

const REGIONS: Region[] = ['EUW1', 'EUN1', 'NA1', 'KR', 'BR1', 'JP1', 'LA1', 'LA2', 'OC1', 'TR1', 'RU'];

const inputClass =
  'w-full rounded-lg border border-steel/70 bg-void/50 px-4 py-2 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/20';
const labelClass = 'mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted';

export default function AdminPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState<Region>('EUW1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadPlayers() {
    const res = await window.fetch('/api/players');
    const data = await res.json();
    setPlayers(data);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await window.fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName: gameName.trim(), tagLine: tagLine.trim(), region }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        setLoading(false);
        return;
      }
      setSuccess(`${gameName}#${tagLine} added`);
      setGameName('');
      setTagLine('');
      await loadPlayers();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    await window.fetch(`/api/players/${id}`, { method: 'DELETE' });
    await loadPlayers();
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8 pb-20">
      <PageHeader
        eyebrow="선수 · Players"
        title="Manage tracked players"
        subtitle="Add friends by Riot ID — each is verified through the Riot API before it lands on the board."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
        {/* Add form */}
        <Card>
          <CardHeader title="Add player" />
          <form onSubmit={handleAdd} className="flex flex-col gap-4 p-6">
            {error ? (
              <div className="rounded-lg border border-loss/30 bg-loss/10 px-4 py-2 text-sm text-loss">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-lg border border-win/30 bg-win/10 px-4 py-2 text-sm text-win">
                ✓ {success}
              </div>
            ) : null}

            <div>
              <label className={labelClass}>Game name</label>
              <input
                className={inputClass}
                placeholder="Faker"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Tag line</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base text-faint">#</span>
                <input
                  className={inputClass}
                  placeholder="KR1"
                  value={tagLine}
                  onChange={(e) => setTagLine(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Region</label>
              <select
                className={inputClass}
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-midnight text-ink">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gold-bright to-gold px-6 py-4 font-display text-sm font-semibold uppercase tracking-wide text-void transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-void/40 border-t-void" />
                  Adding…
                </>
              ) : (
                'Add player'
              )}
            </button>

            <p className="text-xs leading-relaxed text-faint">
              Set <span className="font-mono text-muted">RIOT_API_KEY</span> in{' '}
              <span className="font-mono text-muted">.env.local</span> for verification to work.
            </p>
          </form>
        </Card>

        {/* Player list */}
        <div>
          <div className="mb-4 text-sm text-muted">
            {players.length} player{players.length !== 1 ? 's' : ''} tracked
          </div>
          {players.length === 0 ? (
            <EmptyState title="No players yet">Add your first friend using the form.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {players.map((p) => (
                <Card key={p.id} className="flex items-center gap-4 p-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-steel/80 bg-steel-soft font-display font-semibold text-gold">
                    {p.gameName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{p.gameName}</div>
                    <div className="font-mono text-xs text-faint">#{p.tagLine}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-steel-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {p.region}
                      </span>
                      {p.summonerLevel ? (
                        <span className="text-[11px] text-faint">Lvl {p.summonerLevel}</span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, `${p.gameName}#${p.tagLine}`)}
                    aria-label={`Delete ${p.gameName}`}
                    className="shrink-0 rounded-lg border border-loss/30 px-4 py-2 text-xs font-medium text-loss transition-colors hover:bg-loss/10"
                  >
                    Delete
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
