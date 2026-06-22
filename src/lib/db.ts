import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const RANKED_FILE = path.join(DATA_DIR, 'ranked.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const LP_SNAPSHOTS_FILE = path.join(DATA_DIR, 'lp_snapshots.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return fallback; }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Players ---
export interface DBPlayer {
  id: number;
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

export function getPlayers(): DBPlayer[] {
  return readJson<DBPlayer[]>(PLAYERS_FILE, []);
}

export function savePlayers(players: DBPlayer[]) {
  writeJson(PLAYERS_FILE, players);
}

export function addPlayer(p: Omit<DBPlayer, 'id' | 'createdAt' | 'updatedAt'>): DBPlayer {
  const players = getPlayers();
  const exists = players.find(x => x.gameName.toLowerCase() === p.gameName.toLowerCase() && x.tagLine.toLowerCase() === p.tagLine.toLowerCase() && x.region === p.region);
  if (exists) throw new Error('UNIQUE: Player already exists');
  const now = new Date().toISOString();
  const newPlayer: DBPlayer = { ...p, id: Date.now(), createdAt: now, updatedAt: now };
  players.push(newPlayer);
  savePlayers(players);
  return newPlayer;
}

export function deletePlayer(id: number) {
  const players = getPlayers().filter(p => p.id !== id);
  savePlayers(players);
  // Also clean ranked/matches
  const ranked = getRankedCache();
  delete ranked[id];
  saveRankedCache(ranked);
  const matches = getMatchCache();
  delete matches[id];
  saveMatchCache(matches);
}

export function updatePlayer(id: number, fields: Partial<DBPlayer>) {
  const players = getPlayers().map(p => p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p);
  savePlayers(players);
  return players.find(p => p.id === id);
}

// --- Ranked Cache ---
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

type RankedCache = Record<number, Record<string, DBRanked>>;

export function getRankedCache(): RankedCache {
  return readJson<RankedCache>(RANKED_FILE, {});
}

export function saveRankedCache(cache: RankedCache) {
  writeJson(RANKED_FILE, cache);
}

export function setRankedForPlayer(playerId: number, queueType: string, data: Omit<DBRanked, 'updatedAt'>) {
  const cache = getRankedCache();
  if (!cache[playerId]) cache[playerId] = {};
  cache[playerId][queueType] = { ...data, updatedAt: new Date().toISOString() };
  saveRankedCache(cache);
}

// --- Match Cache ---
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

type MatchCache = Record<number, DBMatch[]>;

export function getMatchCache(): MatchCache {
  return readJson<MatchCache>(MATCHES_FILE, {});
}

export function saveMatchCache(cache: MatchCache) {
  writeJson(MATCHES_FILE, cache);
}

export function addMatch(playerId: number, match: DBMatch) {
  const cache = getMatchCache();
  if (!cache[playerId]) cache[playerId] = [];
  if (cache[playerId].find((m) => m.matchId === match.matchId)) return;
  cache[playerId].unshift(match);
  cache[playerId] = cache[playerId].slice(0, 30); // keep last 30
  saveMatchCache(cache);
}

export function setMatchesForPlayer(playerId: number, matches: DBMatch[]) {
  const cache = getMatchCache();
  cache[playerId] = matches.slice(0, 30);
  saveMatchCache(cache);
}

export function getMatchesForPlayer(playerId: number, limit = 20): DBMatch[] {
  const cache = getMatchCache();
  return (cache[playerId] || [])
    .slice()
    .sort((a, b) => b.gameCreation - a.gameCreation)
    .slice(0, limit);
}

// --- LP Snapshots ---
export interface LPSnapshot {
  puuid: string;
  previousTotalLp?: number;
  currentTotalLp: number;
  deltaLp?: number;
  updatedAt: string;
}

type LPSnapshots = Record<string, LPSnapshot>;

export function getLPSnapshots(): LPSnapshots {
  return readJson<LPSnapshots>(LP_SNAPSHOTS_FILE, {});
}

export function saveLPSnapshots(snapshots: LPSnapshots) {
  writeJson(LP_SNAPSHOTS_FILE, snapshots);
}

export function updateLPSnapshot(puuid: string, currentTotalLp: number) {
  const snaps = getLPSnapshots();
  const prev = snaps[puuid];
  const previousTotalLp = prev?.currentTotalLp;
  const deltaLp = typeof previousTotalLp === 'number' ? currentTotalLp - previousTotalLp : undefined;
  snaps[puuid] = { puuid, previousTotalLp, currentTotalLp, deltaLp, updatedAt: new Date().toISOString() };
  saveLPSnapshots(snaps);
  return snaps[puuid];
}
