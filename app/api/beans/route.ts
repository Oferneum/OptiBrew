import { NextResponse } from 'next/server';
import { supabase, getRequestClient } from '@/lib/supabase';

// Global community read — no auth required, RLS SELECT is USING (true)
export async function GET() {
  const { data, error } = await supabase
    .from('beans')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const db = getRequestClient(req);
  const body = await req.json();

  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: dupes } = await db.rpc('search_beans', {
    query: `${body.roaster} ${body.origin}`,
    threshold: 0.6,
  });
  if (dupes && dupes.length > 0) {
    return NextResponse.json({ conflict: true, match: dupes[0] }, { status: 409 });
  }

  const { data, error } = await db
    .from('beans')
    .insert({
      roaster:      body.roaster,
      bag_name:     body.bag_name     ?? null,
      origin:       body.origin,
      roast_date:   body.roast_date,
      is_active:    body.is_active ?? true,
      price_paid:   body.price_paid   ?? null,
      weight_grams: body.weight_grams ?? null,
      user_id:      user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
