import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, createServiceClient } from '@/lib/supabase';

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
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the JWT by passing it explicitly — avoids session issues on server
  const { data: { user } } = await supabase.auth.getUser(token);
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

  const service = createServiceClient();

  const { data: bean } = await service.from('beans').select('user_id').eq('id', id).single();
  if (!bean) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bean.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error: updateError } = await service
    .from('beans')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(data);
}
