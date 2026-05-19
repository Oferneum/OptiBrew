import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Minimal structural validation — a PushSubscription must have an endpoint
  const sub = body as Record<string, unknown>;
  if (typeof sub?.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
  }

  // Upsert: one row per user, update in place when the browser renews its subscription
  const { error } = await db
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, subscription: sub, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await db
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
