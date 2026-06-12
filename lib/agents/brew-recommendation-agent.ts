import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BagScanResult, UserContext } from '../types';
import { getBeanContext, formatGraphContextBlock } from '../knowledge-graph';

const PRIMARY_MODEL  = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function getStartupRecommendation(
  bean: BagScanResult,
  userContext?: UserContext,
): Promise<string> {
  if (!genAI) return 'AI configuration missing.';

  // Build equipment context
  let equipmentLine: string;
  if (userContext?.equipment?.length) {
    const gear = userContext.equipment
      .map((e) => e.grinder_name ? `${e.machine_name} with ${e.grinder_name}` : e.machine_name)
      .join(', ');
    equipmentLine = `The user brews at home ONLY on: ${gear}. You MUST tailor your recipe recommendation specifically to this equipment. Do NOT mention or recommend any other machine or grinder. Give machine-specific parameters for their exact setup (e.g. PID temp, pre-infusion time, dose for their basket size, grind setting for their grinder).`;
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

  // Fetch graph context (3s timeout — graceful degradation if DB is slow)
  const beanCtx = await Promise.race([
    getBeanContext({
      origin:      bean.origin,
      process:     bean.process,
      machineName: userContext?.equipment?.[0]?.machine_name,
      grinderName: userContext?.equipment?.[0]?.grinder_name ?? undefined,
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
  const graphBlock = beanCtx ? formatGraphContextBlock(beanCtx) : '';

  const prompt = `You are Dialed, a personal barista consultant. Based on the details below, give a first-shot recommendation tailored to this specific user.

Rules:
- Exactly 2 sentences. No more.
- Sentence 1: State specific starting brew parameters for the user's equipment. If you recognise the machine (e.g. Lelit Anna, Gaggia Classic, Flair 58), give machine-specific guidance (PID setting, pre-infusion time, dose, yield, shot time). If no equipment, recommend the best brew method with starting parameters.
- Sentence 2: If the user's taste history is relevant, briefly acknowledge how this bag compares. Otherwise, give one key technique tip specific to these beans.
- Always use Celsius. Never Fahrenheit.
- Tone: Direct, confident, personal — like a coach who knows you. No fluff.
- Plain text only. No markdown, no quotation marks, no bolding.
- If the knowledge graph context below specifies a brew temperature for this origin or process, use that exact number — not a generic range.

${equipmentLine}${tasteLine}${graphBlock}

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
