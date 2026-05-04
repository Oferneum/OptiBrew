'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { EquipmentProfile } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

const FIELD_CLS =
  'bg-[#F3EFEA] rounded-2xl px-4 py-3 text-[#3C2A21] text-base placeholder:text-[#C4B8AC] w-full focus:outline-none focus:ring-2 focus:ring-[#C85A32] transition-shadow';

const LABEL_CLS = 'text-[10px] uppercase tracking-[0.15em] font-bold text-[#A39A92]';

export default function SettingsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<EquipmentProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [machineName, setMachineName] = useState('');
  const [grinderName, setGrinderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(localStorage.getItem('activeEquipmentId'));
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
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

  if (!mounted) return null;

  const active = profiles.find((p) => p.id === activeId);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-1">
        <p className={`${LABEL_CLS} mb-1`}>Configuration</p>
        <h1 className="text-[#3C2A21] font-bold text-3xl tracking-tight leading-none">My Rig</h1>
      </div>

      {/* Active setup display */}
      {active ? (
        <div className="bg-[#F3EFEA] rounded-3xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #E8E2D9' }}>
            <span className="status-dot w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className={LABEL_CLS}>Active Rig</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className={`${LABEL_CLS} mb-1`}>Machine</p>
              <p className="text-[#3C2A21] font-semibold text-base">{active.machine_name}</p>
            </div>
            {active.grinder_name && (
              <>
                <div style={{ height: 1, background: '#E8E2D9' }} />
                <div>
                  <p className={`${LABEL_CLS} mb-1`}>Grinder</p>
                  <p className="text-[#3C2A21] font-semibold text-base">{active.grinder_name}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#F3EFEA] rounded-3xl px-5 py-4">
          <p className="text-[#A39A92] text-sm">No active rig — select one below or add yours.</p>
        </div>
      )}

      {/* Equipment list */}
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
                className={`w-full text-left bg-white rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-150 active:scale-[0.98] ${
                  isActive ? 'ring-2 ring-[#C85A32]' : ''
                }`}
              >
                <div>
                  <p className="text-[#3C2A21] font-semibold text-sm">{p.machine_name}</p>
                  {p.grinder_name && (
                    <p className="text-[#A39A92] text-xs mt-0.5">{p.grinder_name}</p>
                  )}
                </div>
                {isActive ? (
                  <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-[#FEF2EC] text-[#C85A32] rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[#A39A92] text-xs">Tap to activate</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Account */}
      {userEmail && (
        <div className="bg-white rounded-3xl px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className={`${LABEL_CLS} mb-0.5`}>Signed in as</p>
            <p className="text-[#3C2A21] text-sm font-semibold truncate max-w-[200px]">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="text-[#C85A32] text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-[#FEF2EC] transition-colors touch-manipulation"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Add equipment */}
      <div className="space-y-3">
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full bg-white rounded-3xl px-4 py-4 text-[#A39A92] text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:text-[#3C2A21] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none text-[#C85A32]">+</span>
            Add Equipment
          </button>
        ) : (
          <form onSubmit={handleAdd} className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <p className="text-[#3C2A21] font-semibold text-sm">New Equipment</p>

            <div>
              <p className={`${LABEL_CLS} mb-1.5`}>
                Machine Name <span className="text-[#C85A32] opacity-60 normal-case tracking-normal">*</span>
              </p>
              <input
                type="text"
                required
                placeholder="e.g. Lelit Bianca, Breville Barista Express"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className={FIELD_CLS}
                autoFocus
              />
            </div>

            <div>
              <p className={`${LABEL_CLS} mb-1.5`}>
                Grinder Name <span className="text-[#A39A92] normal-case tracking-normal font-normal">optional</span>
              </p>
              <input
                type="text"
                placeholder="e.g. Niche Zero, DF64"
                value={grinderName}
                onChange={(e) => setGrinderName(e.target.value)}
                className={FIELD_CLS}
              />
            </div>

            {addError && (
              <p className="text-red-500 text-sm">{addError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddError(null); }}
                className="flex-1 bg-[#F3EFEA] text-[#3C2A21] font-medium py-3 rounded-2xl transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-crema text-white font-bold py-3 rounded-2xl disabled:opacity-60"
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
