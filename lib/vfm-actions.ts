'use server';

import { cache } from 'react';
import { z } from 'zod';
import { supabase } from './supabase';
import { computeCostPerShot, computeVFM } from './analytics';

export interface BeanVFMData {
  id: string;
  roaster: string;
  origin: string;
  shotCount: number;
  avgScore: number | null;
  costPerShot: number | null;
  vfm: number | null;
  isActive: boolean;
  price_paid: number | null;
  weight_grams: number | null;
  roast_date: string;
}

const RpcRowSchema = z.object({
  id:           z.uuid(),
  roaster:      z.string(),
  origin:       z.string(),
  is_active:    z.boolean(),
  price_paid:   z.number().nullable(),
  weight_grams: z.number().nullable(),
  roast_date:   z.string().nullable(),
  shot_count:   z.number(),
  avg_score:    z.number().nullable(),
  avg_dose:     z.number().nullable(),
});

const RpcResponseSchema = z.array(RpcRowSchema);

export const fetchBeansWithVFM = cache(async (): Promise<BeanVFMData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_beans_with_stats');

    if (error) throw error;

    const rows = RpcResponseSchema.parse(data);

    return rows.map((row) => {
      const avgDose     = row.avg_dose ?? 18;
      const costPerShot =
        row.price_paid && row.weight_grams
          ? computeCostPerShot(row.price_paid, row.weight_grams, avgDose)
          : null;
      const vfm =
        row.avg_score != null && row.price_paid && row.weight_grams
          ? computeVFM(row.avg_score, row.price_paid, row.weight_grams, avgDose)
          : null;

      return {
        id:           row.id,
        roaster:      row.roaster,
        origin:       row.origin,
        shotCount:    row.shot_count,
        avgScore:     row.avg_score,
        costPerShot,
        vfm,
        isActive:     row.is_active,
        price_paid:   row.price_paid,
        weight_grams: row.weight_grams,
        roast_date:   row.roast_date ?? '',
      };
    });
 } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[Zod Validation Error]', JSON.stringify(err.issues, null, 2));
    } else if (err instanceof Error) {
      console.error('[fetchBeansWithVFM Error]', err.message);
    } else {
      console.error('[fetchBeansWithVFM Raw Error]', JSON.stringify(err, null, 2));
    }
    return [];
  }
});
