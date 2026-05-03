import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ['roaster', 'origin', 'roast_date', 'price_paid', 'weight_grams', 'is_active', 'notes'];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k)),
  );

  const { data, error } = await supabase
    .from('beans')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
