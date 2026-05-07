import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export interface EquipmentLookupResult {
  name:         string;
  manufacturer: string;
  type:         'machine' | 'grinder' | 'unknown';
  description:  string;
}

export async function lookupEquipment(query: string): Promise<EquipmentLookupResult | null> {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a coffee equipment expert. Given a coffee machine or grinder name/model, return structured data.

Query: "${query}"

Return ONLY a JSON object — no markdown, no code blocks, no explanation:
{"name":"full official product name","manufacturer":"brand name","type":"machine or grinder","description":"one sentence with key specs for espresso dialing (e.g. boiler type, pump pressure, burr size/type, grind steps)"}

type must be exactly "machine", "grinder", or "unknown".
If unrecognised as coffee equipment: {"name":"${query}","manufacturer":"Unknown","type":"unknown","description":"No details found."}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim()
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(raw) as EquipmentLookupResult;
  } catch {
    return null;
  }
}
