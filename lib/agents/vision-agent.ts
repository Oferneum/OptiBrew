import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BagScanResult } from '../types';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export interface ImageInput {
  data:     string; // base64-encoded
  mimeType: string;
}

export async function scanBagImage(images: ImageInput[]): Promise<BagScanResult> {
  if (!genAI) throw new Error('[VisionAgent] GEMINI_API_KEY not set');
  if (images.length === 0) throw new Error('[VisionAgent] No images provided');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imageParts = images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.data },
  }));

  const context = images.length > 1
    ? `You are given ${images.length} photos of the same coffee bag (e.g. front and back). Combine information from all images.`
    : 'You are given a photo of a coffee bag.';

  const prompt = `${context} Extract the details and respond ONLY with a valid JSON object — no markdown, no explanation, no code fences.

{
  "roaster": "the roasting company name",
  "bag_name": "the specific blend or single-origin name on the bag",
  "origin": "country or region of origin",
  "process": "processing method if visible (Washed, Natural, Honey, etc.)",
  "notes": "any producer or processing notes visible on the bag",
  "tasting_notes": "specific flavour descriptors if listed"
}

IMPORTANT: Read "bag_name" as the exact text printed on the bag (e.g. "Red", "Blue", "Summer Blend"). Do NOT infer it from the bag's artwork, colors, or your prior knowledge of the brand. If two photos are provided, trust the image that most clearly shows the product name.
Use empty string "" for any field not visible or unclear. Return only the JSON object.`;

  const result = await model.generateContent([...imageParts, { text: prompt }]);

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
