'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

interface NewBagForm {
  bag_name: string;
  roaster: string;
  origin: string;
  price_paid: string;
  weight_grams: string;
}

interface ScanSlot { file: File; preview: string; }

function Spinner() {
  return (
    <svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

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

const INPUT = 'bg-[#FAF3E6] border border-[#C8B49A] rounded-xl px-3 py-3 text-[#2C1E16] text-base placeholder:text-[#2C1E16]/30 w-full focus:outline-none focus:border-[#5D4037] focus:ring-2 focus:ring-[#5D4037]/15 transition-all appearance-none outline-none';

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-2">{children}</p>;
}

export default function NewBagPage() {
  const router = useRouter();

  const [form, setForm]         = useState<NewBagForm>({ bag_name: '', roaster: '', origin: '', price_paid: '', weight_grams: '' });
  const [scanFront, setScanFront] = useState<ScanSlot | null>(null);
  const [scanBack,  setScanBack]  = useState<ScanSlot | null>(null);
  const [scanning,       setScanning]       = useState(false);
  const [scanRec,        setScanRec]        = useState<string | null>(null);
  const [scanError,      setScanError]      = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);
  const [conflictMatch,  setConflictMatch]  = useState<{ roaster: string; bag_name?: string; origin: string } | null>(null);
  const [activeEquipmentId, setActiveEquipmentId] = useState('');
  const [equipmentLabel,    setEquipmentLabel]    = useState<string | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem('activeEquipmentId') || '';
    setActiveEquipmentId(id);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch('/api/equipment', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((r) => r.json())
        .then((list: { id: string; machine_name: string; grinder_name?: string | null }[]) => {
          if (!Array.isArray(list) || !list.length) return;
          const active = (id && list.find((e) => e.id === id)) || list[0];
          setEquipmentLabel(
            active.grinder_name
              ? `${active.machine_name} + ${active.grinder_name}`
              : active.machine_name,
          );
        })
        .catch(() => {});
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
      if (activeEquipmentId) fd.append('activeEquipmentId', activeEquipmentId);
      const res = await fetch('/api/scan-bag', { method: 'POST', body: fd, headers: await authHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setScanError((body as { error?: string }).error || `Scan failed (${res.status}) — please try again`);
        return;
      }
      const { scan, recommendation } = await res.json();
      setForm((f) => ({
        ...f,
        roaster:  scan.roaster  || f.roaster,
        bag_name: scan.bag_name || f.bag_name,
        origin:   scan.origin   || f.origin,
      }));
      setScanRec(recommendation);
    } finally {
      setScanning(false);
    }
  }

  async function saveBag(force = false) {
    if (!form.origin.trim() || !form.roaster.trim()) return;
    setSaving(true);
    setSaveError(null);
    setConflictMatch(null);
    try {
      const res = await fetch('/api/beans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          origin:       form.origin.trim(),
          roaster:      form.roaster.trim(),
          bag_name:     form.bag_name.trim()    || null,
          roast_date:   new Date().toISOString().split('T')[0],
          is_active:    true,
          price_paid:   form.price_paid   ? parseFloat(form.price_paid)   : null,
          weight_grams: form.weight_grams ? parseFloat(form.weight_grams) : null,
          ...(force ? { force: true } : {}),
        }),
      });
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        setConflictMatch((body as { match?: { roaster: string; bag_name?: string; origin: string } }).match ?? { roaster: form.roaster.trim(), origin: form.origin.trim() });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError((body as { error?: string }).error || 'Failed to save — please try again');
        return;
      }
      router.push('/beans');
    } finally {
      setSaving(false);
    }
  }

  const cameraIcon = (
    <svg className="w-5 h-5 text-[#7A6858]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );

  const canSave = form.roaster.trim().length > 0 && form.origin.trim().length > 0;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/" className="text-[#7A6858] text-sm font-bold hover:text-[#2C1E16] transition-colors">
          ←
        </Link>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A6858]">New arrival</p>
          <h1 className="text-[#2C1E16] font-black text-2xl tracking-tight leading-none">Fresh Beans</h1>
        </div>
      </div>

      {/* ── Scan section ── */}
      <div className="glass rounded-3xl p-5 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-1">Step 1 — Scan the bag</p>
          <p className="text-[#2C1E16]/60 text-xs">Take a photo of the front (and optionally the back) to auto-fill details and get a personalised recipe.</p>
          <div className="mt-2 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#7A6858] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            {equipmentLabel ? (
              <p className="text-[10px] text-[#7A6858]">Recipe for <span className="font-bold text-[#5D4037]">{equipmentLabel}</span></p>
            ) : (
              <p className="text-[10px] text-[#7A6858]/70">No equipment set — <a href="/settings" className="underline text-[#5D4037]">add one in Settings</a> for a personalised recipe</p>
            )}
          </div>
        </div>

        {/* Two image slots */}
        <div className="flex gap-3">
          {/* Front */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => frontRef.current?.click()}
              disabled={scanning}
              className="w-full aspect-square rounded-xl border border-dashed border-[#C8B49A] bg-[#F5EBD8] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation overflow-hidden"
            >
              {scanFront ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scanFront.preview} alt="Front" className="w-full h-full object-cover" />
              ) : (
                <>{cameraIcon}<span className="text-[10px] font-bold uppercase tracking-widest text-[#7A6858]">Front</span></>
              )}
            </button>
            {scanFront && (
              <button
                type="button"
                onClick={() => { setScanFront(null); setScanRec(null); }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2C1E16]/70 flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
            <input ref={frontRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage('front', f); e.target.value = ''; }} />
          </div>

          {/* Back */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => backRef.current?.click()}
              disabled={scanning}
              className="w-full aspect-square rounded-xl border border-dashed border-[#C8B49A] bg-[#F5EBD8] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation overflow-hidden"
            >
              {scanBack ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scanBack.preview} alt="Back" className="w-full h-full object-cover" />
              ) : (
                <>{cameraIcon}<span className="text-[10px] font-bold uppercase tracking-widest text-[#7A6858]">Back (opt.)</span></>
              )}
            </button>
            {scanBack && (
              <button
                type="button"
                onClick={() => { setScanBack(null); setScanRec(null); }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2C1E16]/70 flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
            <input ref={backRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectImage('back', f); e.target.value = ''; }} />
          </div>
        </div>

        {/* Scan button */}
        {scanFront && (
          <button
            type="button"
            onClick={submitScan}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 bg-[#F5EBD8] border border-[#C8B49A] text-[#2C1E16] font-bold py-3 rounded-xl text-sm uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
          >
            {scanning ? <><Spinner /><span>Scanning…</span></> : <span>Scan Bag</span>}
          </button>
        )}

        {/* Error */}
        {scanError && !scanning && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-600 text-sm font-medium">{scanError}</p>
          </div>
        )}

        {/* Personalised recommendation */}
        {scanRec && !scanning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-2">Your Recipe</p>
            <p className="text-amber-900 text-sm leading-relaxed">{scanRec}</p>
          </div>
        )}
      </div>

      {/* ── Details form ── */}
      <div className="glass rounded-3xl p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Step 2 — Confirm details</p>

        <div>
          <Label>Bag Name</Label>
          <input type="text" placeholder="e.g. Sunrise Blend" value={form.bag_name}
            onChange={(e) => setForm((f) => ({ ...f, bag_name: e.target.value }))}
            className={INPUT} style={{ fontSize: '16px' }} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label>Roaster *</Label>
            <input type="text" placeholder="e.g. Onyx" value={form.roaster}
              onChange={(e) => setForm((f) => ({ ...f, roaster: e.target.value }))}
              className={INPUT} style={{ fontSize: '16px' }} />
          </div>
          <div>
            <Label>Origin *</Label>
            <input type="text" placeholder="e.g. Ethiopia" value={form.origin}
              onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
              className={INPUT} style={{ fontSize: '16px' }} />
          </div>
          <div>
            <Label>Price (₪)</Label>
            <input type="text" inputMode="decimal" placeholder="85" value={form.price_paid}
              onChange={(e) => setForm((f) => ({ ...f, price_paid: e.target.value }))}
              className={`${INPUT} readout`} style={{ fontSize: '16px' }} />
          </div>
          <div>
            <Label>Weight (g)</Label>
            <input type="text" inputMode="numeric" placeholder="250" value={form.weight_grams}
              onChange={(e) => setForm((f) => ({ ...f, weight_grams: e.target.value }))}
              className={`${INPUT} readout`} style={{ fontSize: '16px' }} />
          </div>
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-600 text-sm font-medium">{saveError}</p>
          </div>
        )}

        {conflictMatch && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
            <p className="text-amber-800 text-sm font-semibold">
              Similar bean already in your list:{' '}
              <span className="font-black">
                {conflictMatch.roaster}{conflictMatch.bag_name ? ` · ${conflictMatch.bag_name}` : ''} ({conflictMatch.origin})
              </span>
            </p>
            <p className="text-amber-700 text-xs">This is a different bag? Tap below to save it anyway.</p>
            <button
              type="button"
              onClick={() => saveBag(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
            >
              {saving ? <><Spinner /><span>Saving…</span></> : <span>Save Anyway</span>}
            </button>
          </div>
        )}

        {!conflictMatch && (
        <button
          type="button"
          onClick={() => saveBag()}
          disabled={saving || !canSave}
          className="w-full flex items-center justify-center gap-2 bg-[#5D4037] text-[#FFFBF4] font-black uppercase tracking-widest py-4 rounded-2xl text-sm shadow-lg shadow-[#5D4037]/25 active:scale-95 transition-all disabled:opacity-40 touch-manipulation"
        >
          {saving ? <><Spinner /><span>Saving…</span></> : <span>Save to My Inventory</span>}
        </button>
        )}
      </div>

    </div>
  );
}
