'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { EquipmentProfile } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

const FIELD_CLS =
  'bg-[#FAF3E6] rounded-2xl px-4 py-3 text-[#2C1E16] text-base placeholder:text-[#2C1E16]/30 ' +
  'border border-[#C8B49A] w-full focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] transition-all appearance-none outline-none';
const LABEL_CLS = 'text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858]';

const BREW_METHODS = ['Espresso', 'V60', 'MokaPot', 'FrenchPress', 'Aeropress'] as const;

export default function SettingsPage() {
  const [profiles, setProfiles]   = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName]   = useState<string | null>(null);

  const [showAdd, setShowAdd]         = useState(false);
  const [machineName, setMachineName] = useState('');
  const [grinderName, setGrinderName] = useState('');
  const [saving, setSaving]           = useState(false);
  const [addError, setAddError]       = useState<string | null>(null);

  const [brewMethodPref, setBrewMethodPref] = useState('Espresso');

  useEffect(() => {
    setActiveId(localStorage.getItem('activeEquipmentId'));
    setBrewMethodPref(localStorage.getItem('defaultBrewMethod') ?? 'Espresso');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      const meta = session?.user?.user_metadata as Record<string, string> | undefined;
      setUserName(meta?.full_name ?? meta?.name ?? null);
    });
    loadProfiles().then(() => setMounted(true));
  }, []);

  async function loadProfiles() {
    const res = await fetch('/api/equipment', { headers: await authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    }
  }

  function activate(id: string) {
    localStorage.setItem('activeEquipmentId', id);
    setActiveId(id);
  }

  function saveBrewMethod(val: string) {
    setBrewMethodPref(val);
    localStorage.setItem('defaultBrewMethod', val);
  }

  async function handleAdd(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!machineName.trim()) return;
    setSaving(true);
    setAddError(null);
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          machine_name: machineName.trim(),
          grinder_name: grinderName.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.match) {
        activate(data.match.id);
        await loadProfiles();
      } else if (res.ok) {
        activate(data.id);
        await loadProfiles();
      } else {
        setAddError(data.error ?? 'Failed to save equipment');
        return;
      }
      setMachineName('');
      setGrinderName('');
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (!mounted) return null;

  const active = profiles.find((p) => p.id === activeId);

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className={`${LABEL_CLS} mb-1`}>Configuration</p>
        <h1 className="text-[#2C1E16] font-black text-3xl tracking-tight leading-none">Settings</h1>
      </div>

      {/* ── Account card ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <p className={LABEL_CLS}>Account</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5D4037] flex items-center justify-center shrink-0">
            <span className="text-[#FFFBF4] font-black text-sm">
              {(userName ?? userEmail ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName && <p className="text-[#2C1E16] font-semibold text-sm truncate">{userName}</p>}
            {userEmail && <p className="text-[#7A6858] text-xs truncate">{userEmail}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 text-[#5D4037] text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-[#5D4037]/10 transition-colors touch-manipulation"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Active rig ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          <p className={LABEL_CLS}>Active Rig</p>
        </div>
        {active ? (
          <div className="space-y-2">
            <div>
              <p className={`${LABEL_CLS} mb-0.5`}>Machine</p>
              <p className="text-[#2C1E16] font-semibold">{active.machine_name}</p>
            </div>
            {active.grinder_name && (
              <div>
                <p className={`${LABEL_CLS} mb-0.5`}>Grinder</p>
                <p className="text-[#2C1E16] font-semibold">{active.grinder_name}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[#7A6858] text-sm">No active rig — select one below or add yours.</p>
        )}
      </div>

      {/* ── Equipment list ── */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className={LABEL_CLS}>All Equipment</p>
          {profiles.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => activate(p.id)}
                className={`w-full text-left glass rounded-3xl px-5 py-4 flex items-center justify-between transition-all duration-150 active:scale-[0.98] ${
                  isActive ? 'ring-2 ring-[#5D4037]' : ''
                }`}
              >
                <div>
                  <p className="text-[#2C1E16] font-semibold text-sm">{p.machine_name}</p>
                  {p.grinder_name && (
                    <p className="text-[#7A6858] text-xs mt-0.5">{p.grinder_name}</p>
                  )}
                </div>
                {isActive ? (
                  <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 bg-[#5D4037]/12 text-[#5D4037] rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[#7A6858] text-xs">Tap to activate</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Add equipment ── */}
      <div className="space-y-3">
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full glass rounded-3xl px-4 py-4 text-[#7A6858] text-sm font-medium hover:text-[#2C1E16] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-lg leading-none text-[#5D4037]">+</span>
            Add Equipment
          </button>
        ) : (
          <form onSubmit={handleAdd} className="glass rounded-3xl p-5 space-y-4">
            <p className="text-[#2C1E16] font-semibold text-sm">New Equipment</p>
            <div>
              <p className={`${LABEL_CLS} mb-1.5`}>
                Machine Name <span className="text-[#5D4037] opacity-60 normal-case tracking-normal">*</span>
              </p>
              <input
                type="text"
                required
                placeholder="e.g. Lelit Bianca, Breville Barista Express"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <p className={`${LABEL_CLS} mb-1.5`}>
                Grinder Name <span className="text-[#7A6858] normal-case tracking-normal font-normal">optional</span>
              </p>
              <input
                type="text"
                placeholder="e.g. Niche Zero, DF64"
                value={grinderName}
                onChange={(e) => setGrinderName(e.target.value)}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
            {addError && <p className="text-red-600 text-sm">{addError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddError(null); }}
                className="flex-1 bg-[#F5EBD8] border border-[#C8B49A] text-[#2C1E16] font-medium py-3 rounded-2xl transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#5D4037] text-[#FFFBF4] font-black py-3 rounded-2xl disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {saving ? 'Saving…' : 'Save & Activate'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Preferences ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-4">
        <p className={LABEL_CLS}>Preferences</p>

        <div>
          <p className={`${LABEL_CLS} mb-1.5`}>Default Brew Method</p>
          <div className="relative">
            <select
              value={brewMethodPref}
              onChange={(e) => saveBrewMethod(e.target.value)}
              className={FIELD_CLS}
              style={{ fontSize: '16px' }}
            >
              {BREW_METHODS.map((m) => (
                <option key={m} value={m} style={{ background: '#EDE4D3', color: '#2C1E16' }}>{m}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7A6858] text-lg">▾</span>
          </div>
        </div>

        <div className="flex items-center justify-between opacity-40 pt-1">
          <p className="text-[#2C1E16] text-sm font-medium">Push Notifications</p>
          <p className="text-[#7A6858] text-xs readout">Coming soon</p>
        </div>
      </div>

      {/* ── Feedback ── */}
      <div className="glass rounded-3xl px-5 py-4">
        <p className={`${LABEL_CLS} mb-3`}>Support</p>
        <a
          href="mailto:ofer.neumann123@gmail.com?subject=Dialed%20Feedback"
          className="flex items-center justify-between w-full active:scale-[0.98] transition-all"
        >
          <div>
            <p className="text-[#2C1E16] text-sm font-semibold">Leave Feedback</p>
            <p className="text-[#7A6858] text-xs mt-0.5">Tell us what you think or report an issue</p>
          </div>
          <span className="text-[#5D4037] font-bold text-lg ml-3">→</span>
        </a>
      </div>

      <p className="text-[10px] text-[#7A6858]/50 text-center pb-4">Dialed · v0.1</p>
    </div>
  );
}
