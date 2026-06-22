export type Region = 'EUW1' | 'EUN1' | 'NA1' | 'KR' | 'BR1' | 'JP1' | 'LA1' | 'LA2' | 'OC1' | 'TR1' | 'RU';
export type RoutingRegion = 'europe' | 'americas' | 'asia' | 'sea';

export interface Player {
  id: number;
  gameName: string;
  tagLine: string;
  region: Region;
  puuid?: string;
  summonerId?: string;
  profileIconId?: number;
  summonerLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankedStats {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface MatchSummary {
  matchId: string;
  championName: string;
  win: boolean;
  gameCreation: number;
}

export interface PlayerWithStats extends Player {
  ranked?: RankedStats;
  flexRanked?: RankedStats;
  games?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  recent?: MatchSummary[];
  rankFetchError?: {
    status: number;
    message: string;
  };
  lpDelta?: number;
  currentTotalLp?: number;
  lpSnapshot?: any;
}

export interface LiveGame {
  gameId: number;
  gameType: string;
  gameQueueConfigId: number;
  gameMode: string;
  gameDuration: number;
  gameStartTime: number;
  participants: LiveParticipant[];
  bannedChampions: BannedChampion[];
}

export interface LiveParticipant {
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  championName?: string;
  profileIconId: number;
  summonerName: string;
  riotId?: string;
  perks?: LivePerks;
}

export interface LivePerks {
  perkStyle: number;
  perkSubStyle: number;
  perkIds: number[];
}

export interface BannedChampion {
  pickTurn: number;
  championId: number;
  teamId: number;
}

export interface Match {
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
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgCS: number;
  championStats: ChampionStat[];
}

export interface ChampionStat {
  championName: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}
