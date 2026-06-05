'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
import NotificationRegister from '@/components/NotificationRegister';
import type { EquipmentProfile } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

const FIELD_CLS =
  'bg-[#FAF3E6] rounded-2xl px-4 py-3 text-[#2C1E16] text-base placeholder:text-[#2C1E16]/30 ' +
  'border border-[#C8B49A] w-full focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] transition-all appearance-none outline-none';
const LABEL_CLS = 'text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858]';
const BREW_METHODS = ['Espresso', 'ColdBrew', 'MokaPot', 'FrenchPress'] as const;

const BASKET_OPTIONS = ['IMS Precision', 'VST Precision', 'Pullman 876', 'Pesado HE', 'Weber Unibasket', 'Wafo'];

function BasketInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const filtered = BASKET_OPTIONS.filter((b) =>
    !value.trim() || b.toLowerCase().includes(value.toLowerCase()),
  );
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search or type basket name…"
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className={FIELD_CLS}
        style={{ fontSize: '16px' }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-[#FAF3E6] border border-[#C8B49A] rounded-xl shadow-lg overflow-hidden">
          {filtered.map((b) => (
            <button key={b} type="button"
              onMouseDown={() => { onChange(b); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-[#2C1E16] text-sm font-medium hover:bg-[#F5EBD8] border-b border-[#C8B49A]/40 last:border-0 transition-colors touch-manipulation"
            >{b}</button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function EquipmentSearchInput({
  label, value, onChange, suggestions, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suggestions: string[]; placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const filtered = value.trim().length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : [];

  return (
    <div className="relative">
      <p className={`${LABEL_CLS} mb-1.5`}>{label}</p>
      <input
        type="text" placeholder={placeholder} value={value} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className={FIELD_CLS} style={{ fontSize: '16px' }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-[#FAF3E6] border border-[#C8B49A] rounded-xl shadow-lg overflow-hidden">
          {filtered.slice(0, 5).map((s) => (
            <button key={s} type="button"
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-[#2C1E16] text-sm font-medium hover:bg-[#F5EBD8] border-b border-[#C8B49A]/40 last:border-0 transition-colors touch-manipulation"
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profiles, setProfiles]           = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [activeMachine, setActiveMachine] = useState('');
  const [activeGrinder, setActiveGrinder] = useState('');
  // Tracks what was last explicitly persisted so rigDirty doesn't depend on
  // the async DB profiles load (which caused the false UNSAVED badge on reload).
  const [savedMachine, setSavedMachine]   = useState('');
  const [savedGrinder, setSavedGrinder]   = useState('');
  const [rigSaving, setRigSaving]         = useState(false);
  const [rigSaved, setRigSaved]           = useState(false);
  const [mounted, setMounted]             = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName]   = useState<string | null>(null);
  const [brewMethodPref, setBrewMethodPref] = useState('Espresso');

  // Basket state
  const [activeBasket, setActiveBasket]     = useState('');
  const [basketExpanded, setBasketExpanded] = useState(false);
  const [basketSaving, setBasketSaving]     = useState(false);
  const [basketSaved, setBasketSaved]       = useState(false);

  // Recalculate state
  const [recalcRunning, setRecalcRunning] = useState(false);
  const [recalcMsg, setRecalcMsg]         = useState<{ ok: boolean; text: string } | null>(null);

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
    // Mirror the persisted values so rigDirty starts as false on reload.
    setSavedMachine(machine);
    setSavedGrinder(grinder);
    setBrewMethodPref(localStorage.getItem('defaultBrewMethod') ?? 'Espresso');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      const meta = session?.user?.user_metadata as Record<string, string> | undefined;
      setUserName(meta?.full_name ?? meta?.name ?? null);
    });
    loadProfiles().then(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!activeId || profiles.length === 0) return;
    const p = profiles.find((q) => q.id === activeId);
    if (!p) return;
    if (!activeMachine) {
      setActiveMachine(p.machine_name);
      setActiveGrinder(p.grinder_name ?? '');
      localStorage.setItem('activeMachineName', p.machine_name);
      localStorage.setItem('activeGrinderName', p.grinder_name ?? '');
    }
    setActiveBasket(p.basket_name ?? '');
    if (p.basket_name) setBasketExpanded(true);
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

  const rigDirty =
    Boolean(activeMachine) &&
    (activeMachine !== savedMachine || activeGrinder !== savedGrinder);

  function persistRig(profileId: string) {
    localStorage.setItem('activeEquipmentId', profileId);
    localStorage.setItem('activeMachineName', activeMachine);
    localStorage.setItem('activeGrinderName', activeGrinder);
    setActiveId(profileId);
    setSavedMachine(activeMachine);
    setSavedGrinder(activeGrinder);
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

  async function handleSaveBasket() {
    if (!activeId || !activeBasket.trim()) return;
    setBasketSaving(true);
    const res = await fetch(`/api/equipment/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ basket_name: activeBasket.trim() }),
    });
    if (res.ok) {
      setBasketSaved(true);
      await loadProfiles();
      setTimeout(() => setBasketSaved(false), 2000);
    }
    setBasketSaving(false);
  }

  async function handleRemoveBasket() {
    if (!activeId) return;
    setBasketSaving(true);
    const res = await fetch(`/api/equipment/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ basket_name: null }),
    });
    if (res.ok) {
      setActiveBasket('');
      setBasketExpanded(false);
      await loadProfiles();
    }
    setBasketSaving(false);
  }

  async function handleRecalculate() {
    setRecalcRunning(true);
    setRecalcMsg(null);
    try {
      const res  = await fetch('/api/admin/recalculate-badges', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setRecalcMsg({ ok: false, text: data.error ?? 'Recalculation failed' });
        return;
      }
      const awarded = (data.awarded as string[]) ?? [];
      const held    = (data.heldBadges as { name: string }[]) ?? [];
      setRecalcMsg({
        ok:   true,
        text: awarded.length > 0
          ? `Restored ${awarded.length} badge${awarded.length > 1 ? 's' : ''}! You now hold ${held.length}/6.`
          : `All up to date — ${held.length}/6 badges already on record.`,
      });
    } catch {
      setRecalcMsg({ ok: false, text: 'Network error — please try again.' });
    } finally {
      setRecalcRunning(false);
    }
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

      {/* ── Notifications ── */}
      <NotificationRegister />

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

            {/* ── Basket (optional, collapsed) ── */}
            {activeId && !rigDirty && (
              <div className="border-t border-[#C8B49A]/40 pt-3">
                {!basketExpanded && !activeBasket ? (
                  <button type="button" onClick={() => setBasketExpanded(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#7A6858]/60 hover:text-[#5D4037] transition-colors touch-manipulation"
                  >
                    <span className="text-sm leading-none text-[#5D4037]">+</span>
                    Add specialized basket
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className={`${LABEL_CLS}`}>Basket (Optional)</p>
                      {activeBasket && (
                        <button type="button" onClick={handleRemoveBasket}
                          className="text-[10px] text-[#7A6858]/50 hover:text-red-600 transition-colors touch-manipulation"
                        >Remove</button>
                      )}
                    </div>
                    <BasketInput value={activeBasket} onChange={(v) => { setActiveBasket(v); setBasketSaved(false); }} />
                    <button type="button" onClick={handleSaveBasket}
                      disabled={basketSaving || !activeBasket.trim()}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 touch-manipulation ${
                        basketSaved
                          ? 'bg-green-500/15 text-green-700 border border-green-500/25'
                          : 'bg-[#F5EBD8] border border-[#C8B49A] text-[#7A6858] active:scale-[0.97]'
                      }`}
                    >
                      {basketSaving ? 'Saving…' : basketSaved ? '✓ Basket Saved' : 'Save Basket'}
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {/* ── Developer Tools ── */}
      <div className="glass rounded-3xl px-5 py-4 space-y-3">
        <p className={LABEL_CLS}>Developer Tools</p>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#2C1E16] text-sm font-semibold">Recalculate Badges &amp; Streaks</p>
            <p className="text-[#7A6858] text-xs mt-0.5">Re-evaluates your full shot history and restores any missing badges.</p>
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalcRunning}
            className="shrink-0 text-[#5D4037] text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-[#5D4037]/30 hover:bg-[#5D4037]/10 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {recalcRunning ? 'Running…' : 'Run'}
          </button>
        </div>
        {recalcMsg && (
          <p className={`text-xs font-medium px-3 py-2 rounded-xl ${
            recalcMsg.ok
              ? 'bg-green-500/10 text-green-700'
              : 'bg-red-500/10 text-red-600'
          }`}>
            {recalcMsg.text}
          </p>
        )}
      </div>

      <p className="text-[10px] text-[#7A6858]/50 text-center pb-4">Dialed · v0.1</p>
    </div>
  );
}
