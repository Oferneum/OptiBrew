import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const { data, error } = await supabase.from('shots').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { data, error } = await supabase
    .from('shots')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/shots/[id]'>) {
  const { id } = await ctx.params;
  const { error } = await supabase.from('shots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
