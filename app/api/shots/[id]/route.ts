import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';

// Fields a user is permitted to update on their own shot.
// Excludes identity columns (id, user_id, created_at), sensor captures
// (ambient_temp, humidity), AI output (recommendation), and relational
// references that must not change post-creation (bean_id, equipment_id,
// brew_method, has_milk).
const SHOT_UPDATE_ALLOWLIST = new Set([
  'dose',
  'yield',
  'extraction_time',
  'steep_time_hours',
  'brew_temp',
  'grind_setting',
  'overall_score',
  'flavor_tags',
  'notes',
]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getRequestClient(req);
  const { data, error } = await db.from('shots').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getRequestClient(req);

  // C1-fix: require authentication before any mutation
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // C1-fix: strip every field not in the allowlist (prevents mass assignment
  // and stops a user re-assigning user_id to another account)
  const update = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([k]) => SHOT_UPDATE_ALLOWLIST.has(k)),
  );

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // RLS shots_update_owner enforces ownership; the explicit .eq('user_id', user.id)
  // adds a defence-in-depth guard at the application layer.
  const { data, error } = await db
    .from('shots')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getRequestClient(req);

  // C2-fix: require authentication; do not rely solely on RLS
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Explicit .eq('user_id', user.id) is a second layer of ownership enforcement
  // on top of the RLS shots_delete_owner policy.
  const { error } = await db
    .from('shots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
