import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { data, error } = await db
    .from('equipment_profiles')
    .update({ basket_name: body.basket_name ?? null })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
