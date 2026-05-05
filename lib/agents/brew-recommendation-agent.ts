import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BagScanResult } from '../types';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function getStartupRecommendation(bean: BagScanResult): Promise<string> {
  if (!genAI) return 'AI configuration missing.';

  const prompt = `You are Dialed, a professional barista coach. Based on the coffee bag details below, give a first-shot starting point for a barista opening this bag for the first time.

Rules:
- Exactly 2 sentences. No more.
- Sentence 1: Recommend the ideal brew method for these beans and briefly explain why.
- Sentence 2: Give specific starting parameters (dose, yield, time, or temperature depending on method).
- Tone: Direct and confident. No fluff.
- Plain text only. No markdown, no quotation marks, no bolding.

Bean details:
- Roaster: ${bean.roaster || 'Unknown'}
- Name: ${bean.bag_name || 'Unknown'}
- Origin: ${bean.origin || 'Unknown'}
- Process: ${bean.process || 'Unknown'}
- Tasting notes: ${bean.tasting_notes || bean.notes || 'Not listed'}`;

  async function callModel(modelName: string) {
    const model = genAI!.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/["""'']/g, '');
  }

  try {
    return await callModel(PRIMARY_MODEL);
  } catch {
    try {
      return await callModel(FALLBACK_MODEL);
    } catch {
      return 'Startup recommendation unavailable.';
    }
  }
}
