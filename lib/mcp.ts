import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export async function getMcpClient(): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL environment variable is not set');

  const parsedUrl = new URL(serverUrl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = new SSEClientTransport(parsedUrl, {
    eventSourceInit: {
      // The TS EventSourceInit interface omits `headers`, but the underlying
      // Node.js eventsource package accepts it. Cast to any to fix the 421 on
      // the initial GET /sse handshake caused by Railway rejecting Host: host:443.
      headers: { Host: parsedUrl.hostname },
      fetch: (url: string | URL, init: RequestInit) =>
        fetch(url, {
          ...init,
          headers: { ...(init?.headers as Record<string, string>), Host: parsedUrl.hostname },
        }),
    } as any,
  });

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
