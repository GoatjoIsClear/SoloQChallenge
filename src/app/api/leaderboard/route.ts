import { NextResponse } from 'next/server';
import { getPlayers, setRankedForPlayer, getRankedCache, updatePlayer, getMatchCache, updateLPSnapshot } from '@/lib/db';
import { getAccountByRiotId, getRankedStatsByPuuid, getSummonerByPuuid, getMatchIds, getMatch } from '@/lib/riot';
import { Region } from '@/types';
import { getRankScore } from '@/lib/helpers';

function makeUnranked() {
  return {
    queueType: 'RANKED_SOLO_5x5',
    tier: 'UNRANKED',
    rank: '',
    leaguePoints: 0,
    wins: 0,
    losses: 0,
    hotStreak: false,
  };
}

function computeTotalLp(tier: string, division: string | undefined, lp: number) {
  const t = (tier || 'UNRANKED').toUpperCase();
  const baseMap: Record<string, number> = {
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 2800,
    CHALLENGER: 2800,
  };
  const divisionOffset: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') {
    return 2800 + (lp || 0);
  }
  const base = baseMap[t] ?? 0;
  const off = division ? (divisionOffset[division.toUpperCase()] ?? 0) : 0;
  return base + off + (lp || 0);
}

async function ensureSummonerId(player: any) {
  let currentPlayer = player;

  if (!currentPlayer.puuid) {
    const account = await getAccountByRiotId(currentPlayer.gameName, currentPlayer.tagLine, currentPlayer.region as Region);
    if (!account) return null;
    currentPlayer = updatePlayer(currentPlayer.id, {
      puuid: account.puuid,
      accountId: account.accountId || account.id || undefined,
    }) || currentPlayer;
  }

  if (currentPlayer.summonerId) return currentPlayer.summonerId;

  const summoner = await getSummonerByPuuid(currentPlayer.puuid, currentPlayer.region as Region);
  let summonerId = summoner?.id;
  let profileIconId = summoner?.profileIconId;
  let summonerLevel = summoner?.summonerLevel;

  if (!summonerId) {
    const matchIds = await getMatchIds(currentPlayer.puuid, currentPlayer.region as Region, 1);
    if (matchIds?.length) {
      const match = await getMatch(matchIds[0], currentPlayer.region as Region);
      const participant = match?.info?.participants?.find((p: any) => p.puuid === currentPlayer.puuid);
      if (participant?.summonerId) summonerId = participant.summonerId;
      if (!profileIconId && participant?.profileIconId) profileIconId = participant.profileIconId;
      if (!summonerLevel && participant?.summonerLevel) summonerLevel = participant.summonerLevel;
    }
  }

  if (!summonerId) return null;

  currentPlayer = updatePlayer(currentPlayer.id, {
    summonerId,
    profileIconId,
    summonerLevel,
  }) || currentPlayer;

  return summonerId;
}

export async function GET() {
  const players = getPlayers();
  const rankedCache = getRankedCache();

  const results = await Promise.all(
    players.map(async (player) => {
      const cached = rankedCache[player.id];

      // derive match-based stats (use cached matches as a fallback when league data is not available)
      const matchCache = getMatchCache();
      const allMatches = (matchCache[player.id] || []).slice().sort((a, b) => b.gameCreation - a.gameCreation).slice(0, 50);
      const soloMatches = allMatches.filter((m) => m.queueId === 420);
      const winsFromMatches = soloMatches.reduce((s, m) => s + (m.win ? 1 : 0), 0);
      const gamesFromMatches = soloMatches.length;
      const lossesFromMatches = gamesFromMatches - winsFromMatches;
      const winRateFromMatches = gamesFromMatches ? Math.round((winsFromMatches / gamesFromMatches) * 100) : 0;
      const recentFromMatches = soloMatches.slice(0, 10).map((m) => ({ matchId: m.matchId, championName: m.championName, win: m.win, gameCreation: m.gameCreation }));

      try {
        // ensure player has a puuid (use account-v1 fallback inside ensureSummonerId)
        await ensureSummonerId(player);
        if (!player.puuid) {
          return { ...player, ranked: cached?.['RANKED_SOLO_5x5'] ?? makeUnranked(), games: gamesFromMatches, wins: winsFromMatches, losses: lossesFromMatches, winRate: winRateFromMatches, recent: recentFromMatches };
        }

        try {
          const entries: any[] | null = await getRankedStatsByPuuid(player.puuid, player.region as Region);
          if (!entries) {
            return { ...player, ranked: cached?.['RANKED_SOLO_5x5'] ?? makeUnranked(), games: gamesFromMatches, wins: winsFromMatches, losses: lossesFromMatches, winRate: winRateFromMatches, recent: recentFromMatches };
          }

          const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
          if (!solo) {
            const unranked = makeUnranked();
            setRankedForPlayer(player.id, 'RANKED_SOLO_5x5', unranked);
            return { ...player, ranked: unranked, games: gamesFromMatches, wins: winsFromMatches, losses: lossesFromMatches, winRate: winRateFromMatches, recent: recentFromMatches };
          }

          const ranked = {
            queueType: 'RANKED_SOLO_5x5',
            tier: solo.tier,
            division: solo.rank,
            rank: solo.rank,
            leaguePoints: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
            hotStreak: solo.hotStreak,
          };

          setRankedForPlayer(player.id, 'RANKED_SOLO_5x5', ranked);

          const gamesFromLeague = (solo.wins || 0) + (solo.losses || 0);
          const winRateFromLeague = gamesFromLeague ? Math.round((solo.wins / gamesFromLeague) * 100) : 0;

          const currentTotalLp = computeTotalLp(solo.tier, solo.rank, solo.leaguePoints || 0);

          // Update snapshot and compute delta (updateLPSnapshot preserves previousTotalLp internally)
          let lpSnapshot;
          try {
            lpSnapshot = updateLPSnapshot(player.puuid, currentTotalLp);
          } catch {
            lpSnapshot = undefined;
          }

          // Fetch last 10 ranked solo matches for streak (prefer live API; fall back to cached matches)
          let streak = recentFromMatches;
          try {
            const matchIds: string[] | null = await getMatchIds(player.puuid, player.region as Region, 10);
            if (matchIds && matchIds.length) {
              const fetched = [] as any[];
              for (const id of matchIds) {
                try {
                  const match = await getMatch(id, player.region as Region);
                  const participant = match?.info?.participants?.find((p: any) => p.puuid === player.puuid);
                  if (participant) {
                    fetched.push({ matchId: id, championName: participant.championName, win: participant.win, gameCreation: match.info.gameCreation });
                  }
                } catch (err) {
                  // ignore individual match fetch failures
                }
              }
              if (fetched.length) streak = fetched.slice(0, 10);
            }
          } catch {
            // ignore
          }

          return {
            ...player,
            ranked,
            games: gamesFromLeague,
            wins: solo.wins,
            losses: solo.losses,
            winRate: winRateFromLeague,
            lp: solo.leaguePoints,
            lpSnapshot,
            lpDelta: lpSnapshot?.deltaLp,
            recent: streak,
            currentTotalLp,
          };
        } catch (e: any) {
          // Distinguish authorization/forbidden errors from real 'unranked' responses.
          if (e && (e.status === 401 || e.status === 403)) {
            // Do NOT treat 401/403 as UNRANKED. Prefer cached value if present and expose an error flag.
            return {
              ...player,
              ranked: cached?.['RANKED_SOLO_5x5'] ?? undefined,
              games: gamesFromMatches,
              wins: winsFromMatches,
              losses: lossesFromMatches,
              winRate: winRateFromMatches,
              recent: recentFromMatches,
              rankFetchError: { status: e.status, message: e.message || e.body || 'Forbidden' },
            };
          }

          // Other errors: fall back to cached/unranked
          return { ...player, ranked: cached?.['RANKED_SOLO_5x5'] ?? makeUnranked(), games: gamesFromMatches, wins: winsFromMatches, losses: lossesFromMatches, winRate: winRateFromMatches, recent: recentFromMatches };
        }
      } catch {
        return { ...player, ranked: cached?.['RANKED_SOLO_5x5'] ?? makeUnranked(), games: gamesFromMatches, wins: winsFromMatches, losses: lossesFromMatches, winRate: winRateFromMatches, recent: recentFromMatches };
      }
    }),
  );

  results.sort((a, b) => {
    const aScore = a.ranked ? getRankScore(a.ranked.tier, a.ranked.rank, a.ranked.leaguePoints) : -1;
    const bScore = b.ranked ? getRankScore(b.ranked.tier, b.ranked.rank, b.ranked.leaguePoints) : -1;
    return bScore - aScore;
  });

  return NextResponse.json(results);
}
