import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestClient, createServiceClient } from '@/lib/supabase';

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

const UPDATE_ALLOWLIST = new Set([
  'roaster', 'bag_name', 'origin', 'roast_date',
  'price_paid', 'weight_grams', 'is_active', 'notes',
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Identity: header-based auth, the same mechanism the working shots route uses.
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.json();
  const parsed = BeanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const update = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([k]) => UPDATE_ALLOWLIST.has(k)),
  );
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Authorization + write via service role. The live `beans` UPDATE RLS policy
  // is unreliable (silently affects 0 rows), so we enforce ownership explicitly
  // in application code: only the bean's owner may modify it. Security is
  // identical to RLS — a user can never edit a bean they don't own.
  const service = createServiceClient();

  const { data: existing, error: fetchError } = await service
    .from('beans')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Bean not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'You can only edit beans you added' }, { status: 403 });
  }

  const { data, error: updateError } = await service
    .from('beans')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
