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
      model: google('gemini-1.5-flash'),
      system:
        "You are DIALED's BrewAgent, a professional specialty coffee assistant. Always reply in English, even if the user prompts in another language.",
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } finally {
    await client.close();
  }
}
