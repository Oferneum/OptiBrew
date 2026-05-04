import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';

export async function GET(req: Request) {
  const db = getRequestClient(req);
  const { data, error } = await db
    .from('beans')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const db = getRequestClient(req);
  const body = await req.json();

  const { data: dupes } = await db.rpc('search_beans', {
    query: `${body.roaster} ${body.origin}`,
    threshold: 0.6,
  });
  if (dupes && dupes.length > 0) {
    return NextResponse.json({ conflict: true, match: dupes[0] }, { status: 409 });
  }

  const { data, error } = await db.from('beans').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
