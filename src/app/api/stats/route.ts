import { NextRequest, NextResponse } from 'next/server';
import { getMatchCache, getMatchesForPlayer } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerIdStr = searchParams.get('playerId');

  let rows: any[];
  if (playerIdStr) {
    rows = getMatchesForPlayer(parseInt(playerIdStr), 50);
  } else {
    const cache = getMatchCache();
    rows = Object.values(cache).flat();
  }

  if (!rows.length) return NextResponse.json(null);

  const wins = rows.filter(r => r.win).length;
  const losses = rows.length - wins;
  const avgKills = rows.reduce((s, r) => s + r.kills, 0) / rows.length;
  const avgDeaths = rows.reduce((s, r) => s + r.deaths, 0) / rows.length;
  const avgAssists = rows.reduce((s, r) => s + r.assists, 0) / rows.length;
  const avgKDA = avgDeaths === 0 ? avgKills + avgAssists : (avgKills + avgAssists) / avgDeaths;
  const avgCS = rows.reduce((s, r) => s + r.cs, 0) / rows.length;

  const champMap: Record<string, any> = {};
  for (const row of rows) {
    if (!champMap[row.championName]) champMap[row.championName] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    champMap[row.championName].games++;
    if (row.win) champMap[row.championName].wins++;
    champMap[row.championName].kills += row.kills;
    champMap[row.championName].deaths += row.deaths;
    champMap[row.championName].assists += row.assists;
  }

  const championStats = Object.entries(champMap)
    .map(([championName, s]) => ({ championName, ...s }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  return NextResponse.json({
    totalGames: rows.length, wins, losses,
    winRate: Math.round((wins / rows.length) * 100),
    avgKills: +avgKills.toFixed(1), avgDeaths: +avgDeaths.toFixed(1),
    avgAssists: +avgAssists.toFixed(1), avgKDA: +avgKDA.toFixed(2),
    avgCS: +avgCS.toFixed(0), championStats,
  });
}
