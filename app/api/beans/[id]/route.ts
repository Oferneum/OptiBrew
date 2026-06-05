import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthClient } from '@/lib/supabase';

const BeanUpdateSchema = z.object({
  roaster:      z.string().min(1).max(200).optional(),
  bag_name:     z.string().max(200).optional().nullable(),
  origin:       z.string().min(1).max(200).optional(),
  roast_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  price_paid:   z.number().min(0).max(100_000).optional().nullable(),
  weight_grams: z.number().min(1).max(10_000).optional().nullable(),
  is_active:    z.boolean().optional(),
  notes:        z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  console.log('Token status:', !!token, '| token prefix:', token?.slice(0, 20));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAuthClient(token);

  const { data: { user }, error: authError } = await db.auth.getUser();
  console.log('User status:', !!user, '| auth error:', authError?.message ?? 'none');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json();

  const parsed = BeanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allowed = new Set(['roaster', 'bag_name', 'origin', 'roast_date', 'price_paid', 'weight_grams', 'is_active', 'notes']);
  const update = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([k]) => allowed.has(k)),
  );

  const { error: updateError } = await db
    .from('beans')
    .update(update)
    .eq('id', id);

  console.log('Update error:', updateError?.message ?? 'none');
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data, error: selectError } = await db
    .from('beans')
    .select('*')
    .eq('id', id)
    .single();

  console.log('Post-update select — data:', !!data, '| select error:', selectError?.message ?? 'none');
  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });
  return NextResponse.json(data);
}
