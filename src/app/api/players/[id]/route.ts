import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, deletePlayer, updatePlayer } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const player = (await getPlayers()).find((p) => p.id === id);
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deletePlayer(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const fields = await req.json();
  const player = await updatePlayer(id, fields);
  return NextResponse.json(player);
}
