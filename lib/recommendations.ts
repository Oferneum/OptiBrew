import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Shot } from './types';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

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

// ── Shared prompt builder ──────────────────────────────────────────────────────
// Used by both the blocking analyzeShot and the streaming streamAnalysis so
// the prompt stays consistent regardless of which path runs.

function buildPrompt(
  shot: Shot,
  trendSummary: string,
  weatherContext?: string,
  basketName?: string | null,
): string {
  const ratio = shot.dose && shot.yield
    ? `1:${(shot.yield / shot.dose).toFixed(2)}`
    : 'unknown';

  const brewMethod = shot.brew_method ?? 'Espresso';
  const isEspresso = brewMethod === 'Espresso' || brewMethod === 'MokaPot';

  const trendBlock = trendSummary
    ? `Recent trend: ${trendSummary}`
    : 'No previous shots on record for this bean/equipment combination.';

  const weatherBlock = weatherContext
    ? `\nEnvironmental context: ${weatherContext} — weave this naturally into your diagnosis as an extraction factor; do not repeat the numbers verbatim.`
    : '';

  const basketBlock = basketName
    ? `\nEquipment note: The user has a ${basketName} precision basket installed. Precision baskets (IMS, VST, Pullman, Pesado, Weber, Wafo, etc.) have tighter tolerances and often higher flow rates than stock baskets. Do NOT penalize slightly faster extraction times (e.g. 22–26s for espresso) if the taste score is high — this is expected and desirable behavior with a precision basket.`
    : '';

  const brewMethodBlock = !isEspresso
    ? `\nBREW METHOD OVERRIDE — This is ${brewMethod}, NOT espresso. Do NOT apply espresso constraints (30s extraction time, 1:2 yield ratio). Adjust your analysis:
- ColdBrew: the primary time metric is steep_time_hours (below). If < 12 hours, likely under-extracted (weak, watery); if > 24 hours, may be over-extracted (bitter, astringent). Target 14–18 hours for a balanced concentrate. Focus on steep duration, coarse grind, and cold-water ratio.
- FrenchPress: focus on 4-minute steep, coarse grind, and immersion ratio.
- MokaPot: pressurised brew with shorter time expectations; standard Moka parameters apply.`
    : '';

  return `You are Dialed, a professional barista coach. Analyze this shot and give a sharp, personalized 2-sentence response.

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
- Brew method: ${brewMethod}
- Dose: ${shot.dose}g | Yield: ${shot.yield}g | Ratio: ${ratio}
- Extraction time: ${brewMethod === 'ColdBrew' ? `${shot.steep_time_hours ?? 'not recorded'} hours (steep time)` : `${shot.extraction_time ?? 'not recorded'}s`}
- Brew temp: ${shot.brew_temp ?? 'not recorded'}°C
- Flavor tags: ${shot.flavor_tags?.join(', ') || 'none tagged'}

${trendBlock}${weatherBlock}${basketBlock}${brewMethodBlock}`;
}

// ── Blocking analyzeShot (kept for reanalyze compat) ──────────────────────────

async function callModel(modelName: string, prompt: string): Promise<string> {
  const model  = genAI!.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim().replace(/["""'']/g, '');
}

const ANALYSIS_TIMEOUT_MS = 12_000;

export async function analyzeShot(
  shot: Shot,
  trendSummary: string = '',
  weatherContext?: string,
  basketName?: string | null,
): Promise<string> {
  if (!genAI) {
    console.error('[Dialed AI] GEMINI_API_KEY is not set');
    return 'AI configuration missing.';
  }

  const prompt = buildPrompt(shot, trendSummary, weatherContext, basketName);

  async function runWithFallback(): Promise<string> {
    try {
      return await callModel(PRIMARY_MODEL, prompt);
    } catch (primaryErr: unknown) {
      if (isFallbackWorthy(primaryErr)) {
        console.warn(`[Dialed AI] ${PRIMARY_MODEL} unavailable — falling back to ${FALLBACK_MODEL}`);
      } else {
        const e = primaryErr as Record<string, unknown>;
        console.error('[Dialed AI] primary model error', e?.message, e?.status);
      }
    }
    try {
      return await callModel(FALLBACK_MODEL, prompt);
    } catch (fallbackErr: unknown) {
      const e = fallbackErr as Record<string, unknown>;
      console.error('[Dialed AI] fallback also failed', e?.message, e?.status);
      const status = e?.status as number | undefined;
      if (status === 429) return 'Dialed is cooling down — try again in a moment.';
      return 'Analysis temporarily unavailable.';
    }
  }

  return Promise.race([
    runWithFallback(),
    new Promise<string>((resolve) =>
      setTimeout(() => resolve('Analysis temporarily unavailable.'), ANALYSIS_TIMEOUT_MS),
    ),
  ]);
}

// ── Streaming streamAnalysis ───────────────────────────────────────────────────
// Yields text chunks from Gemini as they arrive. Used by the /analyze route
// which pipes them directly to the client, so the browser renders the analysis
// progressively instead of waiting for the full response.

export async function* streamAnalysis(
  shot: Shot,
  trendSummary: string = '',
  weatherContext?: string,
  basketName?: string | null,
): AsyncGenerator<string> {
  if (!genAI) {
    yield 'AI configuration missing.';
    return;
  }

  const prompt = buildPrompt(shot, trendSummary, weatherContext, basketName);

  async function* tryStream(modelName: string): AsyncGenerator<string> {
    const model  = genAI!.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text.replace(/["""'']/g, '');
    }
  }

  try {
    yield* tryStream(PRIMARY_MODEL);
    return;
  } catch (primaryErr: unknown) {
    if (!isFallbackWorthy(primaryErr)) {
      console.error('[Dialed AI] streaming primary failed', primaryErr);
      yield 'Analysis temporarily unavailable.';
      return;
    }
    console.warn(`[Dialed AI] streaming fallback to ${FALLBACK_MODEL}`);
  }

  try {
    yield* tryStream(FALLBACK_MODEL);
  } catch (fallbackErr: unknown) {
    const e = fallbackErr as Record<string, unknown>;
    console.error('[Dialed AI] streaming fallback also failed', e?.message);
    const status = e?.status as number | undefined;
    yield status === 429
      ? 'Dialed is cooling down — try again in a moment.'
      : 'Analysis temporarily unavailable.';
  }
}
