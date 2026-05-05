'use server';

import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { supabase } from './supabase';
import { computeCostPerShot, computeVFM } from './analytics';
import { computeBestBrewMethod } from './agents/community-analytics-agent';
import type { CommunityMethodResult } from './types';

export interface BeanVFMData {
  id: string;
  roaster: string;
  bag_name: string | null;
  origin: string;
  shotCount: number;
  avgScore: number | null;
  costPerShot: number | null;
  vfm: number | null;
  isActive: boolean;
  price_paid: number | null;
  weight_grams: number | null;
  roast_date: string;
  community_method: CommunityMethodResult | null;
}

export const fetchBeansWithVFM = cache(async (): Promise<BeanVFMData[]> => {
  // Bypass Next.js data cache — always fetch live data from Supabase
  noStore();

  // ── Beans (global — RLS SELECT USING (true)) ──────────────────────────
  const { data: beansData, error: beansError } = await supabase
    .from('beans')
    .select('id, roaster, bag_name, origin, is_active, price_paid, weight_grams, roast_date')
    .order('created_at', { ascending: false });

  if (beansError) {
    console.error('[fetchBeansWithVFM] beans query error:', beansError.message);
    return [];
  }

  console.log(`[fetchBeansWithVFM] beans fetched: ${beansData?.length ?? 0}`);
  if (!beansData?.length) return [];

  // ── Shots (global — RLS SELECT USING (true)) ──────────────────────────
  const { data: shotsData, error: shotsError } = await supabase
    .from('shots')
    .select('bean_id, overall_score, dose, brew_method')
    .not('bean_id', 'is', null);

  if (shotsError) {
    console.error('[fetchBeansWithVFM] shots query error:', shotsError.message);
  }

  console.log(`[fetchBeansWithVFM] shots fetched: ${shotsData?.length ?? 0}`);

  type ShotRow = { bean_id: string; overall_score: number | null; dose: number | null; brew_method: string | null };
  const shots: ShotRow[] = (shotsData ?? []) as ShotRow[];

  // ── Map shots → beans ─────────────────────────────────────────────────
  const result = beansData.map((bean) => {
    const beanShots  = shots.filter((s) => s.bean_id === bean.id);
    const scoredShots = beanShots.filter((s) => s.overall_score != null);

    const avgScore = scoredShots.length > 0
      ? scoredShots.reduce((sum, s) => sum + (s.overall_score!), 0) / scoredShots.length
      : null;

    const dosedShots = beanShots.filter((s) => (s.dose ?? 0) > 0);
    const avgDose    = dosedShots.length > 0
      ? dosedShots.reduce((sum, s) => sum + s.dose!, 0) / dosedShots.length
      : 18;

    const costPerShot =
      bean.price_paid && bean.weight_grams
        ? computeCostPerShot(bean.price_paid, bean.weight_grams, avgDose)
        : null;

    const vfm =
      avgScore != null && bean.price_paid && bean.weight_grams
        ? computeVFM(avgScore, bean.price_paid, bean.weight_grams, avgDose)
        : null;

    const community_method = computeBestBrewMethod(beanShots);

    return {
      id:               bean.id,
      roaster:          bean.roaster,
      bag_name:         (bean as Record<string, unknown>).bag_name as string | null ?? null,
      origin:           bean.origin,
      shotCount:        beanShots.length,
      avgScore,
      costPerShot,
      vfm,
      isActive:         bean.is_active,
      price_paid:       bean.price_paid,
      weight_grams:     bean.weight_grams,
      roast_date:       bean.roast_date ?? '',
      community_method,
    };
  });

  const ranked = result.filter((b) => b.vfm != null);
  console.log(`[fetchBeansWithVFM] beans with VFM score: ${ranked.length}`);

  return result;
});
