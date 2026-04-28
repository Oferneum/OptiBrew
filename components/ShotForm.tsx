'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { computeBrewRatio } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import type { FlavorTag, Recommendation, Shot } from '@/lib/types';

interface FormState {
  dose: string;
  yieldG: string;
  extraction_time: string;
  brew_temp: string;
  flavor_tags: FlavorTag[];
  overall_score: number | null;
  notes: string;
  grind_setting: string;
}

const FLAVOR_OPTIONS: FlavorTag[] = ['Sour', 'Bitter', 'Balanced', 'Dry'];

const FIELD_CLS =
  'glass-input readout w-full rounded-xl px-4 py-3 text-stone-100 text-lg placeholder:text-stone-700';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1.5">
      {children}
    </p>
  );
}

function Spinner() {
  return (
    <svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ShotForm({
  onSuccess,
}: {
  onSuccess: (shot: Shot, rec: Recommendation) => void;
}) {
  const [form, setForm] = useState<FormState>({
    dose: '',
    yieldG: '',
    extraction_time: '',
    brew_temp: '',
    flavor_tags: [],
    overall_score: null,
    notes: '',
    grind_setting: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active rig resolved from localStorage
  const equipmentIdRef = useRef<string | null>(null);
  const [rigName, setRigName] = useState<string | null>(null);
  const [rigReady, setRigReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('activeEquipmentId');
    equipmentIdRef.current = id;

    if (!id) { setRigReady(true); return; }

    supabase
      .from('equipment_profiles')
      .select('machine_name, grinder_name, grinder_setting')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRigName(data.machine_name);
          // Pre-fill grind setting from last shot with this equipment
          supabase
            .from('shots')
            .select('grind_setting')
            .eq('equipment_id', id)
            .not('grind_setting', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data: shots }) => {
              const last = shots?.[0]?.grind_setting;
              if (last) setForm((f) => ({ ...f, grind_setting: last }));
            });
        }
        setRigReady(true);
      });
  }, []);

  const dose = parseFloat(form.dose) || 0;
  const yieldG = parseFloat(form.yieldG) || 0;
  const brewRatio = computeBrewRatio(dose, yieldG);

  function toggleFlavor(tag: FlavorTag) {
    setForm((f) => ({
      ...f,
      flavor_tags: f.flavor_tags.includes(tag)
        ? f.flavor_tags.filter((t) => t !== tag)
        : [...f.flavor_tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dose: parseFloat(form.dose),
          yield: parseFloat(form.yieldG),
          extraction_time: parseInt(form.extraction_time),
          brew_temp: form.brew_temp ? parseFloat(form.brew_temp) : null,
          flavor_tags: form.flavor_tags,
          overall_score: form.overall_score,
          notes: form.notes || null,
          equipment_id: equipmentIdRef.current,
          grind_setting: form.grind_setting || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to log shot');
      onSuccess(data.shot as Shot, data.recommendation as Recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-5">

      {/* ── Active rig banner ──────────────────────── */}
      {rigReady && (
        rigName ? (
          <div className="flex items-center justify-between glass rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crema/70 shadow-[0_0_5px_rgba(196,135,62,0.7)] shrink-0" />
              <span className="text-stone-300 text-sm font-medium">{rigName}</span>
            </div>
            <Link href="/settings" className="text-crema/60 text-xs hover:text-crema transition-colors">
              Change
            </Link>
          </div>
        ) : (
          <Link
            href="/settings"
            className="flex items-center justify-between glass rounded-xl px-4 py-3 border-crema/20 hover:border-crema/40 transition-colors"
          >
            <span className="text-stone-400 text-sm">No rig configured</span>
            <span className="text-crema text-xs font-medium">Set up →</span>
          </Link>
        )
      )}

      {/* ── Grind Setting ──────────────────────────── */}
      <div>
        <Label>Grind Setting</Label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 14, 2.5, medium-fine…"
          value={form.grind_setting}
          onChange={(e) => setForm((f) => ({ ...f, grind_setting: e.target.value }))}
          className={FIELD_CLS}
          autoFocus
        />
      </div>

      {/* ── Dose + Yield ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Dose (g)</Label>
          <input
            type="number" inputMode="decimal" step="0.1" min="1" required
            placeholder="18.0"
            value={form.dose}
            onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
            className={FIELD_CLS}
          />
        </div>
        <div>
          <Label>Yield (g)</Label>
          <input
            type="number" inputMode="decimal" step="0.1" min="1" required
            placeholder="36.0"
            value={form.yieldG}
            onChange={(e) => setForm((f) => ({ ...f, yieldG: e.target.value }))}
            className={FIELD_CLS}
          />
        </div>
      </div>

      {brewRatio > 0 && (
        <div className="glass rounded-xl px-4 py-2.5 flex items-center justify-between -mt-2">
          <span className="text-stone-600 text-xs uppercase tracking-widest">Brew Ratio</span>
          <span className="readout text-crema font-bold text-base">1:{brewRatio.toFixed(2)}</span>
        </div>
      )}

      {/* ── Time + Temp ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Time (s)</Label>
          <input
            type="number" inputMode="numeric" min="1" required
            placeholder="27"
            value={form.extraction_time}
            onChange={(e) => setForm((f) => ({ ...f, extraction_time: e.target.value }))}
            className={FIELD_CLS}
          />
        </div>
        <div>
          <Label>Temp (°C)</Label>
          <input
            type="number" inputMode="decimal" step="0.5"
            placeholder="93.0"
            value={form.brew_temp}
            onChange={(e) => setForm((f) => ({ ...f, brew_temp: e.target.value }))}
            className={FIELD_CLS}
          />
        </div>
      </div>

      {/* ── Taste ──────────────────────────────────── */}
      <div>
        <Label>Taste</Label>
        <div className="flex flex-wrap gap-2">
          {FLAVOR_OPTIONS.map((tag) => {
            const active = form.flavor_tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFlavor(tag)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 min-h-[44px] ${
                  active
                    ? 'bg-crema text-espresso shadow-[0_0_14px_rgba(196,135,62,0.45)] scale-[1.04]'
                    : 'glass text-stone-400 hover:text-stone-200 active:scale-95'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Score ──────────────────────────────────── */}
      <div>
        <Label>Score</Label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const active = form.overall_score === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, overall_score: n }))}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-150 ${
                  active
                    ? 'bg-crema text-espresso shadow-[0_0_14px_rgba(196,135,62,0.5)] scale-110'
                    : 'glass text-stone-500 hover:text-stone-200 active:scale-90'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notes ──────────────────────────────────── */}
      <div>
        <Label>Notes</Label>
        <textarea
          rows={3}
          placeholder="Optional…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="glass-input w-full rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-700 resize-none"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm glass rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-crema w-full text-espresso font-bold py-4 rounded-2xl text-base tracking-wide disabled:opacity-60 flex items-center justify-center gap-2.5"
      >
        {loading ? <><Spinner />Logging…</> : 'Log Shot'}
      </button>
    </form>
  );
}
