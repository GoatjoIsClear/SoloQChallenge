import { NextRequest, NextResponse } from 'next/server';
import { addPlayer, getPlayers, setRankedForPlayer } from '@/lib/db';
import { getAccountByRiotId, getSummonerByPuuid, getRankedStatsByPuuid, getMatchIds, getMatch } from '@/lib/riot';
import { Region } from '@/types';

export async function GET() {
  return NextResponse.json(getPlayers());
}

export async function POST(req: NextRequest) {
  const { gameName, tagLine, region } = await req.json();
  if (!gameName || !tagLine || !region) {
    return NextResponse.json({ error: 'gameName, tagLine and region are required' }, { status: 400 });
  }

  let puuid: string | undefined;
  let accountId: string | undefined;
  let summonerId: string | undefined;
  let profileIconId: number | undefined;
  let summonerLevel: number | undefined;

  try {
    const account = await getAccountByRiotId(gameName, tagLine, region as Region);
    if (!account) return NextResponse.json({ error: 'Riot ID not found' }, { status: 404 });
    puuid = account.puuid;
    accountId = account.accountId || account.id || undefined;

    if (puuid) {
      const summoner = await getSummonerByPuuid(puuid, region as Region);
      if (summoner) {
        summonerId = summoner.id;
        profileIconId = summoner.profileIconId;
        summonerLevel = summoner.summonerLevel;
      }

      if (!summonerId) {
        const recentMatchIds = await getMatchIds(puuid, region as Region, 1);
        if (recentMatchIds?.length) {
          const recentMatch = await getMatch(recentMatchIds[0], region as Region);
          const participant = recentMatch?.info?.participants?.find((x: any) => x.puuid === puuid);
          if (participant?.summonerId) summonerId = participant.summonerId;
          if (!profileIconId && participant?.profileIconId) {
            profileIconId = participant.profileIconId;
          }
          if (!summonerLevel && participant?.summonerLevel) {
            summonerLevel = participant.summonerLevel;
          }
        }
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  try {
    const player = addPlayer({
      gameName,
      tagLine,
      region,
      puuid,
      accountId,
      summonerId,
      profileIconId,
      summonerLevel,
    });

    if (puuid) {
      try {
        const entries = await getRankedStatsByPuuid(puuid, region as Region);
        const solo = entries?.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');
        if (solo) {
          setRankedForPlayer(player.id, 'RANKED_SOLO_5x5', {
            queueType: 'RANKED_SOLO_5x5',
            tier: solo.tier,
            rank: solo.rank,
            leaguePoints: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
            hotStreak: solo.hotStreak,
          });
        }
      } catch {
        // ignore ranked cache update on add
      }
    }

    return NextResponse.json(player, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) return NextResponse.json({ error: 'Player already exists' }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
