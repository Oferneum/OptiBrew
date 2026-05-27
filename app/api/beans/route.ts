import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, getRequestClient } from '@/lib/supabase';

function toTitleCase(str: string): string {
  return str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const BeanInsertSchema = z.object({
  roaster:      z.string().min(1).max(200),
  bag_name:     z.string().max(200).optional().nullable(),
  origin:       z.string().min(1).max(200),
  roast_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  is_active:    z.boolean().default(true),
  price_paid:   z.number().min(0).max(100_000).optional().nullable(),
  weight_grams: z.number().min(1).max(10_000).optional().nullable(),
  force:        z.boolean().optional().default(false),
});

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
  const raw = await req.json();

  const parsed = BeanInsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const normalizedRoaster = toTitleCase(body.roaster);

  if (!body.force) {
    const dupQuery = [normalizedRoaster, body.bag_name, body.origin].filter(Boolean).join(' ');
    const { data: dupes } = await db.rpc('search_beans', {
      query: dupQuery,
      threshold: 0.85,
    });
    if (dupes && dupes.length > 0) {
      return NextResponse.json({ conflict: true, match: dupes[0] }, { status: 409 });
    }
  }

  const { data, error } = await db
    .from('beans')
    .insert({
      roaster:      normalizedRoaster,
      bag_name:     body.bag_name     ?? null,
      origin:       body.origin,
      roast_date:   body.roast_date   ?? null,
      is_active:    body.is_active,
      price_paid:   body.price_paid   ?? null,
      weight_grams: body.weight_grams ?? null,
      user_id:      user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
