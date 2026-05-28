import { streamText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),
    system:
      "You are DIALED's BrewAgent, a professional specialty coffee assistant. Always reply in English, even if the user prompts in another language.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
