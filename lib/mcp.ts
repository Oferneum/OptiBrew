import https from 'node:https';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Custom SSE transport using Node's https module directly (pure HTTP/1.1).
 * Replaces SSEClientTransport + undici because Railway's proxy returns 421
 * whenever the underlying TLS stack negotiates HTTP/2, and there is no reliable
 * way to suppress HTTP/2 through the eventsource → undici → Agent chain.
 */
class NodeHttpsSseTransport implements Transport {
  onclose?: () => void;
  onerror?:   (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  private readonly _sseUrl: URL;
  private _postUrl: URL | null = null;
  private _req: ReturnType<typeof https.request> | null = null;

  constructor(url: URL) {
    this._sseUrl = url;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._req = https.request(
        {
          hostname: this._sseUrl.hostname,
          port:     this._sseUrl.port || 443,
          path:     this._sseUrl.pathname + this._sseUrl.search,
          method:   'GET',
          headers:  { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
        },
        (res) => {
          if (res.statusCode !== 200) {
            const err = new Error(`SSE connect failed: HTTP ${res.statusCode}`);
            reject(err);
            this.onerror?.(err);
            return;
          }

          let buf       = '';
          let eventType = '';

          res.on('data', (chunk: Buffer) => {
            buf += chunk.toString('utf8');
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (eventType === 'endpoint') {
                  this._postUrl = new URL(data, this._sseUrl);
                  resolve();
                } else if (data) {
                  try {
                    this.onmessage?.(JSONRPCMessageSchema.parse(JSON.parse(data)));
                  } catch (e) {
                    this.onerror?.(e as Error);
                  }
                }
                eventType = '';
              }
            }
          });

          res.on('end',   () => this.onclose?.());
          res.on('error', (e) => this.onerror?.(e));
        },
      );

      this._req.on('error', (e) => { reject(e); this.onerror?.(e); });
      this._req.end();
    });
  }

  async close(): Promise<void> {
    this._req?.destroy();
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._postUrl) throw new Error('[MCP] Transport not started');

    const body = JSON.stringify(message);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: this._postUrl!.hostname,
          port:     this._postUrl!.port || 443,
          path:     this._postUrl!.pathname + this._postUrl!.search,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`[MCP] POST ${this._postUrl!.pathname} → HTTP ${res.statusCode}`));
            return;
          }
          res.resume(); // no body needed
          resolve();
        },
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

export async function getMcpClient(): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL is not set');

  const transport = new NodeHttpsSseTransport(new URL(serverUrl));
  const client    = new Client({ name: 'dialed-brew-agent', version: '1.0.0' });

  await client.connect(transport);
  return client;
}
