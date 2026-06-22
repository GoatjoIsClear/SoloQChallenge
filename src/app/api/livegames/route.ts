import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/db';
import { getLiveGame } from '@/lib/riot';
import { Region } from '@/types';

export async function GET() {
  const players = getPlayers().filter(p => p.puuid);
  const liveGames = await Promise.all(
    players.map(async (player) => {
      try {
        const game = await getLiveGame(player.puuid!, player.region as Region);
        if (!game) return null;
        return { player, game };
      } catch { return null; }
    })
  );
  return NextResponse.json(liveGames.filter(Boolean));
}
