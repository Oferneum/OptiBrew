'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4H17l-1 8a5 5 0 0 1-8 0Z" />
      <path d="M5 4H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h.5" />
      <path d="M19 4h1a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const MENU = [
  { href: '/shots',        label: 'Shot History',   description: 'Browse and review your past shots', Icon: ClockIcon  },
  { href: '/chat',         label: 'Ask Bean',        description: 'Get a personalised AI recommendation', Icon: ChatIcon   },
  { href: '/achievements', label: 'Achievements',    description: 'Streaks, badges, and milestones',   Icon: TrophyIcon },
  { href: '/settings',     label: 'Settings',        description: 'Equipment, account, and preferences', Icon: GearIcon   },
];

export default function ProfilePage() {
  const [name, setName]   = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta  = session.user.user_metadata as Record<string, string>;
      const full  = meta.full_name ?? meta.name ?? '';
      setName(full.split(' ')[0] || null);
      setEmail(session.user.email ?? null);
    });
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-28 space-y-6">

      {/* ── Header ── */}
      <header className="pt-4 space-y-1">
        <div className="w-8 h-0.5 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] rounded-full mb-3" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A6858]">Account</p>
        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-[#2C1E16]">
          Profile
        </h1>
      </header>

      {/* ── User card ── */}
      {(name || email) && (
        <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#5D4037] flex items-center justify-center shrink-0">
            <span className="text-[#FFFBF4] font-black text-base uppercase">
              {name?.[0] ?? email?.[0] ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            {name  && <p className="text-[#2C1E16] font-black text-base leading-tight truncate">{name}</p>}
            {email && <p className="text-[#7A6858] text-xs truncate mt-0.5">{email}</p>}
          </div>
        </div>
      )}

      {/* ── Menu items ── */}
      <div className="space-y-2">
        {MENU.map(({ href, label, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 glass rounded-2xl px-5 py-4 active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F5EBD8] border border-[#C8B49A] flex items-center justify-center shrink-0 text-[#5D4037]">
              <Icon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#2C1E16] font-black text-sm leading-none">{label}</p>
              <p className="text-[#7A6858] text-xs mt-1 leading-snug">{description}</p>
            </div>
            <span className="text-[#5D4037] font-bold text-base leading-none shrink-0">→</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
