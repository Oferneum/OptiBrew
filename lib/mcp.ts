import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { fetch as undiciFetch, Agent, Pool } from 'undici';

// undici's Agent silently ignores allowH2 — it must be passed via a custom
// factory so each Pool/Client is created with HTTP/2 disabled. This forces
// HTTP/1.1 on the TLS handshake, preventing Railway's proxy from returning
// 421 Misdirected Request due to HTTP/2 connection coalescing.
const h1Agent = new Agent({
  factory: (origin, opts) => new Pool(origin, { ...opts, allowH2: false }),
});

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
