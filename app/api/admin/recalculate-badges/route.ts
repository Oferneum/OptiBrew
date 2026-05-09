import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';
import { checkNewBadges, updateStreak, BADGE_DEFS } from '@/lib/achievements';

export async function GET(req: Request) {
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [awarded, streakResult] = await Promise.all([
    checkNewBadges(user.id, db),
    updateStreak(user.id, db),
  ]);

  // Return full badge status so caller can confirm what is now held
  const { data: held } = await db
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', user.id);

  return NextResponse.json({
    awarded,
    streak: { current: streakResult.current, longest: streakResult.longest },
    heldBadges: (held ?? []).map((b: { badge_id: string; unlocked_at: string }) => ({
      id:   b.badge_id,
      name: BADGE_DEFS.find((d) => d.id === b.badge_id)?.name ?? b.badge_id,
      unlocked_at: b.unlocked_at,
    })),
  });
}
