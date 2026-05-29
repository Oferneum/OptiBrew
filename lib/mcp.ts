import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { fetch as undiciFetch, Agent } from 'undici';

// Railway's proxy uses HTTP/2 and returns 421 when Node's default fetch
// attempts to reuse an HTTP/2 connection. Force HTTP/1.1 via an undici Agent.
const h1Agent = new Agent({ allowH2: false });

export async function getMcpClient(): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL environment variable is not set');

  const parsedUrl = new URL(serverUrl);

  const transport = new SSEClientTransport(parsedUrl, {
    eventSourceInit: {
      fetch: (url: string | URL, init: RequestInit) =>
        undiciFetch(url as string, {
          ...(init as Parameters<typeof undiciFetch>[1]),
          dispatcher: h1Agent,
        }),
    } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestInit: { dispatcher: h1Agent } as any,
  });

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
