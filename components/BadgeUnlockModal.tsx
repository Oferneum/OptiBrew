'use client';

import { useState, useEffect } from 'react';
import { BADGE_DEFS } from '@/lib/achievements';
import { BADGE_SVGS } from '@/components/BadgeSVGs';
import type { StreakResult } from '@/lib/achievements';

interface ModalItem {
  type: 'badge' | 'streak';
  badgeId?: string;
  streakDays?: number;
}

function buildItems(badgeIds: string[], streakResult: StreakResult | null): ModalItem[] {
  const items: ModalItem[] = badgeIds.map((id) => ({ type: 'badge', badgeId: id }));
  const milestone = streakResult?.isNew30 ? 30 : streakResult?.isNew7 ? 7 : streakResult?.isNew3 ? 3 : null;
  if (milestone) items.push({ type: 'streak', streakDays: milestone });
  return items;
}

export default function BadgeUnlockModal({
  badgeIds,
  streakResult,
  onClose,
}: {
  badgeIds: string[];
  streakResult: StreakResult | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  const items = buildItems(badgeIds, streakResult);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!items.length) return null;

  const item    = items[idx];
  const isLast  = idx === items.length - 1;
  const advance = isLast ? onClose : () => setIdx((i) => i + 1);

  const badgeDef = item.type === 'badge'
    ? BADGE_DEFS.find((b) => b.id === item.badgeId)
    : null;
  const BadgeIcon = item.type === 'badge' && item.badgeId
    ? BADGE_SVGS[item.badgeId]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-[#FAF3E6] rounded-3xl p-7 max-w-xs w-full shadow-2xl text-center transition-all duration-300 ease-out ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        {item.type === 'badge' && badgeDef && BadgeIcon ? (
          <>
            {/* Header */}
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5D4037] mb-4">
              Achievement Unlocked
            </p>

            {/* Badge artwork */}
            <div className="w-24 h-24 mx-auto mb-5">
              <BadgeIcon />
            </div>

            {/* Name + description */}
            <p className="text-[#2C1E16] font-black text-xl tracking-tight mb-1">
              {badgeDef.name}
            </p>
            <p className="text-[#7A6858] text-sm font-medium leading-snug mb-2">
              {badgeDef.description}
            </p>
            <p className="text-[#5D4037] text-xs font-bold italic mb-6">
              &ldquo;{badgeDef.flavor}&rdquo;
            </p>

            {/* Dots for multiple badges */}
            {items.length > 1 && (
              <div className="flex justify-center gap-1.5 mb-5">
                {items.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === idx ? 'bg-[#5D4037] w-3' : 'bg-[#C8B49A]'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Streak celebration */}
            <div className="text-6xl mb-3">🔥</div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5D4037] mb-2">
              Streak Milestone
            </p>
            <p className="text-[#2C1E16] font-black text-4xl tracking-tight mb-1">
              {item.streakDays}
            </p>
            <p className="text-[#2C1E16] font-black text-xl mb-2">Day Streak</p>
            <p className="text-[#7A6858] text-sm font-medium mb-6">
              {item.streakDays === 3  && 'Three days in. You\'re building a ritual.'}
              {item.streakDays === 7  && 'One week straight. You\'re a creature of habit.'}
              {item.streakDays === 30 && 'Thirty days. You\'re not just drinking coffee — you\'re studying it.'}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={advance}
          className="w-full bg-[#5D4037] text-[#FFFBF4] font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-[#5D4037]/25 active:scale-[0.97] transition-all"
        >
          {isLast ? 'Continue →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
