import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestClient } from '@/lib/supabase';

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
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
  console.log('[PATCH /api/beans/:id] id=', id, 'has_token=', !!token);

  const db = getRequestClient(req);
  const raw = await req.json();
  console.log('[PATCH /api/beans/:id] payload=', JSON.stringify(raw));

  const parsed = BeanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allowed = new Set(['roaster', 'bag_name', 'origin', 'roast_date', 'price_paid', 'weight_grams', 'is_active', 'notes']);
  const update = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([k]) => allowed.has(k)),
  );

  // Check the row exists and what user_id it has
  const { data: existing } = await db.from('beans').select('id, user_id').eq('id', id).maybeSingle();
  console.log('[PATCH /api/beans/:id] existing row=', JSON.stringify(existing));

  // Check who auth.uid() resolves to for this token
  const { data: { user } } = await db.auth.getUser();
  console.log('[PATCH /api/beans/:id] auth.uid()=', user?.id ?? 'null (anon)');

  const { data, error } = await db
    .from('beans')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle();

  console.log('[PATCH /api/beans/:id] update result data=', JSON.stringify(data), 'error=', error?.message);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No rows updated — RLS blocked or id not found' }, { status: 404 });
  return NextResponse.json(data);
}
