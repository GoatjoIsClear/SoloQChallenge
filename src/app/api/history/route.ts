import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, getMatchesForPlayer, setMatchesForPlayer } from '@/lib/db';
import { getMatchIds, getMatch } from '@/lib/riot';
import { Region } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');

  const players = (await getPlayers()).filter((p) => p.puuid);
  if (playerId) {
    const player = players.find((p) => p.id === playerId);
    if (!player) return NextResponse.json([]);
    await syncMatches(player);
    return NextResponse.json(await getMatchesForPlayer(playerId, 20));
  }

  await Promise.all(players.map((p) => syncMatches(p)));

  const allMatches: Record<string, any[]> = {};
  for (const p of players) {
    allMatches[p.id] = await getMatchesForPlayer(p.id, 10);
  }
  return NextResponse.json(allMatches);
}

async function syncMatches(player: any) {
  try {
    const matchIds: string[] = await getMatchIds(player.puuid, player.region as Region, 20);
    if (!matchIds?.length) return;

    const freshMatches = [] as any[];
    const idsToFetch = matchIds.slice(0, 10);

    for (const matchId of idsToFetch) {
      try {
        const match = await getMatch(matchId, player.region as Region);
        if (!match) continue;
        const p = match.info.participants.find((x: any) => x.puuid === player.puuid);
        if (!p) continue;
        freshMatches.push({
          matchId,
          gameCreation: match.info.gameCreation,
          gameDuration: match.info.gameDuration,
          gameMode: match.info.gameMode,
          queueId: match.info.queueId,
          win: p.win,
          championId: p.championId,
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          cs: p.totalMinionsKilled + p.neutralMinionsKilled,
          goldEarned: p.goldEarned,
          visionScore: p.visionScore,
          item0: p.item0,
          item1: p.item1,
          item2: p.item2,
          item3: p.item3,
          item4: p.item4,
          item5: p.item5,
          item6: p.item6,
          summoner1Id: p.summoner1Id,
          summoner2Id: p.summoner2Id,
        });
      } catch {
        /* skip */
      }
    }

    if (freshMatches.length) {
      await setMatchesForPlayer(player.id, freshMatches);
    }
  } catch {
    /* skip */
  }
}
