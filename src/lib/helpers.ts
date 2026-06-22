import { CHAMPION_ID_MAP } from './championMap';

export const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 9,
  GRANDMASTER: 8,
  MASTER: 7,
  DIAMOND: 6,
  EMERALD: 5,
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
  IRON: 0,
  UNRANKED: -1,
};

export const DIVISION_ORDER: Record<string, number> = {
  I: 4, II: 3, III: 2, IV: 1,
};

export const TIER_COLORS: Record<string, string> = {
  CHALLENGER: '#f4c93e',
  GRANDMASTER: '#e84057',
  MASTER: '#9d48e0',
  DIAMOND: '#57a8e0',
  EMERALD: '#2ecc8e',
  PLATINUM: '#4bc3b8',
  GOLD: '#c8963e',
  SILVER: '#8a9bb5',
  BRONZE: '#a0522d',
  IRON: '#7a6a6a',
  UNRANKED: '#555',
};

export function getRankScore(tier: string, division: string, lp: number): number {
  const tierScore = (TIER_ORDER[tier] ?? -1) * 10000;
  const divScore = (DIVISION_ORDER[division] ?? 0) * 100;
  return tierScore + divScore + lp;
}

export function formatRank(tier: string, division: string, lp: number): string {
  if (!tier || tier === 'UNRANKED') return 'Unranked';
  const noDiv = ['CHALLENGER', 'GRANDMASTER', 'MASTER'];
  if (noDiv.includes(tier)) return `${capitalize(tier)} ${lp} LP`;
  return `${capitalize(tier)} ${division} — ${lp} LP`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function getDDragonVersion(): string {
  return '14.13.1';
}

export function getChampionIconUrl(championName: string): string {
  const version = getDDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}

export function getChampionNameById(championId: number): string {
  return CHAMPION_ID_MAP[championId.toString()] ?? `Champion${championId}`;
}

export function getItemIconUrl(itemId: number): string {
  const version = getDDragonVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

export function getSpellIconUrl(spellId: number): string {
  const spellMap: Record<number, string> = {
    1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash',
    6: 'SummonerHaste', 7: 'SummonerHeal', 11: 'SummonerSmite',
    12: 'SummonerTeleport', 13: 'SummonerMana', 14: 'SummonerDot',
    21: 'SummonerBarrier', 32: 'SummonerSnowball',
  };
  const version = getDDragonVersion();
  const name = spellMap[spellId] || 'SummonerFlash';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${name}.png`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d geleden`;
  if (hours > 0) return `${hours}u geleden`;
  if (minutes > 0) return `${minutes}min geleden`;
  return 'Zojuist';
}

export const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranked Solo',
  440: 'Ranked Flex',
  400: 'Normal Draft',
  430: 'Normal Blind',
  450: 'ARAM',
  700: 'Clash',
  830: 'Co-op AI',
  900: 'URF',
  1020: 'One for All',
};
