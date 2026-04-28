import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeShot } from '@/lib/recommendations';
import type { Shot } from '@/lib/types';

export async function GET() {
  const { data, error } = await supabase
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data: recentShots } = await supabase
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: shot, error } = await supabase
    .from('shots')
    .insert({
      dose: body.dose,
      yield: body.yield,
      extraction_time: body.extraction_time,
      brew_temp: body.brew_temp ?? null,
      flavor_tags: body.flavor_tags ?? [],
      overall_score: body.overall_score ?? null,
      notes: body.notes ?? null,
      bean_id: body.bean_id ?? null,
      equipment_id: body.equipment_id ?? null,
      grind_setting: body.grind_setting ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recommendation = analyzeShot(shot as Shot, (recentShots ?? []) as Shot[]);

  return NextResponse.json({ shot, recommendation }, { status: 201 });
}
