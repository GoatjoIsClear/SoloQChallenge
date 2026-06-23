import { supabase, assertSupabaseConfigured } from './supabase';

// ===========================================================================
//  Storage layer — backed by Supabase (no more local JSON files).
//  Function names and shapes match the old file-based layer; the only change
//  for callers is that every function is now async and must be awaited.
// ===========================================================================

// --- Players ---------------------------------------------------------------
export interface DBPlayer {
  id: string; // uuid
  gameName: string;
  tagLine: string;
  region: string;
  puuid?: string;
  summonerId?: string;
  accountId?: string;
  profileIconId?: number;
  summonerLevel?: number;
  createdAt: string;
  updatedAt: string;
}

function rowToPlayer(r: any): DBPlayer {
  return {
    id: r.id,
    gameName: r.game_name,
    tagLine: r.tag_line,
    region: r.region,
    puuid: r.puuid ?? undefined,
    summonerId: r.summoner_id ?? undefined,
    accountId: r.account_id ?? undefined,
    profileIconId: r.profile_icon_id ?? undefined,
    summonerLevel: r.summoner_level ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getPlayers(): Promise<DBPlayer[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`getPlayers: ${error.message}`);
  return (data ?? []).map(rowToPlayer);
}

export async function addPlayer(
  p: Omit<DBPlayer, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<DBPlayer> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('players')
    .insert({
      game_name: p.gameName,
      tag_line: p.tagLine,
      region: p.region,
      puuid: p.puuid ?? null,
      summoner_id: p.summonerId ?? null,
      account_id: p.accountId ?? null,
      profile_icon_id: p.profileIconId ?? null,
      summoner_level: p.summonerLevel ?? null,
    })
    .select('*')
    .single();

  if (error) {
    // 23505 = unique_violation (duplicate Riot ID + region)
    if ((error as any).code === '23505') throw new Error('UNIQUE: Player already exists');
    throw new Error(`addPlayer: ${error.message}`);
  }
  return rowToPlayer(data);
}

export async function deletePlayer(id: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw new Error(`deletePlayer: ${error.message}`);
  // Clean up this player's cached ranked + match entries.
  await supabase.from('cache').delete().in('key', [`ranked:${id}`, `matches:${id}`]);
}

export async function updatePlayer(
  id: string,
  fields: Partial<DBPlayer>,
): Promise<DBPlayer | undefined> {
  assertSupabaseConfigured();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.gameName !== undefined) patch.game_name = fields.gameName;
  if (fields.tagLine !== undefined) patch.tag_line = fields.tagLine;
  if (fields.region !== undefined) patch.region = fields.region;
  if (fields.puuid !== undefined) patch.puuid = fields.puuid;
  if (fields.summonerId !== undefined) patch.summoner_id = fields.summonerId;
  if (fields.accountId !== undefined) patch.account_id = fields.accountId;
  if (fields.profileIconId !== undefined) patch.profile_icon_id = fields.profileIconId;
  if (fields.summonerLevel !== undefined) patch.summoner_level = fields.summonerLevel;

  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`updatePlayer: ${error.message}`);
  return data ? rowToPlayer(data) : undefined;
}

// --- Cache helpers (ranked + match caches live in the `cache` table) --------
async function readCache<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase.from('cache').select('value').eq('key', key).maybeSingle();
  if (error || !data) return fallback;
  return (data.value as T) ?? fallback;
}

async function writeCache(key: string, value: unknown): Promise<void> {
  await supabase
    .from('cache')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

// --- Ranked Cache ----------------------------------------------------------
export interface DBRanked {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  updatedAt: string;
}

type RankedCache = Record<string, Record<string, DBRanked>>;

export async function getRankedCache(): Promise<RankedCache> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from('cache').select('key,value').like('key', 'ranked:%');
  if (error) return {};
  const out: RankedCache = {};
  for (const row of data ?? []) {
    out[(row.key as string).slice('ranked:'.length)] = row.value as Record<string, DBRanked>;
  }
  return out;
}

export async function setRankedForPlayer(
  playerId: string,
  queueType: string,
  data: Omit<DBRanked, 'updatedAt'>,
): Promise<void> {
  const current = await readCache<Record<string, DBRanked>>(`ranked:${playerId}`, {});
  current[queueType] = { ...data, updatedAt: new Date().toISOString() };
  await writeCache(`ranked:${playerId}`, current);
}

// --- Match Cache -----------------------------------------------------------
export interface DBMatch {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  win: boolean;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  visionScore: number;
  item0: number; item1: number; item2: number; item3: number; item4: number; item5: number; item6: number;
  summoner1Id: number;
  summoner2Id: number;
}

type MatchCache = Record<string, DBMatch[]>;

export async function getMatchCache(): Promise<MatchCache> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from('cache').select('key,value').like('key', 'matches:%');
  if (error) return {};
  const out: MatchCache = {};
  for (const row of data ?? []) {
    out[(row.key as string).slice('matches:'.length)] = (row.value as DBMatch[]) ?? [];
  }
  return out;
}

export async function addMatch(playerId: string, match: DBMatch): Promise<void> {
  const list = await readCache<DBMatch[]>(`matches:${playerId}`, []);
  if (list.find((m) => m.matchId === match.matchId)) return;
  list.unshift(match);
  await writeCache(`matches:${playerId}`, list.slice(0, 30)); // keep last 30
}

export async function setMatchesForPlayer(playerId: string, matches: DBMatch[]): Promise<void> {
  await writeCache(`matches:${playerId}`, matches.slice(0, 30));
}

export async function getMatchesForPlayer(playerId: string, limit = 20): Promise<DBMatch[]> {
  const list = await readCache<DBMatch[]>(`matches:${playerId}`, []);
  return list
    .slice()
    .sort((a, b) => b.gameCreation - a.gameCreation)
    .slice(0, limit);
}

// --- LP Snapshots ----------------------------------------------------------
export interface LPSnapshot {
  puuid: string;
  previousTotalLp?: number;
  currentTotalLp: number;
  deltaLp?: number;
  updatedAt: string;
}

function rowToSnapshot(r: any): LPSnapshot {
  return {
    puuid: r.puuid,
    previousTotalLp: r.previous_total_lp ?? undefined,
    currentTotalLp: r.current_total_lp,
    deltaLp: r.delta_lp ?? undefined,
    updatedAt: r.updated_at,
  };
}

type LPSnapshots = Record<string, LPSnapshot>;

export async function getLPSnapshots(): Promise<LPSnapshots> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from('lp_snapshots').select('*');
  if (error) throw new Error(`getLPSnapshots: ${error.message}`);
  const out: LPSnapshots = {};
  for (const r of data ?? []) out[r.puuid] = rowToSnapshot(r);
  return out;
}

/**
 * Identical behaviour to the old JSON version: previousTotalLp is always the
 * last stored currentTotalLp, deltaLp = current - previous. One row per puuid.
 */
export async function updateLPSnapshot(
  puuid: string,
  currentTotalLp: number,
): Promise<LPSnapshot> {
  assertSupabaseConfigured();
  const { data: prevRow } = await supabase
    .from('lp_snapshots')
    .select('*')
    .eq('puuid', puuid)
    .maybeSingle();

  const previousTotalLp: number | undefined = prevRow?.current_total_lp ?? undefined;
  const deltaLp =
    typeof previousTotalLp === 'number' ? currentTotalLp - previousTotalLp : undefined;

  const payload = {
    puuid,
    previous_total_lp: previousTotalLp ?? null,
    current_total_lp: currentTotalLp,
    delta_lp: deltaLp ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('lp_snapshots')
    .upsert(payload, { onConflict: 'puuid' })
    .select('*')
    .single();
  if (error) throw new Error(`updateLPSnapshot: ${error.message}`);
  return rowToSnapshot(data);
}
