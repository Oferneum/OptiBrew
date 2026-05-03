import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Shot } from './types';

// GEMINI_API_KEY only — never NEXT_PUBLIC_ (would expose key in client bundle)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/["""'']/g, '');
  } catch (err: unknown) {
    console.error('[Dialed AI]', err);
    const status = (err as { status?: number }).status;
    if (status === 429) return 'Dialed is cooling down — try again in a moment.';
    if (status === 503) return 'AI service temporarily unavailable.';
    return 'Analysis temporarily unavailable.';
  }
}
