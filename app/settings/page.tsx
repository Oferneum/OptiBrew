'use client';

import { useState, useEffect, useMemo } from 'react';
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

// ── Spinner ───────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Smart Equipment Search Input ──────────────────────────────

interface LookupResult {
  name: string; manufacturer: string; type: string; description: string;
}

function EquipmentSearchInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder: string;
}) {
  const [open, setOpen]           = useState(false);
  const [searching, setSearching] = useState(false);
  const [webResult, setWebResult] = useState<LookupResult | null>(null);
  const [webErr, setWebErr]       = useState<string | null>(null);

  const filtered = value.trim().length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions.slice(0, 6);

  const noLocalMatch = value.trim().length >= 2 && filtered.length === 0;

  async function searchWeb() {
    setSearching(true); setWebResult(null); setWebErr(null);
    try {
      const res  = await fetch(`/api/equipment/lookup?q=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (!res.ok) { setWebErr(data.error ?? 'Search failed'); return; }
      setWebResult(data);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="relative">
      <p className={`${LABEL_CLS} mb-1.5`}>{label}</p>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setWebResult(null); setWebErr(null); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className={FIELD_CLS}
        style={{ fontSize: '16px' }}
      />

      {/* Local suggestions */}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-[#FAF3E6] border border-[#C8B49A] rounded-xl shadow-lg overflow-hidden">
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => { onChange(s); setOpen(false); setWebResult(null); }}
              className="w-full text-left px-4 py-3 text-[#2C1E16] text-sm font-medium hover:bg-[#F5EBD8] border-b border-[#C8B49A]/40 last:border-0 transition-colors touch-manipulation"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Search Web button */}
      {noLocalMatch && !webResult && !searching && (
        <button
          type="button"
          onClick={searchWeb}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#5D4037]/50 text-[#5D4037] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#5D4037]/5 active:scale-[0.97] transition-all touch-manipulation"
        >
          🔍 Search Web for &ldquo;{value.trim()}&rdquo;
        </button>
      )}

      {searching && (
        <div className="mt-2 flex items-center gap-2 text-[#7A6858] text-xs px-1 py-1.5">
          <Spinner /><span>Searching…</span>
        </div>
      )}

      {/* Web result card */}
      {webResult && !searching && (
        <div className="mt-2 bg-[#F5EBD8] border border-[#C8B49A] rounded-xl p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[#2C1E16] font-bold text-sm leading-tight">{webResult.name}</p>
              <p className="text-[#7A6858] text-xs mt-0.5">{webResult.manufacturer}</p>
              {webResult.description && webResult.description !== 'No details found.' && (
                <p className="text-[#7A6858] text-xs mt-1 italic leading-relaxed">{webResult.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { onChange(webResult.name); setWebResult(null); }}
              className="shrink-0 px-3 py-1.5 bg-[#5D4037] text-[#FFFBF4] text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all touch-manipulation"
            >
              Use
            </button>
          </div>
        </div>
      )}

      {webErr && <p className="mt-1.5 text-red-600 text-xs font-medium">{webErr}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profiles, setProfiles]     = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [activeMachine, setActiveMachine] = useState('');
  const [activeGrinder, setActiveGrinder] = useState('');
  const [rigSaving, setRigSaving]   = useState(false);
  const [rigSaved, setRigSaved]     = useState(false);
  const [mounted, setMounted]       = useState(false);

  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [userName, setUserName]     = useState<string | null>(null);
  const [brewMethodPref, setBrewMethodPref] = useState('Espresso');

  useEffect(() => {
    const id      = localStorage.getItem('activeEquipmentId');
    const machine = localStorage.getItem('activeMachineName') ?? '';
    const grinder = localStorage.getItem('activeGrinderName') ?? '';
    setActiveId(id);
    setActiveMachine(machine);
    setActiveGrinder(grinder);
    setBrewMethodPref(localStorage.getItem('defaultBrewMethod') ?? 'Espresso');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      const meta = session?.user?.user_metadata as Record<string, string> | undefined;
      setUserName(meta?.full_name ?? meta?.name ?? null);
    });

    loadProfiles().then(() => setMounted(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive machine/grinder names from active profile if localStorage is empty
  useEffect(() => {
    if (!activeMachine && activeId && profiles.length > 0) {
      const p = profiles.find((q) => q.id === activeId);
      if (p) {
        const m = p.machine_name;
        const g = p.grinder_name ?? '';
        setActiveMachine(m);
        setActiveGrinder(g);
        localStorage.setItem('activeMachineName', m);
        localStorage.setItem('activeGrinderName', g);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, activeId]);

  async function loadProfiles() {
    const res = await fetch('/api/equipment', { headers: await authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    }
  }

  const machines = useMemo(
    () => [...new Set(profiles.map((p) => p.machine_name))].sort(),
    [profiles],
  );
  const grinders = useMemo(
    () => [...new Set(profiles.map((p) => p.grinder_name).filter((g): g is string => Boolean(g)))].sort(),
    [profiles],
  );

  const savedProfile = profiles.find((p) => p.id === activeId);
  const rigDirty =
    Boolean(activeMachine) &&
    (activeMachine !== (savedProfile?.machine_name ?? '') ||
      activeGrinder !== (savedProfile?.grinder_name ?? ''));

  function persistRig(profileId: string) {
    localStorage.setItem('activeEquipmentId', profileId);
    localStorage.setItem('activeMachineName', activeMachine);
    localStorage.setItem('activeGrinderName', activeGrinder);
    setActiveId(profileId);
  }

  async function handleSetRig() {
    if (!activeMachine) return;
    setRigSaving(true);
    setRigSaved(false);

    const match = profiles.find(
      (p) => p.machine_name === activeMachine &&
        (activeGrinder ? p.grinder_name === activeGrinder : !p.grinder_name),
    );

    if (match) {
      persistRig(match.id);
    } else {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ machine_name: activeMachine, grinder_name: activeGrinder || null }),
      });
      const data = await res.json();
      if (res.ok || res.status === 409) {
        const profile = res.status === 409 ? data.match : data;
        await loadProfiles();
        persistRig(profile.id);
      }
    }

    setRigSaving(false);
    setRigSaved(true);
    setTimeout(() => setRigSaved(false), 2000);
  }

  function saveBrewMethod(val: string) {
    setBrewMethodPref(val);
    localStorage.setItem('defaultBrewMethod', val);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (!mounted) return null;

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className={`${LABEL_CLS} mb-1`}>Configuration</p>
        <h1 className="text-[#2C1E16] font-black text-3xl tracking-tight leading-none">Settings</h1>
      </div>

      {/* ── Account ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <p className={LABEL_CLS}>Account</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5D4037] flex items-center justify-center shrink-0">
            <span className="text-[#FFFBF4] font-black text-sm">
              {(userName ?? userEmail ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName  && <p className="text-[#2C1E16] font-semibold text-sm truncate">{userName}</p>}
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

      {/* ── Active Rig — smart search ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className={LABEL_CLS}>Active Rig</p>
          {activeId && !rigDirty && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-green-500/15 text-green-700 rounded-full">Active</span>
          )}
          {rigDirty && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-amber-500/15 text-amber-700 rounded-full">Unsaved</span>
          )}
        </div>

        <p className="text-[#7A6858] text-xs leading-relaxed -mt-2">
          Type to search your saved rigs, or enter a new name. Can&apos;t find it?{' '}
          <span className="text-[#5D4037] font-semibold">Search Web</span> to look it up.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <EquipmentSearchInput
            label="Machine"
            value={activeMachine}
            onChange={(v) => { setActiveMachine(v); setRigSaved(false); }}
            suggestions={machines}
            placeholder="Lelit Bianca"
          />
          <EquipmentSearchInput
            label="Grinder"
            value={activeGrinder}
            onChange={(v) => { setActiveGrinder(v); setRigSaved(false); }}
            suggestions={grinders}
            placeholder="Niche Zero"
          />
        </div>

        <button
          type="button"
          onClick={handleSetRig}
          disabled={!activeMachine || rigSaving}
          className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.97] disabled:opacity-50 touch-manipulation ${
            rigSaved
              ? 'bg-green-500/15 text-green-700 border border-green-500/25'
              : rigDirty
                ? 'bg-[#5D4037] text-[#FFFBF4] shadow-lg shadow-[#5D4037]/25'
                : 'bg-[#F5EBD8] border border-[#C8B49A] text-[#7A6858]'
          }`}
        >
          {rigSaving ? 'Saving…' : rigSaved ? '✓ Rig Active' : rigDirty ? 'Set Active Rig' : 'Rig Saved'}
        </button>
      </div>

      {/* ── Saved Rigs (compact reference list) ── */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className={LABEL_CLS}>Saved Rigs</p>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActiveMachine(p.machine_name);
                setActiveGrinder(p.grinder_name ?? '');
                setRigSaved(false);
              }}
              className={`w-full glass rounded-2xl px-4 py-3 flex items-center justify-between text-left transition-all active:scale-[0.98] touch-manipulation ${p.id === activeId ? 'ring-1 ring-[#5D4037]/50' : ''}`}
            >
              <div className="min-w-0">
                <p className="text-[#2C1E16] font-semibold text-sm">{p.machine_name}</p>
                {p.grinder_name && <p className="text-[#7A6858] text-xs mt-0.5">{p.grinder_name}</p>}
              </div>
              {p.id === activeId
                ? <span className="text-[10px] text-[#5D4037] font-black uppercase tracking-widest shrink-0 ml-3">✓ Active</span>
                : <span className="text-[10px] text-[#7A6858] uppercase tracking-widest shrink-0 ml-3">Select →</span>
              }
            </button>
          ))}
        </div>
      )}

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

      {/* ── Support ── */}
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
