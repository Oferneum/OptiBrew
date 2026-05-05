import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BagScanResult } from '../types';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function scanBagImage(
  imageBase64: string,
  mimeType: string,
): Promise<BagScanResult> {
  if (!genAI) throw new Error('[VisionAgent] GEMINI_API_KEY not set');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze this coffee bag photo and extract details. Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences.

{
  "roaster": "the roasting company name",
  "bag_name": "the specific blend or single-origin name on the bag",
  "origin": "country or region of origin",
  "process": "processing method if visible (Washed, Natural, Honey, etc.)",
  "notes": "any producer or processing notes visible on the bag",
  "tasting_notes": "specific flavour descriptors if listed"
}

Use empty string "" for any field that is not visible or unclear. Return only the JSON object.`;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ]);

  const raw = result.response
    .text()
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(raw) as BagScanResult;
  } catch {
    console.error('[VisionAgent] JSON parse failed — raw:', raw.slice(0, 200));
    return { roaster: '', bag_name: '', origin: '', process: '', notes: '', tasting_notes: '' };
  }
}
