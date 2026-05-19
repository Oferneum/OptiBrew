import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_CONTACT_EMAIL ?? 'admin@dialed.app'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushRow {
  user_id:      string;
  subscription: webpush.PushSubscription;
}

export async function GET(req: Request) {
  // Vercel sets CRON_SECRET automatically; reject any call that doesn't present it.
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();

  // Find users who have logged a shot in the last 48 hours — exclude them.
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: activeRows } = await db
    .from('shots')
    .select('user_id')
    .gt('created_at', cutoff);

  const activeUserIds = [...new Set((activeRows ?? []).map((r) => r.user_id as string))];

  // All subscribers who are NOT in the active set
  let query = db.from('push_subscriptions').select('user_id, subscription');
  if (activeUserIds.length > 0) {
    query = query.not('user_id', 'in', `(${activeUserIds.join(',')})`);
  }
  const { data: rows, error } = await query;

  if (error) {
    console.error('[cron/inactive-reminder] query failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const targets = (rows ?? []) as PushRow[];
  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No inactive users with subscriptions' });
  }

  const payload = JSON.stringify({
    title: '☕ Your beans are waiting',
    body:  "Your espresso machine misses you! Don't break your streak — log your morning shot.",
    url:   '/shots/new',
  });

  const results = await Promise.allSettled(
    targets.map(({ subscription }) =>
      webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 12 }),
    ),
  );

  // Remove subscriptions that are definitively expired (410 Gone)
  const expired = targets.filter((_, i) => {
    const r = results[i];
    return r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410;
  });

  if (expired.length > 0) {
    await db
      .from('push_subscriptions')
      .delete()
      .in('user_id', expired.map((r) => r.user_id));
  }

  const sent   = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`[cron/inactive-reminder] sent=${sent} failed=${failed} expired_cleaned=${expired.length}`);
  return NextResponse.json({ sent, failed, expired_cleaned: expired.length });
}
