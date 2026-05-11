import { supabase } from '@/lib/supabase';
import RetryableRecommendation from '@/components/RetryableRecommendation';
import ShotActions from './ShotActions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Shot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ShotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: shot, error } = await supabase
    .from('shots')
    .select('*, beans(*)')
    .eq('id', id)
    .single();

  if (!shot || error) {
    return notFound();
  }

  return (
    <main className="min-h-screen pb-24 p-6 font-sans">
      <div className="max-w-md mx-auto space-y-8">
        <header className="flex items-center justify-between pt-4 pb-2">
          <Link
            href="/shots"
            className="group flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A6858] hover:text-[#2C1E16] transition-colors"
          >
            <span className="text-base">←</span> Back
          </Link>
          <h1 className="text-xl font-black tracking-tight uppercase text-[#2C1E16]">Shot Details</h1>
          <div className="w-12" />
        </header>

        <section className="glass rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-[#7A6858] uppercase tracking-widest">Dose</p>
              <p className="readout text-xl text-[#2C1E16]">{shot.dose}g</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#7A6858] uppercase tracking-widest">Yield</p>
              <p className="readout text-xl text-[#2C1E16]">{shot.yield}g</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#7A6858] uppercase tracking-widest">Time</p>
              <p className="readout text-xl text-[#2C1E16]">{shot.extraction_time}s</p>
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] px-1">
            Dialed AI
          </p>
          <RetryableRecommendation shotId={shot.id} initialRec={shot.recommendation} />
        </div>

        <ShotActions shot={shot as Shot} />
      </div>
    </main>
  );
}
