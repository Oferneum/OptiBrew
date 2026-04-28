'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { EquipmentProfile } from '@/lib/types';

function SetupDisplay({ equipment, grindSetting }: { equipment: EquipmentProfile; grindSetting: string | null }) {
  return (
    <Link href="/settings" className="block glass-display rounded-2xl overflow-hidden hover:border-crema/30 transition-colors">
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-crema/10">
        <span className="status-dot w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
        <p className="text-crema/50 text-xs font-semibold tracking-[0.25em] uppercase flex-1">Current Rig</p>
        <span className="text-stone-600 text-xs">tap to change →</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Machine</p>
          <p className="text-stone-100 font-semibold text-base leading-tight">{equipment.machine_name}</p>
        </div>

        {equipment.grinder_name && (
          <>
            <div className="h-px bg-crema/8" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Grinder</p>
                <p className="text-stone-100 font-semibold text-base leading-tight">{equipment.grinder_name}</p>
              </div>
              {grindSetting && (
                <div className="text-right">
                  <p className="text-stone-600 text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Last Setting</p>
                  <p className="readout text-crema font-bold text-3xl leading-none tracking-tight">{grindSetting}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function SetupPrompt() {
  return (
    <Link
      href="/settings"
      className="glass-display block rounded-2xl px-5 py-5 hover:border-crema/35 transition-colors"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
        <p className="text-stone-500 text-xs font-semibold tracking-[0.25em] uppercase">No Rig Configured</p>
      </div>
      <p className="text-stone-100 font-semibold text-base mb-1">Set up your equipment</p>
      <p className="text-stone-500 text-sm">Add your machine and grinder to track grind settings and get better recommendations.</p>
      <p className="text-crema text-sm font-medium mt-3">Configure now →</p>
    </Link>
  );
}

export default function ActiveEquipmentCard() {
  const [equipment, setEquipment] = useState<EquipmentProfile | null>(null);
  const [grindSetting, setGrindSetting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('activeEquipmentId');
    if (!id) { setMounted(true); return; }

    supabase
      .from('equipment_profiles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data: eq }) => {
        if (!eq) { setMounted(true); return; }
        setEquipment(eq as EquipmentProfile);

        // Fetch last grind setting used with this equipment
        supabase
          .from('shots')
          .select('grind_setting')
          .eq('equipment_id', id)
          .not('grind_setting', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data: shots }) => {
            setGrindSetting(shots?.[0]?.grind_setting ?? null);
            setMounted(true);
          });
      });
  }, []);

  if (!mounted) return null;

  return equipment
    ? <SetupDisplay equipment={equipment} grindSetting={grindSetting} />
    : <SetupPrompt />;
}
