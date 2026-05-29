import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

const MCP_SERVER_DIR  = path.join(process.cwd(), '..', 'coffee-mcp-server');
const MCP_SERVER_PATH = path.join(MCP_SERVER_DIR, 'server.py');
const VENV_PYTHON     = path.join(MCP_SERVER_DIR, 'venv', 'bin', 'python');

export async function getMcpClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: VENV_PYTHON,
    args: [MCP_SERVER_PATH],
  });

  const client = new Client(
    { name: 'dialed-brew-agent', version: '1.0.0' },
  );

  await client.connect(transport);
  return client;
}
