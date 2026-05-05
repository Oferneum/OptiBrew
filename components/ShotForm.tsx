'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Coffee, Milk } from 'lucide-react';
import { computeBrewRatio } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import type { FlavorTag, Shot, BrewMethod } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

interface FormState {
  dose: string;
  yieldG: string;
  extraction_time: string;
  brew_temp: string;
  flavor_tags: FlavorTag[];
  overall_score: number | null;
  notes: string;
  grind_setting: string;
  brew_method: BrewMethod;
  has_milk: boolean;
}

const FLAVOR_OPTIONS: FlavorTag[] = ['Sour', 'Bitter', 'Balanced', 'Dry'];

// ── Icons ──────────────────────────────────────────────────

function IconMokaPot({ size = 20, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1.5 L14 1.5 Q14.5 1.5 14.5 2 L14.5 3 L9.5 3 L9.5 2 Q9.5 1.5 10 1.5 Z" />
      <path d="M9.5 3 L8 5.5 L16 5.5 L14.5 3 Z" />
      <path d="M7.5 5.5 L6.5 10.5 L17.5 10.5 L16.5 5.5 Z" />
      <path d="M6 10.5 L6 12 L18 12 L18 10.5 Z" />
      <path d="M6.5 12 L4.5 20.5 L19.5 20.5 L17.5 12 Z" />
      <path d="M4 20.5 L4 21.5 Q4 22.5 5 22.5 L19 22.5 Q20 22.5 20 21.5 L20 20.5" />
      <path d="M17.5 13.5 L20.5 13.5 Q22.5 13.5 22.5 16.5 Q22.5 19.5 20.5 19.5 L17.5 19.5" />
      <path d="M6.5 7.5 L4 7.5 Q3 7.5 3 6.5" />
      <circle cx="12" cy="16.5" r="0.8" />
    </svg>
  );
}

function IconFrenchPress({ size = 20, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8 L5.5 21.5 Q5.5 22 6 22 L18 22 Q18.5 22 18.5 21.5 L18.5 8" />
      <path d="M4.5 6.5 L4.5 8 L19.5 8 L19.5 6.5 Z" />
      <path d="M9.5 6.5 L9.5 4 Q9.5 3 10.5 3 L13.5 3 Q14.5 3 14.5 4 L14.5 6.5" />
      <path d="M12 8 L12 14.5" />
      <path d="M6.5 14.5 L17.5 14.5" />
      <path d="M18.5 11 Q21.5 11 21.5 14 Q21.5 17 18.5 17" />
    </svg>
  );
}

function IconV60({ size = 20, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5 L21 5" /><path d="M3 5 L12 17.5" /><path d="M21 5 L12 17.5" />
      <path d="M7 5 L11 14" /><path d="M17 5 L13 14" />
      <path d="M12 17.5 L12 19.5" />
      <path d="M7.5 19.5 Q7 22 8 22 L16 22 Q17 22 16.5 19.5 Z" />
    </svg>
  );
}

function IconAeropress({ size = 20, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 19 L8 7 L16 7 L16 19" /><path d="M8 7 L16 7" />
      <path d="M5.5 19 L5.5 21 Q5.5 22 7 22 L17 22 Q18.5 22 18.5 21 L18.5 19 Z" />
      <path d="M12 4 L12 14.5" /><path d="M9.5 14.5 L14.5 14.5" />
      <path d="M8.5 4 L15.5 4" />
    </svg>
  );
}

const BREW_METHODS: { id: BrewMethod; label: string; Icon: React.ElementType }[] = [
  { id: 'Espresso',     label: 'Espresso', Icon: Coffee          },
  { id: 'MokaPot',     label: 'Moka',     Icon: IconMokaPot     },
  { id: 'FrenchPress', label: 'French',   Icon: IconFrenchPress },
  { id: 'V60',         label: 'V60',      Icon: IconV60         },
  { id: 'Aeropress',   label: 'Aeropress',Icon: IconAeropress   },
];

// ── Shared styles ──────────────────────────────────────────

const FIELD_CLS =
  'bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-xl placeholder:text-white/25 w-full focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 transition-all appearance-none outline-none min-h-[56px]';

const CARD = 'glass rounded-3xl p-5 space-y-4';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A1A1AA] mb-2">
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

// ── Timer helper ───────────────────────────────────────────

function formatTimer(ms: number): string {
  const totalDs = Math.floor(ms / 100);
  const ds = totalDs % 10;
  const s  = Math.floor(totalDs / 10) % 60;
  const m  = Math.floor(totalDs / 600);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ds}`;
}

// ── Bean Select ────────────────────────────────────────────

interface BeanSearchProps {
  onSelect: (id: string, label: string) => void;
  onClear: () => void;
  selected: { id: string; label: string } | null;
}

interface NewBagForm { origin: string; roaster: string; bag_name: string; price_paid: string; weight_grams: string; }
interface BeanEntry  { id: string; roaster: string; origin: string; bag_name?: string | null; }
interface ScanSlot   { file: File; preview: string; }

function compressImage(file: File, maxPx = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

function BeanSearch({ onSelect, onClear, selected }: BeanSearchProps) {
  const [allBeans, setAllBeans] = useState<BeanEntry[]>([]);
  const [loadingBeans, setLoadingBeans] = useState(true);
  const [showNewBag, setShowNewBag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBag, setNewBag] = useState<NewBagForm>({ origin: '', roaster: '', bag_name: '', price_paid: '', weight_grams: '' });

  const [scanning, setScanning]     = useState(false);
  const [scanRec, setScanRec]       = useState<string | null>(null);
  const [scanError, setScanError]   = useState<string | null>(null);
  const [scanFront, setScanFront]   = useState<ScanSlot | null>(null);
  const [scanBack, setScanBack]     = useState<ScanSlot | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadingBeans(true);
    supabase
      .from('beans')
      .select('id, roaster, origin, bag_name')
      .order('roaster', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setAllBeans(data ?? []);
        setLoadingBeans(false);
      });
  }, []);

  function selectImage(slot: 'front' | 'back', file: File) {
    const preview = URL.createObjectURL(file);
    if (slot === 'front') { setScanFront({ file, preview }); setScanRec(null); }
    else                  { setScanBack({ file, preview });  setScanRec(null); }
  }

  async function submitScan() {
    if (!scanFront) return;
    setScanning(true);
    setScanRec(null);
    setScanError(null);
    try {
      const [frontBlob, backBlob] = await Promise.all([
        compressImage(scanFront.file),
        scanBack ? compressImage(scanBack.file) : Promise.resolve(null),
      ]);
      const fd = new FormData();
      fd.append('image', frontBlob, 'front.jpg');
      if (backBlob) fd.append('image', backBlob, 'back.jpg');
      const res = await fetch('/api/scan-bag', { method: 'POST', body: fd, headers: await authHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setScanError((body as { error?: string }).error || `Scan failed (${res.status}) — please try again`);
        return;
      }
      const { scan, recommendation } = await res.json();
      setNewBag((b) => ({
        ...b,
        roaster:  scan.roaster  || b.roaster,
        bag_name: scan.bag_name || b.bag_name,
        origin:   scan.origin   || b.origin,
      }));
      setScanRec(recommendation);
    } finally {
      setScanning(false);
    }
  }

  function resetScan() {
    setScanFront(null);
    setScanBack(null);
    setScanRec(null);
    setScanError(null);
  }

  async function saveNewBag() {
    if (!newBag.origin.trim() || !newBag.roaster.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/beans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          origin:       newBag.origin.trim(),
          roaster:      newBag.roaster.trim(),
          bag_name:     newBag.bag_name.trim() || null,
          roast_date:   new Date().toISOString().split('T')[0],
          is_active:    true,
          price_paid:   newBag.price_paid   ? parseFloat(newBag.price_paid)   : null,
          weight_grams: newBag.weight_grams ? parseFloat(newBag.weight_grams) : null,
        }),
      });
      const data = await res.json();
      if (res.ok || res.status === 409) {
        const bean = res.status === 409 ? data.match : data;
        const label = newBag.bag_name.trim()
          ? `${newBag.roaster.trim()} · ${newBag.bag_name.trim()}`
          : `${newBag.roaster.trim()} · ${newBag.origin.trim()}`;
        onSelect(bean.id, label);
        setShowNewBag(false);
        setNewBag({ origin: '', roaster: '', bag_name: '', price_paid: '', weight_grams: '' });
        resetScan();
        const { data: fresh } = await supabase
          .from('beans').select('id, roaster, origin, bag_name').order('roaster', { ascending: true });
        setAllBeans(fresh ?? []);
      }
    } finally { setSaving(false); }
  }

  const newBagInputCls = 'bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-base placeholder:text-white/25 w-full focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 transition-all appearance-none outline-none';
  const cameraIcon = (
    <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selected?.id ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'NEW_BAG') { e.target.value = selected?.id ?? ''; setShowNewBag(true); return; }
            if (val === '') { onClear(); return; }
            const bean = allBeans.find((b) => b.id === val);
            if (bean) {
              const label = bean.bag_name
                ? `${bean.roaster} · ${bean.bag_name}`
                : `${bean.roaster} · ${bean.origin}`;
              onSelect(bean.id, label);
            }
          }}
          className="bg-white/5 border border-white/10 rounded-2xl px-4 min-h-[56px] text-white text-base font-black appearance-none outline-none w-full focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 transition-all"
          style={{ fontSize: '16px' }}
        >
          {loadingBeans
            ? <option value="" disabled>Loading beans…</option>
            : <option value="">Select a bean…</option>
          }
          {allBeans.map((b) => (
            <option key={b.id} value={b.id} style={{ background: '#1a1a2e' }}>
              {b.bag_name ? `${b.roaster} · ${b.bag_name}` : `${b.roaster} · ${b.origin}`}
            </option>
          ))}
          <option value="NEW_BAG" style={{ background: '#1a1a2e' }}>+ Add New Bag</option>
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">▾</span>
      </div>

      {showNewBag && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <p className="text-white font-black text-base uppercase tracking-wider">New Bag</p>

          {/* ── Two image slots ── */}
          <div className="flex gap-3">
            {/* Front slot */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                disabled={scanning}
                className="w-full aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation overflow-hidden"
              >
                {scanFront ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scanFront.preview} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <>{cameraIcon}<span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Front</span></>
                )}
              </button>
              {scanFront && (
                <button
                  type="button"
                  onClick={() => { setScanFront(null); setScanRec(null); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
              <input ref={frontInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage('front', f); e.target.value = ''; }} />
            </div>

            {/* Back slot */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                disabled={scanning}
                className="w-full aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation overflow-hidden"
              >
                {scanBack ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scanBack.preview} alt="Back" className="w-full h-full object-cover" />
                ) : (
                  <>{cameraIcon}<span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Back (opt.)</span></>
                )}
              </button>
              {scanBack && (
                <button
                  type="button"
                  onClick={() => { setScanBack(null); setScanRec(null); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
              <input ref={backInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage('back', f); e.target.value = ''; }} />
            </div>
          </div>

          {/* ── Scan Now button (appears once at least one image is selected) ── */}
          {(scanFront || scanBack) && (
            <button
              type="button"
              onClick={submitScan}
              disabled={scanning || !scanFront}
              className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
            >
              {scanning ? <><Spinner /><span>Scanning…</span></> : <span>Scan Bag</span>}
            </button>
          )}

          {/* ── Scan error ── */}
          {scanError && !scanning && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm font-medium">{scanError}</p>
            </div>
          )}

          {/* ── Startup recommendation ── */}
          {scanRec && !scanning && (
            <div className="bg-[#FFC107]/10 border border-[#FFC107]/20 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFC107] mb-2">Startup Rec</p>
              <p className="text-white/90 text-sm leading-relaxed">{scanRec}</p>
            </div>
          )}

          {/* ── Fields ── */}
          <div>
            <Label>Bag Name</Label>
            <input
              type="text"
              placeholder="e.g. Sunrise Blend"
              value={newBag.bag_name}
              onChange={(e) => setNewBag((b) => ({ ...b, bag_name: e.target.value }))}
              className={newBagInputCls}
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label>Roaster *</Label>
              <input
                type="text"
                placeholder="e.g. Onyx"
                value={newBag.roaster}
                onChange={(e) => setNewBag((b) => ({ ...b, roaster: e.target.value }))}
                className={newBagInputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <Label>Origin *</Label>
              <input
                type="text"
                placeholder="e.g. Ethiopia"
                value={newBag.origin}
                onChange={(e) => setNewBag((b) => ({ ...b, origin: e.target.value }))}
                className={newBagInputCls}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <Label>Price (₪)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="85"
                value={newBag.price_paid}
                onChange={(e) => setNewBag((b) => ({ ...b, price_paid: e.target.value }))}
                className={`${newBagInputCls} readout`}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <Label>Weight (g)</Label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="250"
                value={newBag.weight_grams}
                onChange={(e) => setNewBag((b) => ({ ...b, weight_grams: e.target.value }))}
                className={`${newBagInputCls} readout`}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => { setShowNewBag(false); resetScan(); }}
              className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 min-h-[56px] rounded-xl text-sm uppercase tracking-wide active:scale-95 transition-all touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNewBag}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black font-black py-4 min-h-[56px] rounded-xl text-sm uppercase tracking-wide shadow-lg shadow-[#FF4500]/30 active:scale-95 transition-all disabled:opacity-60 touch-manipulation"
            >
              {saving ? 'Saving…' : 'Add & Select'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────

export default function ShotForm({
  onSuccess,
  onSubmitting,
}: {
  onSuccess: (shot: Shot, recommendation: string) => void;
  onSubmitting?: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    dose: '', yieldG: '', extraction_time: '', brew_temp: '',
    flavor_tags: [], overall_score: null, notes: '',
    grind_setting: '', brew_method: 'Espresso', has_milk: false,
  });
  const [selectedBean, setSelectedBean] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Timer: use refs to avoid stale closures ──
  const [timerMs, setTimerMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRunningRef = useRef(false);
  const timerMsRef      = useRef(0);
  const timerRAFRef      = useRef<number | null>(null);
  const timerStartRef    = useRef<number>(0);
  const lastRenderRef    = useRef<number>(0);

  const [timeMode, setTimeMode] = useState<'timer' | 'manual'>('timer');
  const manualInputRef = useRef<HTMLInputElement>(null);

  const equipmentIdRef = useRef<string | null>(null);
  const [rigName, setRigName] = useState<string | null>(null);
  const [rigReady, setRigReady] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('activeEquipmentId');
    equipmentIdRef.current = id;
    if (!id) { setRigReady(true); return; }
    supabase.from('equipment_profiles').select('machine_name').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setRigName(data.machine_name);
          supabase.from('shots').select('grind_setting')
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

  useEffect(() => () => {
    if (timerRAFRef.current !== null) cancelAnimationFrame(timerRAFRef.current);
  }, []);

  function handleTimerToggle() {
    if (timerRunningRef.current) {
      if (timerRAFRef.current !== null) cancelAnimationFrame(timerRAFRef.current);
      timerRAFRef.current = null;
      timerRunningRef.current = false;
      setTimerRunning(false);
      setForm((f) => ({ ...f, extraction_time: String(Math.round(timerMsRef.current / 1000)) }));
    } else {
      timerStartRef.current = Date.now() - timerMsRef.current;
      timerRunningRef.current = true;
      lastRenderRef.current = 0;
      setTimerRunning(true);
      const tick = () => {
        if (!timerRunningRef.current) return;
        const elapsed = Date.now() - timerStartRef.current;
        timerMsRef.current = elapsed;
        if (elapsed - lastRenderRef.current >= 100) {
          lastRenderRef.current = elapsed;
          setTimerMs(elapsed);
        }
        timerRAFRef.current = requestAnimationFrame(tick);
      };
      timerRAFRef.current = requestAnimationFrame(tick);
    }
  }

  function handleTimerReset() {
    if (timerRAFRef.current !== null) cancelAnimationFrame(timerRAFRef.current);
    timerRAFRef.current = null;
    timerRunningRef.current = false;
    timerMsRef.current = 0;
    lastRenderRef.current = 0;
    setTimerRunning(false);
    setTimerMs(0);
    setForm((f) => ({ ...f, extraction_time: '' }));
  }

  function switchToManual() {
    // Focus FIRST synchronously — input is off-screen but has real 1px dimensions so iOS allows it
    manualInputRef.current?.focus();
    if (timerRunningRef.current) {
      if (timerRAFRef.current !== null) cancelAnimationFrame(timerRAFRef.current);
      timerRAFRef.current = null;
      timerRunningRef.current = false;
      setTimerRunning(false);
      setForm((f) => ({ ...f, extraction_time: String(Math.round(timerMsRef.current / 1000)) }));
    }
    setTimeMode('manual');
  }

  const dose      = parseFloat(form.dose)   || 0;
  const yieldG    = parseFloat(form.yieldG) || 0;
  const brewRatio = computeBrewRatio(dose, yieldG);

  function toggleFlavor(tag: FlavorTag) {
    setForm((f) => ({
      ...f,
      flavor_tags: f.flavor_tags.includes(tag)
        ? f.flavor_tags.filter((t) => t !== tag)
        : [...f.flavor_tags, tag],
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.dose || !form.yieldG) { setError('Dose and yield are required'); return; }
    setLoading(true); setError(null);
    onSubmitting?.();
    try {
      const res = await fetch('/api/shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          dose:           parseFloat(form.dose),
          yield:          parseFloat(form.yieldG),
          extraction_time: parseInt(form.extraction_time),
          brew_temp:      form.brew_temp ? parseFloat(form.brew_temp) : null,
          flavor_tags:    form.flavor_tags,
          overall_score:  form.overall_score,
          notes:          form.notes || null,
          equipment_id:   equipmentIdRef.current,
          grind_setting:  form.grind_setting || null,
          brew_method:    form.brew_method,
          has_milk:       form.has_milk,
          bean_id:        selectedBean?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to log shot');
      onSuccess(data.shot as Shot, data.shot.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  const isEspresso = form.brew_method === 'Espresso';

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">

      {/* ── Card 1: Method, Milk & Rig ─────────────────── */}
      <div className={CARD}>
        <div>
          <Label>Brew Method</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {BREW_METHODS.map(({ id, label, Icon }) => {
              const active = form.brew_method === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id !== 'Espresso' && timerRunningRef.current) {
                      if (timerRAFRef.current !== null) cancelAnimationFrame(timerRAFRef.current);
                      timerRAFRef.current = null;
                      timerRunningRef.current = false;
                      setTimerRunning(false);
                    }
                    setForm((f) => ({ ...f, brew_method: id }));
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 min-h-[56px] py-2 rounded-xl border text-[9px] font-black tracking-wider uppercase transition-all duration-150 touch-manipulation ${
                    active
                      ? 'bg-gradient-to-b from-[#FF4500] to-[#FFC107] text-black border-transparent shadow-lg shadow-[#FF4500]/25'
                      : 'bg-white/5 border-white/10 text-[#A1A1AA] active:scale-95'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between min-h-[56px]">
          <div className="flex items-center gap-2.5">
            <Milk size={16} className="text-[#A1A1AA]" strokeWidth={1.75} />
            <span className="text-white text-sm font-black uppercase tracking-wide">Milk Drink?</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, has_milk: !f.has_milk }))}
            className={`relative w-12 h-7 border rounded-full transition-all duration-200 touch-manipulation ${
              form.has_milk
                ? 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] border-transparent'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.has_milk ? 'translate-x-[18px]' : 'translate-x-0'}`} />
          </button>
        </div>

        {rigReady && (
          rigName ? (
            <div className="flex items-center justify-between min-h-[44px]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#FF4500] shrink-0" style={{ boxShadow: '0 0 6px #FF4500' }} />
                <span className="text-white text-sm font-black uppercase tracking-wide">{rigName}</span>
              </div>
              <Link
                href="/settings"
                className="text-[#A1A1AA] text-xs font-black uppercase tracking-widest hover:text-[#FF4500] transition-colors px-2 py-3"
              >
                Change
              </Link>
            </div>
          ) : (
            <Link
              href="/settings"
              className="flex items-center justify-between border border-dashed border-white/20 rounded-2xl px-4 min-h-[56px] hover:bg-white/5 transition-colors"
            >
              <span className="text-[#A1A1AA] text-sm font-bold uppercase tracking-wide">No rig configured</span>
              <span className="text-[#FF4500] text-xs font-black uppercase tracking-widest">Set up →</span>
            </Link>
          )
        )}
      </div>

      {/* ── Card 2: Bean & Grind ───────────────────────── */}
      <div className={CARD}>
        <div>
          <Label>Bean</Label>
          <BeanSearch
            selected={selectedBean}
            onSelect={(id, label) => setSelectedBean({ id, label })}
            onClear={() => setSelectedBean(null)}
          />
        </div>
        <div>
          <Label>Grind Setting</Label>
          <input
            type="text"
            placeholder="e.g. 14, 2.5, medium-fine…"
            value={form.grind_setting}
            onChange={(e) => setForm((f) => ({ ...f, grind_setting: e.target.value }))}
            className={FIELD_CLS}
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* ── Card 3: Extraction ─────────────────────────── */}
      <div className={CARD}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Dose (g)</Label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={isEspresso ? '18.0' : '15.0'}
              value={form.dose}
              onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
              className={`${FIELD_CLS} text-center`}
              style={{ fontSize: '22px' }}
            />
          </div>
          <div>
            <Label>{isEspresso ? 'Yield (g)' : 'Water out (g)'}</Label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={isEspresso ? '36.0' : '250.0'}
              value={form.yieldG}
              onChange={(e) => setForm((f) => ({ ...f, yieldG: e.target.value }))}
              className={`${FIELD_CLS} text-center`}
              style={{ fontSize: '22px' }}
            />
          </div>
        </div>

        {brewRatio > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A1A1AA]">Brew Ratio</span>
            <span className="readout font-black text-lg bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent">
              1:{brewRatio.toFixed(2)}
            </span>
          </div>
        )}

        {isEspresso ? (
          <>
            <div>
              <Label>Extraction Time</Label>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

                {/* Segmented control */}
                <div className="grid grid-cols-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setTimeMode('timer')}
                    className={`min-h-[48px] text-xs font-black tracking-widest uppercase transition-all border-r border-white/10 touch-manipulation ${
                      timeMode === 'timer'
                        ? 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black'
                        : 'bg-transparent text-[#A1A1AA]'
                    }`}
                  >
                    ⏱ Timer
                  </button>
                  <button
                    type="button"
                    onClick={switchToManual}
                    className={`min-h-[48px] text-xs font-black tracking-widest uppercase transition-all touch-manipulation ${
                      timeMode === 'manual'
                        ? 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black'
                        : 'bg-transparent text-[#A1A1AA]'
                    }`}
                  >
                    ✎ Type
                  </button>
                </div>

                {/* Timer panel */}
                <div className={timeMode === 'timer' ? 'px-5 py-5 space-y-4' : 'hidden'}>
                  <div className="flex items-center justify-center min-h-[80px]">
                    <div
                      className={`readout font-black tracking-wider tabular-nums select-none ${
                        timerRunning
                          ? 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent'
                          : timerMs > 0
                            ? 'text-white'
                            : 'text-white/25'
                      }`}
                      style={{ fontSize: '3.75rem', lineHeight: 1 }}
                    >
                      {formatTimer(timerMs)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTimerToggle}
                      className={`flex-1 py-4 min-h-[56px] rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 touch-manipulation ${
                        timerRunning
                          ? 'bg-white/5 border border-[#FF4500]/60 text-[#FF4500]'
                          : 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black shadow-lg shadow-[#FF4500]/30'
                      }`}
                    >
                      {timerRunning ? '■ Stop' : timerMs > 0 ? '▶ Resume' : '▶ Start'}
                    </button>
                    {timerMs > 0 && (
                      <button
                        type="button"
                        onClick={handleTimerReset}
                        className="px-5 py-4 min-h-[56px] bg-white/5 border border-white/10 rounded-xl text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95 touch-manipulation"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {form.extraction_time && !timerRunning && (
                    <p className="text-center text-[#A1A1AA] text-xs uppercase tracking-widest font-black">
                      Saved: <span className="readout text-white">{form.extraction_time}s</span>
                    </p>
                  )}
                </div>

                {/* Manual panel — input always in DOM; hidden via CSS only so iOS .focus() works */}
                <div className={timeMode === 'manual' ? 'px-5 pb-5 pt-4' : undefined}>
                  <div className="relative">
                    <input
                      ref={manualInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="28"
                      value={form.extraction_time}
                      onChange={(e) => setForm((f) => ({ ...f, extraction_time: e.target.value }))}
                      className={
                        timeMode === 'manual'
                          ? 'w-full bg-white/5 border-2 border-[#FF4500]/60 rounded-xl py-4 text-white font-black readout text-center focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 appearance-none'
                          : ''
                      }
                      style={
                        timeMode === 'manual'
                          ? { fontSize: '3.75rem', lineHeight: 1 }
                          : { position: 'fixed', left: '-9999px', top: '-9999px', width: '1px', height: '1px', opacity: 0, fontSize: '16px', pointerEvents: 'none' }
                      }
                    />
                    {timeMode === 'manual' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] text-sm font-black uppercase pointer-events-none">
                        sec
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
            <div>
              <Label>Temp (°C)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="93.0"
                value={form.brew_temp}
                onChange={(e) => setForm((f) => ({ ...f, brew_temp: e.target.value }))}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brew Time (s)</Label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={form.brew_method === 'FrenchPress' ? '240' : '180'}
                value={form.extraction_time}
                onChange={(e) => setForm((f) => ({ ...f, extraction_time: e.target.value }))}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
            <div>
              <Label>Temp (°C)</Label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="96.0"
                value={form.brew_temp}
                onChange={(e) => setForm((f) => ({ ...f, brew_temp: e.target.value }))}
                className={FIELD_CLS}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Card 4: Taste & Score ──────────────────────── */}
      <div className={CARD}>
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
                  className={`px-5 text-sm font-black uppercase tracking-wider transition-all duration-150 min-h-[56px] rounded-xl border touch-manipulation ${
                    active
                      ? 'bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black border-transparent shadow-lg shadow-[#FF4500]/25'
                      : 'bg-white/5 border-white/10 text-[#A1A1AA] active:scale-95'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

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
                  className={`w-12 h-12 rounded-xl border text-sm font-black transition-all duration-150 touch-manipulation ${
                    active
                      ? 'bg-gradient-to-br from-[#FF4500] to-[#FFC107] text-black border-transparent shadow-lg shadow-[#FF4500]/25'
                      : 'bg-white/5 border-white/10 text-[#A1A1AA] active:scale-95'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Notes ─────────────────────────────────── */}
      <div>
        <Label>Notes</Label>
        <textarea
          rows={3}
          placeholder="Optional tasting notes…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-base placeholder:text-white/25 resize-none w-full focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/20 transition-all appearance-none"
          style={{ fontSize: '16px' }}
        />
      </div>

      {error && (
        <p className="text-[#FF4500] text-sm bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-xl px-4 py-3 font-black">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gradient-to-r from-[#FF4500] to-[#FFC107] rounded-2xl w-full text-black font-black py-6 text-base uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 disabled:opacity-60 active:scale-95 transition-all touch-manipulation shadow-xl shadow-[#FF4500]/30"
      >
        {loading ? <><Spinner /> Analyzing…</> : 'Log Shot →'}
      </button>
    </form>
  );
}
