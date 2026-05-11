'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { mutate } from 'swr';
import { supabase } from '@/lib/supabase';
import type { Shot, FlavorTag } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

const FLAVOR_OPTIONS: FlavorTag[] = ['Sour', 'Bitter', 'Balanced', 'Dry'];

const FIELD_CLS =
  'bg-[#FAF3E6] border border-[#C8B49A] rounded-2xl px-4 text-[#2C1E16] placeholder:text-[#2C1E16]/30 w-full focus:outline-none focus:border-[#5D4037] focus:ring-2 focus:ring-[#5D4037]/15 transition-all appearance-none outline-none min-h-[56px] text-base';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-2">
      {children}
    </p>
  );
}

export default function EditShotPanel({
  shot,
  onClose,
}: {
  shot: Shot;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dose, setDose] = useState(String(shot.dose ?? ''));
  const [yieldG, setYieldG] = useState(String(shot.yield ?? ''));
  const [extractionTime, setExtractionTime] = useState(
    shot.brew_method === 'ColdBrew' ? '' : String(shot.extraction_time ?? ''),
  );
  const [steepHours, setSteepHours] = useState(
    shot.brew_method === 'ColdBrew' ? String(shot.steep_time_hours ?? '') : '',
  );
  const [brewTemp, setBrewTemp] = useState(String(shot.brew_temp ?? ''));
  const [grindSetting, setGrindSetting] = useState(shot.grind_setting ?? '');
  const [score, setScore] = useState<number | null>(shot.overall_score ?? null);
  const [flavorTags, setFlavorTags] = useState<FlavorTag[]>((shot.flavor_tags ?? []) as FlavorTag[]);
  const [notes, setNotes] = useState(shot.notes ?? '');

  function toggleFlavor(tag: FlavorTag) {
    setFlavorTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        dose:          parseFloat(dose)   || null,
        yield:         parseFloat(yieldG) || null,
        brew_temp:     brewTemp      ? parseFloat(brewTemp)     : null,
        grind_setting: grindSetting  || null,
        overall_score: score,
        flavor_tags:   flavorTags,
        notes:         notes || null,
      };
      if (shot.brew_method === 'ColdBrew') {
        body.steep_time_hours = steepHours ? parseFloat(steepHours) : null;
      } else {
        body.extraction_time = extractionTime ? parseInt(extractionTime) : null;
      }

      const res = await fetch(`/api/shots/${shot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Save failed (${res.status})`);
      }

      const updated = (await res.json()) as Shot;

      // Instantly update both SWR caches with the new data.
      const patcher = (prev: Shot[] | undefined) =>
        prev?.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      mutate('home/shots',  patcher, { revalidate: false });
      mutate('shots/list',  patcher, { revalidate: false });

      router.refresh();
      onClose();
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const isColdBrew = shot.brew_method === 'ColdBrew';

  return (
    /* ── Full-screen overlay ── */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(5,5,5,0.65)' }}
    >
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* ── Bottom sheet ── */}
      <div
        className="relative bg-[#FFFBF4] rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#C8B49A]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDE4D3]">
          <h2 className="text-[#2C1E16] font-black text-lg uppercase tracking-tight">
            Edit Shot
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F3EFEA] flex items-center justify-center active:scale-90 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6858" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">

          {/* Dose + Yield */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dose (g)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="18.0"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className={`${FIELD_CLS} text-center`}
                style={{ fontSize: '22px' }}
              />
            </div>
            <div>
              <Label>Yield (g)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="36.0"
                value={yieldG}
                onChange={(e) => setYieldG(e.target.value)}
                className={`${FIELD_CLS} text-center`}
                style={{ fontSize: '22px' }}
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isColdBrew ? 'Steep Time (hrs)' : 'Extraction (s)'}</Label>
              {isColdBrew ? (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="16"
                  value={steepHours}
                  onChange={(e) => setSteepHours(e.target.value)}
                  className={FIELD_CLS}
                  style={{ fontSize: '16px' }}
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="28"
                  value={extractionTime}
                  onChange={(e) => setExtractionTime(e.target.value)}
                  className={FIELD_CLS}
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>
            <div>
              <Label>Temp (°C)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="93.0"
                value={brewTemp}
                onChange={(e) => setBrewTemp(e.target.value)}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Grind */}
          <div>
            <Label>Grind Setting</Label>
            <input
              type="text"
              placeholder="e.g. 14, 2.5, medium-fine…"
              value={grindSetting}
              onChange={(e) => setGrindSetting(e.target.value)}
              className={FIELD_CLS}
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Score */}
          <div>
            <Label>Score</Label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const active = score === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    className={`w-11 h-11 rounded-xl border text-sm font-black transition-all duration-150 touch-manipulation ${
                      active
                        ? 'bg-[#5D4037] text-[#FFFBF4] border-transparent shadow-lg shadow-[#5D4037]/25'
                        : 'bg-[#F5EBD8] border-[#C8B49A] text-[#7A6858] active:scale-95'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flavor */}
          <div>
            <Label>Taste</Label>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_OPTIONS.map((tag) => {
                const active = flavorTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFlavor(tag)}
                    className={`px-4 py-3 min-h-[44px] text-sm font-black uppercase tracking-wider rounded-xl border transition-all touch-manipulation ${
                      active
                        ? 'bg-[#5D4037] text-[#FFFBF4] border-transparent'
                        : 'bg-[#F5EBD8] border-[#C8B49A] text-[#7A6858] active:scale-95'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              rows={3}
              placeholder="Optional tasting notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#FAF3E6] border border-[#C8B49A] rounded-2xl px-4 py-4 text-[#2C1E16] text-base placeholder:text-[#2C1E16]/30 resize-none w-full focus:outline-none focus:border-[#5D4037] focus:ring-2 focus:ring-[#5D4037]/15 transition-all appearance-none"
              style={{ fontSize: '16px' }}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-black">
              {error}
            </p>
          )}
        </div>

        {/* Fixed footer */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-[#EDE4D3] bg-[#FFFBF4]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 min-h-[56px] rounded-2xl text-sm font-black uppercase tracking-wide bg-[#F3EFEA] text-[#7A6858] transition-all active:scale-[0.98] touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 min-h-[56px] rounded-2xl text-sm font-black uppercase tracking-wide bg-[#5D4037] text-[#FFFBF4] shadow-xl shadow-[#5D4037]/25 transition-all active:scale-[0.98] disabled:opacity-60 touch-manipulation"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
