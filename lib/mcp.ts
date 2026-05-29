import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export async function getMcpClient(): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL environment variable is not set');

  const parsedUrl = new URL(serverUrl);
  const transport = new SSEClientTransport(parsedUrl, {
    eventSourceInit: {
      // Railway's proxy rejects requests where Node's eventsource appends `:443`
      // to the Host header. Override fetch to pin the hostname without the port.
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          headers: { ...(init?.headers as Record<string, string>), Host: parsedUrl.hostname },
        }),
    },
  });

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
