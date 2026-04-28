import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q')?.trim();

  if (!q || !type) return NextResponse.json([]);

  if (type === 'beans') {
    const { data, error } = await supabase.rpc('search_beans', { query: q, threshold: 0.6 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (type === 'equipment') {
    const { data, error } = await supabase.rpc('search_equipment', { query: q, threshold: 0.6 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}
