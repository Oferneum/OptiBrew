'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BeanVFMData } from '@/lib/vfm-actions';

const LABEL = 'text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1';
const INPUT = 'bg-[#FAF3E6] border border-[#C8B49A] rounded-xl px-3 py-2.5 text-[#2C1E16] text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 focus:border-[#5D4037] transition-all placeholder:text-[#2C1E16]/30 appearance-none outline-none';

function VfmBadge({ value }: { value: number }) {
  const tier = value >= 1.5 ? 'great' : value >= 0.8 ? 'good' : 'low';
  const styles = {
    great: 'bg-green-500/15 text-green-700',
    good:  'bg-amber-500/15 text-amber-700',
    low:   'bg-red-500/15 text-red-700',
  };
  const labels = { great: 'Great Value', good: 'Good Value', low: 'Premium' };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl ${styles[tier]}`}>
      <span className="readout font-bold text-lg leading-none">{value.toFixed(1)}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">VFM</p>
        <p className="text-[10px] font-semibold">{labels[tier]}</p>
      </div>
    </div>
  );
}

interface EditState {
  roaster:      string;
  bag_name:     string;
  origin:       string;
  price_paid:   string;
  weight_grams: string;
  roast_date:   string;
  is_active:    boolean;
}

export default function BeanCard({ bean }: { bean: BeanVFMData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [draft, setDraft] = useState<EditState>({
    roaster:      bean.roaster,
    bag_name:     bean.bag_name ?? '',
    origin:       bean.origin,
    price_paid:   bean.price_paid != null ? String(bean.price_paid) : '',
    weight_grams: bean.weight_grams != null ? String(bean.weight_grams) : '',
    roast_date:   bean.roast_date ?? '',
    is_active:    bean.isActive,
  });

  function openEdit() {
    setDraft({
      roaster:      bean.roaster,
      bag_name:     bean.bag_name ?? '',
      origin:       bean.origin,
      price_paid:   bean.price_paid != null ? String(bean.price_paid) : '',
      weight_grams: bean.weight_grams != null ? String(bean.weight_grams) : '',
      roast_date:   bean.roast_date ?? '',
      is_active:    bean.isActive,
    });
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!draft.roaster.trim() || !draft.origin.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/beans/${bean.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roaster:      draft.roaster.trim(),
          bag_name:     draft.bag_name.trim() || null,
          origin:       draft.origin.trim(),
          price_paid:   draft.price_paid   ? parseFloat(draft.price_paid)   : null,
          weight_grams: draft.weight_grams ? parseFloat(draft.weight_grams) : null,
          roast_date:   draft.roast_date || null,
          is_active:    draft.is_active,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to save');
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-5 overflow-hidden">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[#2C1E16] font-bold text-base leading-tight">{bean.roaster}</p>
          {bean.bag_name && (
            <p className="text-[#2C1E16]/80 text-sm font-semibold mt-0">{bean.bag_name}</p>
          )}
          <p className="text-[#7A6858] text-sm mt-0.5">{bean.origin}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {bean.isActive && (
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-[#5D4037]/12 text-[#5D4037] rounded-full">
              Active
            </span>
          )}
          <button
            type="button"
            onClick={editing ? () => setEditing(false) : openEdit}
            className="p-1.5 rounded-xl text-[#7A6858] hover:text-[#2C1E16] hover:bg-[#F5EBD8] transition-colors"
            aria-label={editing ? 'Cancel edit' : 'Edit bean'}
          >
            {editing ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── VFM badge ── */}
      {bean.vfm != null && bean.vfm > 0 && !editing && (
        <div className="mt-4">
          <VfmBadge value={bean.vfm} />
        </div>
      )}

      {/* ── Stats pills ── */}
      {!editing && (
        <div className="flex flex-wrap gap-2 mt-3">
          {bean.shotCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-[#2C1E16]/8 text-[#7A6858] rounded-full">
              {bean.shotCount} shot{bean.shotCount !== 1 ? 's' : ''}
            </span>
          )}
          {bean.avgScore != null && (
            <span className="readout text-xs font-bold px-2.5 py-1 bg-[#5D4037]/12 text-[#5D4037] rounded-full">
              avg {bean.avgScore.toFixed(1)}/10
            </span>
          )}
          {bean.costPerShot != null && bean.costPerShot > 0 && (
            <span className="readout text-xs font-medium px-2.5 py-1 bg-[#2C1E16]/8 text-[#7A6858] rounded-full">
              ₪{bean.costPerShot.toFixed(2)}/shot
            </span>
          )}
          {bean.community_method && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/12 text-blue-700 rounded-full flex items-center gap-1">
              <span>★</span>
              <span>Recommended: {bean.community_method.brew_method}</span>
            </span>
          )}
        </div>
      )}

      {/* ── Static details row ── */}
      {!editing && (bean.price_paid != null || bean.weight_grams != null || bean.roast_date) && (
        <div className="flex gap-5 mt-4 pt-3 border-t border-[#C8B49A]">
          {bean.price_paid != null && (
            <div>
              <p className="text-[#7A6858] text-[10px] uppercase tracking-widest font-bold mb-0.5">Price</p>
              <p className="readout text-[#2C1E16] font-semibold text-sm">₪{bean.price_paid}</p>
            </div>
          )}
          {bean.weight_grams != null && (
            <div>
              <p className="text-[#7A6858] text-[10px] uppercase tracking-widest font-bold mb-0.5">Weight</p>
              <p className="readout text-[#2C1E16] font-semibold text-sm">{bean.weight_grams}g</p>
            </div>
          )}
          {bean.roast_date && (
            <div>
              <p className="text-[#7A6858] text-[10px] uppercase tracking-widest font-bold mb-0.5">Roasted</p>
              <p className="readout text-[#2C1E16] font-semibold text-sm">
                {new Date(bean.roast_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit panel ── */}
      {editing && (
        <div className="mt-4 pt-4 border-t border-[#C8B49A] space-y-3">

          <div>
            <p className={LABEL}>Bag Name</p>
            <input
              type="text"
              value={draft.bag_name}
              onChange={(e) => setDraft((d) => ({ ...d, bag_name: e.target.value }))}
              className={INPUT}
              placeholder="e.g. Sunrise Blend"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <p className={LABEL}>Roaster *</p>
              <input
                type="text"
                value={draft.roaster}
                onChange={(e) => setDraft((d) => ({ ...d, roaster: e.target.value }))}
                className={INPUT}
                placeholder="e.g. Onyx"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="min-w-0">
              <p className={LABEL}>Origin *</p>
              <input
                type="text"
                value={draft.origin}
                onChange={(e) => setDraft((d) => ({ ...d, origin: e.target.value }))}
                className={INPUT}
                placeholder="e.g. Ethiopia"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="min-w-0">
              <p className={LABEL}>Price (₪)</p>
              <input
                type="text"
                inputMode="decimal"
                value={draft.price_paid}
                onChange={(e) => setDraft((d) => ({ ...d, price_paid: e.target.value }))}
                className={INPUT + ' readout'}
                placeholder="85"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="min-w-0">
              <p className={LABEL}>Weight (g)</p>
              <input
                type="text"
                inputMode="numeric"
                value={draft.weight_grams}
                onChange={(e) => setDraft((d) => ({ ...d, weight_grams: e.target.value }))}
                className={INPUT + ' readout'}
                placeholder="250"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div>
            <p className={LABEL}>Roast Date</p>
            <input
              type="date"
              value={draft.roast_date}
              onChange={(e) => setDraft((d) => ({ ...d, roast_date: e.target.value }))}
              className={INPUT + ' readout'}
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[#2C1E16] text-sm font-medium">Active bag</span>
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, is_active: !d.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${draft.is_active ? 'bg-[#5D4037]' : 'bg-[#C8B49A]/50'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${draft.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 bg-[#F5EBD8] border border-[#C8B49A] text-[#2C1E16] font-medium py-3 rounded-2xl text-sm transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.roaster.trim() || !draft.origin.trim()}
              className="flex-1 bg-[#5D4037] text-[#FFFBF4] font-black py-3 rounded-2xl text-sm disabled:opacity-50 transition-all active:scale-[0.97]"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
