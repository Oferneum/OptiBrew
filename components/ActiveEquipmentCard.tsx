'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { EquipmentProfile } from '@/lib/types';

function SetupDisplay({
  equipment,
  grindSetting,
  lastTemp,
}: {
  equipment: EquipmentProfile;
  grindSetting: string | null;
  lastTemp: number | null;
}) {
  return (
    <Link href="/settings" className="block glass-display rounded-3xl overflow-hidden hover:border-[#C85A32] transition-colors">
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-[#E8E2D9]">
        <span className="status-dot w-1.5 h-1.5 rounded-full bg-green-500" />
        <p className="text-[#8A827A] text-xs font-semibold tracking-[0.25em] uppercase flex-1">Current Rig</p>
        <span className="text-[#8A827A] text-xs">tap to change →</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#8A827A] text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Machine</p>
            <p className="text-[#3C2A21] font-semibold text-base leading-tight">{equipment.machine_name}</p>
          </div>
          {lastTemp != null && (
            <div className="text-right">
              <p className="text-[#8A827A] text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Last Temp</p>
              <p className="readout text-[#C85A32] font-bold text-3xl leading-none tracking-tight">{lastTemp}°C</p>
            </div>
          )}
        </div>

        {equipment.grinder_name && (
          <>
            <div className="h-px bg-[#E8E2D9]" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[#8A827A] text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Grinder</p>
                <p className="text-[#3C2A21] font-semibold text-base leading-tight">{equipment.grinder_name}</p>
              </div>
              {grindSetting && (
                <div className="text-right">
                  <p className="text-[#8A827A] text-[10px] font-medium tracking-[0.2em] uppercase mb-1">Last Setting</p>
                  <p className="readout text-[#C85A32] font-bold text-3xl leading-none tracking-tight">{grindSetting}</p>
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
      className="glass-display block rounded-3xl px-5 py-5 hover:border-[#C85A32] transition-colors"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8A827A]" />
        <p className="text-[#8A827A] text-xs font-semibold tracking-[0.25em] uppercase">No Rig Configured</p>
      </div>
      <p className="text-[#3C2A21] font-semibold text-base mb-1">Set up your equipment</p>
      <p className="text-[#8A827A] text-sm">Add your machine and grinder to track grind settings and get better recommendations.</p>
      <p className="text-[#C85A32] text-sm font-medium mt-3">Configure now →</p>
    </Link>
  );
}

export default function ActiveEquipmentCard() {
  const [equipment, setEquipment] = useState<EquipmentProfile | null>(null);
  const [grindSetting, setGrindSetting] = useState<string | null>(null);
  const [lastTemp, setLastTemp] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('activeEquipmentId');
    if (!id) { setMounted(true); return; }

    supabase
      .from('equipment_profiles')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data: eq }) => {
        if (!eq) { setMounted(true); return; }
        setEquipment(eq as EquipmentProfile);

        const [grindRes, tempRes] = await Promise.all([
          supabase
            .from('shots')
            .select('grind_setting')
            .eq('equipment_id', id)
            .not('grind_setting', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('shots')
            .select('brew_temp')
            .eq('equipment_id', id)
            .not('brew_temp', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        setGrindSetting(grindRes.data?.[0]?.grind_setting ?? null);
        setLastTemp(tempRes.data?.[0]?.brew_temp ?? null);
        setMounted(true);
      });
  }, []);

  if (!mounted) return null;

  return equipment
    ? <SetupDisplay equipment={equipment} grindSetting={grindSetting} lastTemp={lastTemp} />
    : <SetupPrompt />;
}
