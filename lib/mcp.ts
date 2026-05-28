import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

const MCP_SERVER_PATH = path.join(process.cwd(), '..', 'coffee-mcp-server', 'server.py');

export async function getMcpClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: 'python3',
    args: [MCP_SERVER_PATH],
  });

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
