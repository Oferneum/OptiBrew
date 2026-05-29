import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export async function getMcpClient(): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL environment variable is not set');

  const transport = new SSEClientTransport(new URL(serverUrl));

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
