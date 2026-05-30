export const maxDuration = 60;

import { streamText, convertToModelMessages, dynamicTool, jsonSchema, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getMcpClient } from '@/lib/mcp';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type McpContentPart = { type: string; text?: string };

export async function POST(req: Request) {
  const { messages } = await req.json();

  const client = await getMcpClient();

  try {
    const { tools: mcpTools } = await client.listTools();

    const tools = Object.fromEntries(
      mcpTools.map((t) => [
        t.name,
        dynamicTool({
          description: t.description ?? t.name,
          inputSchema: jsonSchema(t.inputSchema),
          execute: async (args: unknown) => {
            const result = await client.callTool({
              name: t.name,
              arguments: args as Record<string, unknown>,
            });
            const parts = result.content as McpContentPart[];
            const text = parts
              .filter((c) => c.type === 'text' && c.text)
              .map((c) => c.text)
              .join('\n');
            return text || JSON.stringify(parts);
          },
        }),
      ]),
    );

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: [
        "You are DIALED's BrewAgent, a professional and concise specialty coffee assistant.",
        "",
        "CRITICAL RULES FOR ANSWERING:",
        "- Grounding: Your absolute source of truth is the data returned by your tools.",
        "- No Hallucinations: Do NOT invent, guess, or add flavor notes, processing methods, or coffee facts that are not explicitly present in the tool's response.",
        "- Your Role: Use your general knowledge ONLY to format the retrieved data into a natural, polite, and easily readable English sentence.",
        "- Missing Data: If the tool returns empty or no data, simply state that you don't have information on that specific coffee in the database. Do not try to guess.",
        "- Tone: Be highly concise. Get straight to the point.",
        "- Always reply in English.",
      ].join("\n"),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } finally {
    await client.close();
  }
}
