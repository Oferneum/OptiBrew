import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BagScanResult, UserContext } from '../types';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function getStartupRecommendation(
  bean: BagScanResult,
  userContext?: UserContext,
  weatherContext?: string,
): Promise<string> {
  if (!genAI) return 'AI configuration missing.';

  // Build equipment context
  let equipmentLine: string;
  if (userContext?.equipment?.length) {
    const gear = userContext.equipment
      .map((e) => e.grinder_name ? `${e.machine_name} with ${e.grinder_name}` : e.machine_name)
      .join(', ');
    equipmentLine = `User's equipment: ${gear}. Give machine-specific parameters (e.g. PID temp, pre-infusion, dose for their basket size).`;
  } else {
    equipmentLine = 'No equipment data — recommend the best brew method for these beans with generic high-quality parameters.';
  }

  // Build taste history context
  let tasteLine = '';
  if (userContext?.recentBeans?.length) {
    const history = userContext.recentBeans
      .map((b) => b.bag_name ? `${b.roaster} ${b.bag_name} (${b.origin})` : `${b.roaster} (${b.origin})`)
      .join(', ');
    tasteLine = `\nUser's recent coffee history: ${history}. If this new bag differs meaningfully (origin, process, roast level), briefly acknowledge the contrast in sentence 2.`;
  }

  const weatherLine = weatherContext ? `\nCurrent ambient conditions: ${weatherContext}.
Weather extraction rules (apply only when conditions are extreme — otherwise skip):
- Humidity >75%: beans absorb ambient moisture, swell, and flow slower → suggest going 0.5–1 click coarser to compensate for the slower extraction.
- Humidity <35%: beans are dry and dense, extract faster than usual → suggest going 0.5 click finer.
- Temperature >30°C: ambient heat accelerates extraction; consider reducing pre-infusion by 1–2s.
- Temperature <15°C: equipment thermalises slowly; recommend an extra 30–60s warm-up purge.
- If current conditions are extreme, weave the adjustment naturally into sentence 2 (do not mention "humidity" or "temperature" explicitly — say things like "given the humid conditions today" or "in this heat").
- If conditions are normal (35–75% humidity, 15–30°C): ignore weather entirely.` : '';

  const prompt = `You are Dialed, a personal barista consultant. Based on the details below, give a first-shot recommendation tailored to this specific user.

Rules:
- Exactly 2 sentences. No more.
- Sentence 1: State specific starting brew parameters for the user's equipment. If you recognise the machine (e.g. Lelit Anna, Gaggia Classic, Flair 58), give machine-specific guidance (PID setting, pre-infusion time, dose, yield, shot time). If no equipment, recommend the best brew method with starting parameters.
- Sentence 2: If weather conditions are extreme (see below), weave in the adjustment. Otherwise if the user's taste history is relevant, briefly acknowledge how this bag compares. Otherwise, give one key technique tip specific to these beans.
- Always use Celsius. Never Fahrenheit.
- Tone: Direct, confident, personal — like a coach who knows you. No fluff.
- Plain text only. No markdown, no quotation marks, no bolding.
${weatherLine}

${equipmentLine}${tasteLine}

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
