import { Region, RoutingRegion } from '@/types';

const API_KEY = process.env.RIOT_API_KEY || '';

const REGION_TO_PLATFORM: Record<Region, string> = {
  EUW1: 'euw1',
  EUN1: 'eun1',
  NA1: 'na1',
  KR: 'kr',
  BR1: 'br1',
  JP1: 'jp1',
  LA1: 'la1',
  LA2: 'la2',
  OC1: 'oc1',
  TR1: 'tr1',
  RU: 'ru',
};

const REGION_TO_ROUTING: Record<Region, RoutingRegion> = {
  EUW1: 'europe',
  EUN1: 'europe',
  NA1: 'americas',
  KR: 'asia',
  BR1: 'americas',
  JP1: 'asia',
  LA1: 'americas',
  LA2: 'americas',
  OC1: 'sea',
  TR1: 'europe',
  RU: 'europe',
};

async function riotFetch(url: string) {
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': API_KEY },
    next: { revalidate: 0 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    console.error(`[Riot API ${res.status}] ${url} - ${text}`);
    const err: any = new Error(`Riot API error ${res.status}: ${text}`);
    // attach status and body so callers can distinguish 401/403/429/etc
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

export async function getAccountByRiotId(gameName: string, tagLine: string, region: Region) {
  const routing = REGION_TO_ROUTING[region];
  return riotFetch(
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

export async function getSummonerByPuuid(puuid: string, region: Region) {
  const platform = REGION_TO_PLATFORM[region];
  return riotFetch(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );
}

export async function getRankedStatsByPuuid(puuid: string, region: Region) {
  const platform = REGION_TO_PLATFORM[region];
  return riotFetch(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
  );
}

export async function getMatchIds(puuid: string, region: Region, count = 20) {
  const routing = REGION_TO_ROUTING[region];
  return riotFetch(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=${count}`
  );
}

export async function getMatch(matchId: string, region: Region) {
  const routing = REGION_TO_ROUTING[region];
  return riotFetch(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  );
}

export async function getLiveGame(puuid: string, region: Region) {
  const platform = REGION_TO_PLATFORM[region];
  return riotFetch(
    `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`
  );
}

export function getPlatform(region: Region) {
  return REGION_TO_PLATFORM[region];
}

export function getRouting(region: Region) {
  return REGION_TO_ROUTING[region];
}
