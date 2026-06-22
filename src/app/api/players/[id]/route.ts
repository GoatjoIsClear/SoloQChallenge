import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, deletePlayer, updatePlayer } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  const player = getPlayers().find(p => p.id === id);
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deletePlayer(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr);
  const fields = await req.json();
  const player = updatePlayer(id, fields);
  return NextResponse.json(player);
}
