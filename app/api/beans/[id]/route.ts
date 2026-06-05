import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';

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

  const db = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.json();
  const parsed = BeanUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allowed = new Set(['roaster', 'bag_name', 'origin', 'roast_date', 'price_paid', 'weight_grams', 'is_active', 'notes']);
  const update = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([k]) => allowed.has(k)),
  );

  // RLS enforces ownership — only the bean's owner can update it.
  const { data, error } = await db
    .from('beans')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  return NextResponse.json(data);
}
