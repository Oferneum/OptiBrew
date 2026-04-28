'use client';

import { useState, useEffect } from 'react';
import type { EquipmentProfile } from '@/lib/types';

const FIELD_CLS =
  'glass-input w-full rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-700';

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [machineName, setMachineName] = useState('');
  const [grinderName, setGrinderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(localStorage.getItem('activeEquipmentId'));
    loadProfiles().then(() => setMounted(true));
  }, []);

  async function loadProfiles() {
    const res = await fetch('/api/equipment');
    if (res.ok) {
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    }
  }

  function activate(id: string) {
    localStorage.setItem('activeEquipmentId', id);
    setActiveId(id);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!machineName.trim()) return;
    setSaving(true);
    setAddError(null);

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_name: machineName.trim(),
          grinder_name: grinderName.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.match) {
        // Duplicate found — use the existing match
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

  if (!mounted) return null;

  const active = profiles.find((p) => p.id === activeId);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-6 pb-1">
        <p className="text-crema/55 text-xs font-semibold tracking-[0.22em] uppercase mb-1">Configuration</p>
        <h1 className="text-stone-50 font-bold text-3xl tracking-tight leading-none">My Rig</h1>
      </div>

      {/* Active setup display */}
      {active ? (
        <div className="glass-display rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-crema/10">
            <span className="status-dot w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
            <p className="text-crema/50 text-xs font-semibold tracking-[0.25em] uppercase">Active Rig</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Machine</p>
              <p className="text-stone-100 font-semibold text-base">{active.machine_name}</p>
            </div>
            {active.grinder_name && (
              <>
                <div className="h-px bg-crema/8" />
                <div>
                  <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Grinder</p>
                  <p className="text-stone-100 font-semibold text-base">{active.grinder_name}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-display rounded-2xl px-5 py-4">
          <p className="text-stone-500 text-sm">No active rig — select one below or add yours.</p>
        </div>
      )}

      {/* Equipment list */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase px-1">All Equipment</p>
          {profiles.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => activate(p.id)}
                className={`w-full text-left glass rounded-2xl px-4 py-4 flex items-center justify-between transition-all duration-150 active:scale-[0.98] ${
                  isActive ? 'border-crema/40 shadow-[0_0_0_1px_rgba(196,135,62,0.25)]' : ''
                }`}
              >
                <div>
                  <p className="text-stone-100 font-semibold text-sm">{p.machine_name}</p>
                  {p.grinder_name && (
                    <p className="text-stone-500 text-xs mt-0.5">{p.grinder_name}</p>
                  )}
                </div>
                {isActive ? (
                  <span className="text-crema text-xs font-semibold tracking-wide">ACTIVE</span>
                ) : (
                  <span className="text-stone-600 text-xs">Tap to activate</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Add equipment */}
      <div className="space-y-3">
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full glass rounded-2xl px-4 py-3.5 text-stone-400 text-sm font-medium hover:text-stone-200 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none text-crema/60">+</span>
            Add Equipment
          </button>
        ) : (
          <form onSubmit={handleAdd} className="glass rounded-2xl p-4 space-y-4">
            <p className="text-stone-300 font-semibold text-sm">New Equipment</p>

            <div>
              <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1.5">
                Machine Name <span className="text-crema/60">*</span>
              </p>
              <input
                type="text"
                required
                placeholder="e.g. Lelit Bianca, Breville Barista Express"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className={FIELD_CLS + ' text-base'}
                autoFocus
              />
            </div>

            <div>
              <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1.5">
                Grinder Name <span className="text-stone-700">optional</span>
              </p>
              <input
                type="text"
                placeholder="e.g. Niche Zero, DF64"
                value={grinderName}
                onChange={(e) => setGrinderName(e.target.value)}
                className={FIELD_CLS + ' text-base'}
              />
            </div>

            {addError && (
              <p className="text-red-400 text-sm">{addError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddError(null); }}
                className="flex-1 glass text-stone-400 font-medium py-3 rounded-xl transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-crema text-espresso font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save & Activate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
