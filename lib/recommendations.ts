import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Shot } from './types';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'; // gemini-1.5-flash was deprecated (404)

// GEMINI_API_KEY only — never NEXT_PUBLIC_ (would expose key in client bundle)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function isFallbackWorthy(err: unknown): boolean {
  const e = err as Record<string, unknown>;
  const status  = e?.status as number | undefined;
  const message = String(e?.message ?? '').toLowerCase();
  return (
    status === 503 ||
    message.includes('temporarily unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded')
  );
}

async function callModel(modelName: string, prompt: string): Promise<string> {
  const model  = genAI!.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim().replace(/["""'']/g, '');
}

export async function analyzeShot(shot: Shot, trendSummary: string = '', weatherContext?: string): Promise<string> {
  if (!genAI) {
    console.error('[Dialed AI] GEMINI_API_KEY is not set');
    return 'AI configuration missing.';
  }

  const ratio = shot.dose && shot.yield
    ? `1:${(shot.yield / shot.dose).toFixed(2)}`
    : 'unknown';

  const trendBlock = trendSummary
    ? `Recent trend: ${trendSummary}`
    : 'No previous shots on record for this bean/equipment combination.';

  const weatherBlock = weatherContext ? `\nAmbient conditions when this shot was pulled: ${weatherContext}.
Weather context rules (apply only when extreme — otherwise ignore entirely):
- Humidity >75%: beans absorb moisture and swell, slowing extraction — factor this into your diagnosis if the shot ran long or under-extracted.
- Humidity <35%: beans are dry and dense, extracting faster than usual — factor this in if the shot ran short or over-extracted.
- Temperature >30°C: ambient heat accelerates extraction and affects equipment temperature stability.
- Temperature <15°C: cold equipment thermalises slowly — relevant if the shot was inconsistent early on.
- If conditions are extreme, weave the environmental context naturally into your diagnosis without stating exact numbers.
- If conditions are normal (35–75% humidity, 15–30°C): ignore weather entirely.` : '';

  const prompt = `You are Dialed, a professional barista coach. Analyze this shot and give a sharp, personalized 2-sentence response.

CRITICAL RULE — THE USER'S SCORE IS THE ULTIMATE SOURCE OF TRUTH:
- If overall_score is 8, 9, or 10: the shot was a SUCCESS. Do NOT suggest drastic changes, do NOT say anything is wrong, do NOT call it under/over-extracted just because a parameter looks unusual. Instead: sentence 1 validates their result and explains why this specific recipe is working for their palate (e.g., acknowledging the beans, flavor profile, or technique). Sentence 2 suggests one optional micro-refinement, or simply confirms it is dialled in.
- If overall_score is 6 or 7: mild improvement territory. Be encouraging. Sentence 1 acknowledges what is working. Sentence 2 gives one gentle adjustment.
- If overall_score is 5 or below, or not scored: diagnose and adjust normally.
- ALWAYS read the Notes field — if the user wrote positive feedback ("great shot", "loved it", etc.), treat the shot as a success regardless of score.

Additional rules:
- Exactly 2 sentences. No more.
- Tone: Direct, warm, and confident. Like a coach who trusts the barista's palate.
- Plain text only. No markdown, no quotation marks, no bolding.
- Always use Celsius.

Shot data:
- USER SCORE: ${shot.overall_score ?? 'not scored'}/10  ← read this first
- USER NOTES: "${shot.notes || 'none'}"  ← read this second
- Dose: ${shot.dose}g | Yield: ${shot.yield}g | Ratio: ${ratio}
- Extraction time: ${shot.extraction_time}s
- Brew temp: ${shot.brew_temp ?? 'not recorded'}°C
- Flavor tags: ${shot.flavor_tags?.join(', ') || 'none tagged'}

${trendBlock}${weatherBlock}`;

  // ── Primary: gemini-2.5-flash ──────────────────────────────────────────
  try {
    return await callModel(PRIMARY_MODEL, prompt);
  } catch (primaryErr: unknown) {
    if (isFallbackWorthy(primaryErr)) {
      console.warn(
        `[Dialed AI] ${PRIMARY_MODEL} unavailable (status ${(primaryErr as Record<string,unknown>)?.status}) — falling back to ${FALLBACK_MODEL}`,
      );
    } else {
      // Non-503 error on primary — still try the fallback, but log the full detail
      const e = primaryErr as Record<string, unknown>;
      console.error('[Dialed AI] primary model error');
      console.error('  message   :', e?.message);
      console.error('  status    :', e?.status);
      console.error('  statusText:', e?.statusText);
      console.error('  full      :', JSON.stringify(primaryErr, Object.getOwnPropertyNames(primaryErr)));
    }
  }

  // ── Fallback: gemini-1.5-flash ─────────────────────────────────────────
  try {
    return await callModel(FALLBACK_MODEL, prompt);
  } catch (fallbackErr: unknown) {
    const e = fallbackErr as Record<string, unknown>;
    console.error('[Dialed AI] fallback model also failed');
    console.error('  message   :', e?.message);
    console.error('  status    :', e?.status);
    console.error('  full      :', JSON.stringify(fallbackErr, Object.getOwnPropertyNames(fallbackErr)));

    const status = e?.status as number | undefined;
    if (status === 429) return 'Dialed is cooling down — try again in a moment.';
    return 'Analysis temporarily unavailable.';
  }
}
