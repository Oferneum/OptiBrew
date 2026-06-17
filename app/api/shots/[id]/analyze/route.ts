import { getRequestClient } from '@/lib/supabase';
import { streamAnalysis } from '@/lib/recommendations';
import { getShotContext } from '@/lib/context-builder';
import { aiLimiter, isRateLimited } from '@/lib/rate-limit';
import { fetchMcpKnowledgeBlock } from '@/lib/mcp';
import type { Shot } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return new Response('Unauthorized', { status: 401 });

  // H3-fix: per-user rate limit (10 AI requests / 10 min)
  if (await isRateLimited(aiLimiter, `ai:${user.id}`)) {
    return new Response('Too many requests — please wait a few minutes before trying again.', { status: 429 });
  }

  const { data: shot, error: fetchErr } = await db
    .from('shots').select('*, beans(roaster, origin, bag_name)').eq('id', id).eq('user_id', user.id).single();
  if (!shot || fetchErr) return new Response('Shot not found', { status: 404 });

  const [{ recentShots, trendSummary, grindTarget, brewParamTarget }, mcpContext] = await Promise.all([
    getShotContext(shot.bean_id, shot.equipment_id, user.id, { tiered: true }),
    fetchMcpKnowledgeBlock(shot.id, user.id),
  ]);

  let weatherContext: string | undefined;
  if (shot.bean_id && shot.humidity != null && shot.ambient_temp != null) {
    const { data: rows } = await db
      .from('shots')
      .select('humidity, ambient_temp')
      .eq('bean_id', shot.bean_id)
      .gte('overall_score', 7)
      .not('humidity', 'is', null)
      .not('ambient_temp', 'is', null)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(1);
    const baseline = rows?.[0];
    if (baseline) {
      const dH = Math.round((shot.humidity as number) - (baseline.humidity as number));
      const dT = Math.round(((shot.ambient_temp as number) - (baseline.ambient_temp as number)) * 10) / 10;
      const parts: string[] = [];
      if (Math.abs(dH) > 15)
        parts.push(`humidity is ${Math.abs(dH)}% ${dH > 0 ? 'higher' : 'lower'} than their last good shot`);
      if (Math.abs(dT) > 7)
        parts.push(`temperature is ${Math.abs(dT)}°C ${dT > 0 ? 'warmer' : 'cooler'} than their last good shot`);
      if (parts.length)
        weatherContext = `Weather delta: ${parts.join('; ')}. Translate into extraction impact.`;
    }
  }

  const gen = streamAnalysis(shot as Shot, recentShots, trendSummary ?? '', weatherContext, undefined, undefined, grindTarget, brewParamTarget, mcpContext);
  const accumulated: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of gen) {
          accumulated.push(chunk);
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.error(new Error('Stream failed'));
        return;
      }
      controller.close();

      const full = accumulated.join('').trim();
      if (full && !full.includes('unavailable') && !full.includes('cooling down') && !full.includes('configuration missing')) {
        await db.from('shots').update({ recommendation: full }).eq('id', id).eq('user_id', user.id);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
