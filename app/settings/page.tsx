'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { EquipmentProfile } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

const FIELD_CLS =
  'bg-white/5 rounded-2xl px-4 py-3 text-white text-base placeholder:text-white/25 ' +
  'border border-white/10 w-full focus:outline-none focus:ring-2 focus:ring-[#FF4500] transition-all';
const LABEL_CLS = 'text-[10px] uppercase tracking-[0.15em] font-bold text-[#A1A1AA]';

export default function SettingsPage() {
  const [profiles, setProfiles]   = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName]   = useState<string | null>(null);

  const [showAdd, setShowAdd]       = useState(false);
  const [machineName, setMachineName] = useState('');
  const [grinderName, setGrinderName] = useState('');
  const [saving, setSaving]         = useState(false);
  const [addError, setAddError]     = useState<string | null>(null);

  useEffect(() => {
    setActiveId(localStorage.getItem('activeEquipmentId'));
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
        <h1 className="text-white font-black text-3xl tracking-tight leading-none">Settings</h1>
      </div>

      {/* ── Account card ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <p className={LABEL_CLS}>Account</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FFC107] flex items-center justify-center shrink-0">
            <span className="text-black font-black text-sm">
              {(userName ?? userEmail ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName && <p className="text-white font-semibold text-sm truncate">{userName}</p>}
            {userEmail && <p className="text-[#A1A1AA] text-xs truncate">{userEmail}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 text-[#FF4500] text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-[#FF4500]/10 transition-colors touch-manipulation"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Active rig ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          {active && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
          <p className={LABEL_CLS}>Active Rig</p>
        </div>
        {active ? (
          <div className="space-y-2">
            <div>
              <p className={`${LABEL_CLS} mb-0.5`}>Machine</p>
              <p className="text-white font-semibold">{active.machine_name}</p>
            </div>
            {active.grinder_name && (
              <div>
                <p className={`${LABEL_CLS} mb-0.5`}>Grinder</p>
                <p className="text-white font-semibold">{active.grinder_name}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[#A1A1AA] text-sm">No active rig — select one below or add yours.</p>
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
                  isActive ? 'ring-2 ring-[#FF4500]' : ''
                }`}
              >
                <div>
                  <p className="text-white font-semibold text-sm">{p.machine_name}</p>
                  {p.grinder_name && (
                    <p className="text-[#A1A1AA] text-xs mt-0.5">{p.grinder_name}</p>
                  )}
                </div>
                {isActive ? (
                  <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 bg-[#FF4500]/15 text-[#FF4500] rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[#A1A1AA] text-xs">Tap to activate</span>
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
            className="w-full glass rounded-3xl px-4 py-4 text-[#A1A1AA] text-sm font-medium hover:text-white transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="text-lg leading-none text-[#FF4500]">+</span>
            Add Equipment
          </button>
        ) : (
          <form onSubmit={handleAdd} className="glass rounded-3xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm">New Equipment</p>
            <div>
              <p className={`${LABEL_CLS} mb-1.5`}>
                Machine Name <span className="text-[#FF4500] opacity-60 normal-case tracking-normal">*</span>
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
                Grinder Name <span className="text-[#A1A1AA] normal-case tracking-normal font-normal">optional</span>
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
            {addError && <p className="text-[#FF4500] text-sm">{addError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddError(null); }}
                className="flex-1 bg-white/5 text-white font-medium py-3 rounded-2xl transition-all active:scale-[0.97] border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black font-black py-3 rounded-2xl disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {saving ? 'Saving…' : 'Save & Activate'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Preferences (placeholders) ── */}
      <div className="space-y-2">
        <p className={LABEL_CLS}>Preferences</p>
        {[
          { label: 'Default Brew Method', value: 'Espresso' },
          { label: 'Dose Units',          value: 'Grams (g)' },
          { label: 'Push Notifications',  value: 'Coming soon' },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-3xl px-5 py-4 flex items-center justify-between opacity-50">
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-[#A1A1AA] text-xs readout">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#A1A1AA]/50 text-center pb-4">Dialed · v0.1</p>
    </div>
  );
}
