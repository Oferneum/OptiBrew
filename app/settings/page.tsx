'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
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

// ── Spinner ─────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Smart search input (for Register New Equipment only) ──────

interface LookupResult { name: string; manufacturer: string; type: string; description: string; }

function EquipmentSearchInput({
  label, value, onChange, suggestions, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suggestions: string[]; placeholder: string;
}) {
  const [open, setOpen]           = useState(false);
  const [searching, setSearching] = useState(false);
  const [webResult, setWebResult] = useState<LookupResult | null>(null);
  const [webErr, setWebErr]       = useState<string | null>(null);

  const filtered = value.trim().length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : [];
  const noLocalMatch = value.trim().length >= 2 && filtered.length === 0;

  async function searchWeb() {
    setSearching(true); setWebResult(null); setWebErr(null);
    try {
      const res  = await fetch(`/api/equipment/lookup?q=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      if (!res.ok) { setWebErr(data.error ?? 'Search failed'); return; }
      setWebResult(data);
    } finally { setSearching(false); }
  }

  return (
    <div className="relative">
      <p className={`${LABEL_CLS} mb-1.5`}>{label}</p>
      <input
        type="text" placeholder={placeholder} value={value} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setWebResult(null); setWebErr(null); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className={FIELD_CLS} style={{ fontSize: '16px' }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-[#FAF3E6] border border-[#C8B49A] rounded-xl shadow-lg overflow-hidden">
          {filtered.slice(0, 5).map((s) => (
            <button key={s} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); setWebResult(null); }}
              className="w-full text-left px-4 py-3 text-[#2C1E16] text-sm font-medium hover:bg-[#F5EBD8] border-b border-[#C8B49A]/40 last:border-0 transition-colors touch-manipulation"
            >{s}</button>
          ))}
        </div>
      )}
      {noLocalMatch && !webResult && !searching && (
        <button type="button" onClick={searchWeb}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#5D4037]/50 text-[#5D4037] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#5D4037]/5 active:scale-[0.97] transition-all touch-manipulation"
        >🔍 Search Web for &ldquo;{value.trim()}&rdquo;</button>
      )}
      {searching && (
        <div className="mt-2 flex items-center gap-2 text-[#7A6858] text-xs px-1 py-1.5">
          <Spinner /><span>Searching…</span>
        </div>
      )}
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
            <button type="button"
              onClick={() => { onChange(webResult.name); setWebResult(null); }}
              className="shrink-0 px-3 py-1.5 bg-[#5D4037] text-[#FFFBF4] text-xs font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all touch-manipulation"
            >Use</button>
          </div>
        </div>
      )}
      {webErr && <p className="mt-1.5 text-red-600 text-xs font-medium">{webErr}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profiles, setProfiles]           = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [activeMachine, setActiveMachine] = useState('');
  const [activeGrinder, setActiveGrinder] = useState('');
  const [rigSaving, setRigSaving]         = useState(false);
  const [rigSaved, setRigSaved]           = useState(false);
  const [mounted, setMounted]             = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName]   = useState<string | null>(null);
  const [brewMethodPref, setBrewMethodPref] = useState('Espresso');

  // Register new equipment form
  const [showAdd, setShowAdd]     = useState(false);
  const [newMachine, setNewMachine] = useState('');
  const [newGrinder, setNewGrinder] = useState('');
  const [adding, setAdding]       = useState(false);
  const [addError, setAddError]   = useState<string | null>(null);

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

  useEffect(() => {
    if (!activeMachine && activeId && profiles.length > 0) {
      const p = profiles.find((q) => q.id === activeId);
      if (p) {
        setActiveMachine(p.machine_name);
        setActiveGrinder(p.grinder_name ?? '');
        localStorage.setItem('activeMachineName', p.machine_name);
        localStorage.setItem('activeGrinderName', p.grinder_name ?? '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, activeId]);

  async function loadProfiles() {
    const res = await fetch('/api/equipment', { headers: await authHeaders() });
    if (res.ok) { const d = await res.json(); setProfiles(Array.isArray(d) ? d : []); }
  }

  const machines = useMemo(() => [...new Set(profiles.map((p) => p.machine_name))].sort(), [profiles]);
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
    setRigSaving(true); setRigSaved(false);
    const match = profiles.find((p) =>
      p.machine_name === activeMachine &&
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
    setRigSaving(false); setRigSaved(true);
    setTimeout(() => setRigSaved(false), 2000);
  }

  async function handleAdd(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newMachine.trim()) return;
    setAdding(true); setAddError(null);
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ machine_name: newMachine.trim(), grinder_name: newGrinder.trim() || null }),
      });
      const data = await res.json();
      if (res.status === 409 && data.match) {
        setActiveMachine(data.match.machine_name);
        setActiveGrinder(data.match.grinder_name ?? '');
        persistRig(data.match.id);
        await loadProfiles();
      } else if (res.ok) {
        setActiveMachine(data.machine_name);
        setActiveGrinder(data.grinder_name ?? '');
        persistRig(data.id);
        await loadProfiles();
      } else { setAddError(data.error ?? 'Failed to save'); return; }
      setNewMachine(''); setNewGrinder(''); setShowAdd(false);
    } finally { setAdding(false); }
  }

  function saveBrewMethod(val: string) {
    setBrewMethodPref(val);
    localStorage.setItem('defaultBrewMethod', val);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (!mounted) return <PageLoader />;

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
          <button type="button" onClick={handleSignOut}
            className="shrink-0 text-[#5D4037] text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-[#5D4037]/10 transition-colors touch-manipulation"
          >Sign Out</button>
        </div>
      </div>

      {/* ── Active Rig — native dropdowns ── */}
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

        {profiles.length === 0 ? (
          <p className="text-[#7A6858] text-sm">No equipment yet — add yours below.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`${LABEL_CLS} mb-1.5`}>Machine</p>
                <div className="relative">
                  <select value={activeMachine}
                    onChange={(e) => { setActiveMachine(e.target.value); setRigSaved(false); }}
                    className={FIELD_CLS} style={{ fontSize: '16px' }}
                  >
                    <option value="">Select…</option>
                    {machines.map((m) => (
                      <option key={m} value={m} style={{ background: '#EDE4D3', color: '#2C1E16' }}>{m}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6858]">▾</span>
                </div>
              </div>
              <div>
                <p className={`${LABEL_CLS} mb-1.5`}>Grinder</p>
                <div className="relative">
                  <select value={activeGrinder}
                    onChange={(e) => { setActiveGrinder(e.target.value); setRigSaved(false); }}
                    className={FIELD_CLS} style={{ fontSize: '16px' }}
                  >
                    <option value="">None</option>
                    {grinders.map((g) => (
                      <option key={g} value={g} style={{ background: '#EDE4D3', color: '#2C1E16' }}>{g}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6858]">▾</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleSetRig}
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
          </>
        )}
      </div>

      {/* ── Register New Equipment — smart search ── */}
      <div className="space-y-3">
        {!showAdd ? (
          <button type="button" onClick={() => setShowAdd(true)}
            className="w-full glass rounded-3xl px-4 py-4 text-[#7A6858] text-sm font-medium hover:text-[#2C1E16] transition-colors flex items-center justify-center gap-2 active:scale-[0.98] touch-manipulation"
          >
            <span className="text-lg leading-none text-[#5D4037]">+</span>
            Register New Equipment
          </button>
        ) : (
          <form onSubmit={handleAdd} className="glass rounded-3xl p-5 space-y-4">
            <p className="text-[#2C1E16] font-black text-sm uppercase tracking-wide">New Equipment</p>
            <p className="text-[#7A6858] text-xs -mt-2">
              Type a name to search your list, or tap{' '}
              <span className="text-[#5D4037] font-semibold">Search Web</span> to look up a machine you don&apos;t have yet.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <EquipmentSearchInput
                label="Machine *" value={newMachine} onChange={setNewMachine}
                suggestions={machines} placeholder="Lelit Bianca"
              />
              <EquipmentSearchInput
                label="Grinder" value={newGrinder} onChange={setNewGrinder}
                suggestions={grinders} placeholder="Niche Zero"
              />
            </div>
            {addError && <p className="text-red-600 text-sm">{addError}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button"
                onClick={() => { setShowAdd(false); setNewMachine(''); setNewGrinder(''); setAddError(null); }}
                className="flex-1 bg-[#F5EBD8] border border-[#C8B49A] text-[#2C1E16] font-medium py-3 rounded-2xl transition-all active:scale-[0.97] touch-manipulation"
              >Cancel</button>
              <button type="submit" disabled={adding || !newMachine.trim()}
                className="flex-1 bg-[#5D4037] text-[#FFFBF4] font-black py-3 rounded-2xl disabled:opacity-60 active:scale-[0.97] transition-all touch-manipulation"
              >{adding ? 'Saving…' : 'Save & Activate'}</button>
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
            <select value={brewMethodPref} onChange={(e) => saveBrewMethod(e.target.value)}
              className={FIELD_CLS} style={{ fontSize: '16px' }}
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
        <a href="mailto:ofer.neumann123@gmail.com?subject=Dialed%20Feedback"
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
