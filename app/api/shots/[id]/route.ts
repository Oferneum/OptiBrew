import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRequestClient } from '@/lib/supabase';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const db = getRequestClient(req);
  const { data, error } = await db.from('shots').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const db = getRequestClient(req);
  const body = await req.json();
  const { data, error } = await db
    .from('shots')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const db = getRequestClient(req);
  const { error } = await db.from('shots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
