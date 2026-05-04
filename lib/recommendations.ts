import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Shot } from './types';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

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

export async function analyzeShot(shot: Shot, trendSummary: string = ''): Promise<string> {
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

  const prompt = `You are Dialed, a professional barista coach. Analyze this espresso shot and give a sharp, actionable recommendation.

Rules:
- Exactly 2 sentences. No more.
- Sentence 1: Diagnose what went wrong (or confirm it is dialled in).
- Sentence 2: One specific adjustment — grind setting, dose, yield, or temperature.
- Tone: Direct and confident. No fluff, no filler words.
- Plain text only. No markdown, no quotation marks, no bolding.

Shot metrics:
- Dose: ${shot.dose}g | Yield: ${shot.yield}g | Ratio: ${ratio}
- Extraction time: ${shot.extraction_time}s
- Brew temp: ${shot.brew_temp ?? 'not recorded'}°C
- Flavor: ${shot.flavor_tags?.join(', ') || 'none tagged'}
- Score: ${shot.overall_score ?? 'not scored'}/10
- Notes: ${shot.notes || 'none'}

${trendBlock}`;

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
