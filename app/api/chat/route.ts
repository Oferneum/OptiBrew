export const maxDuration = 60;

import { streamText, convertToModelMessages, dynamicTool, jsonSchema, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getMcpClient } from '@/lib/mcp';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type McpContentPart = { type: string; text?: string };

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Connect to MCP — surface failures as readable errors instead of silent 500s
  let client: Awaited<ReturnType<typeof getMcpClient>>;
  let mcpTools: Awaited<ReturnType<typeof client.listTools>>['tools'];

  try {
    client = await getMcpClient();
    ({ tools: mcpTools } = await client.listTools());
  } catch (err) {
    console.error('[Bean] MCP connection failed:', err);
    return Response.json(
      { error: 'Bean is temporarily unavailable — could not reach knowledge base.' },
      { status: 503 },
    );
  }

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
    model: openai('gpt-4o-mini'),
    system: [
      "You are Bean, DIALED's friendly and concise personal coffee assistant.",
      "",
      "CRITICAL RULES:",
      "- Tool-First: Before making ANY recommendation or answering ANY question about coffee, beans, or brewing, you MUST call the appropriate tool first. Never answer from memory or training data.",
      "- Grounding: Your absolute source of truth is the data returned by your tools.",
      "- No Hallucinations: Do NOT invent or add flavor notes, processing methods, or coffee facts not explicitly in the tool response.",
      "- Your Role: Use your general knowledge ONLY to format retrieved data into natural, readable English.",
      "- Missing Data: If the tool returns empty or no matching data, say so plainly. Never guess.",
      "- Tone: Warm, concise, friendly. Get straight to the point.",
      "- Always reply in English.",
      "",
      "FORMATTING RULES — follow these exactly:",
      "- No markdown. No asterisks, no bold (**), no italics, no hashes, no bullet dashes.",
      "- When listing items, put each on its own line with a blank line between them.",
      "- Format each bean as: Name — Origin · Score · Method · Price (if available)",
      "- Example: Ditta — Italy · 8/10 · Espresso",
      "- Keep the intro and outro to one short sentence each.",
      "- Never number the items.",
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async () => {
      await client.close();
    },
  });

  return result.toUIMessageStreamResponse();
}
