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
  private readonly _extraHeaders: Record<string, string>;
  private _postUrl: URL | null = null;
  private _req: ReturnType<typeof https.request> | null = null;
  private _keepalive: ReturnType<typeof setInterval> | null = null;

  constructor(url: URL, extraHeaders: Record<string, string> = {}) {
    this._sseUrl = url;
    this._extraHeaders = extraHeaders;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._req = https.request(
        {
          hostname: this._sseUrl.hostname,
          port:     this._sseUrl.port || 443,
          path:     this._sseUrl.pathname + this._sseUrl.search,
          method:   'GET',
          headers:  { Accept: 'text/event-stream', 'Cache-Control': 'no-cache', ...this._extraHeaders },
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

          // Ping the server every 20s so Railway's proxy doesn't drop the idle SSE socket
          this._keepalive = setInterval(() => {
            try { this._req?.socket?.write(':ping\n\n'); } catch { /* ignore */ }
          }, 20_000);

          res.on('end',   () => { this._stopKeepalive(); this.onclose?.(); });
          res.on('error', (e) => { this._stopKeepalive(); this.onerror?.(e); });
        },
      );

      this._req.on('error', (e) => { reject(e); this.onerror?.(e); });
      this._req.end();
    });
  }

  private _stopKeepalive() {
    if (this._keepalive) { clearInterval(this._keepalive); this._keepalive = null; }
  }

  async close(): Promise<void> {
    this._stopKeepalive();
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
            ...this._extraHeaders,
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

export async function getMcpClient(extraHeaders: Record<string, string> = {}): Promise<Client> {
  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) throw new Error('MCP_SERVER_URL is not set');

  const transport = new NodeHttpsSseTransport(new URL(serverUrl), extraHeaders);
  const client    = new Client({ name: 'dialed-brew-agent', version: '1.0.0' });

  await client.connect(transport);
  return client;
}

type McpTextPart = { type: string; text?: string };

// Single shared budget for the full round-trip: SSE handshake + tool call.
// Two independent timeouts (old approach) allowed getMcpClient to burn up to 7s,
// leaving callTool with a fresh 7s window — but the Vercel function may only have
// seconds left by then. One shared 10s deadline coordinates both steps.
const MCP_TOTAL_TIMEOUT_MS = 10_000;

/**
 * One-shot diagnose_shot() call for non-conversational use (analyze/reanalyze routes).
 * Opens a connection, calls diagnose_shot, closes, returns the text block.
 * Fails open — returns null on any error or timeout so the caller can continue.
 */
export async function fetchMcpKnowledgeBlock(
  shotId: string,
  userId: string,
): Promise<string | null> {
  let client: Client | null = null;

  try {
    const result = await Promise.race([
      (async () => {
        client = await getMcpClient();
        return client.callTool({ name: 'diagnose_shot', arguments: { shot_id: shotId, user_id: userId } });
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), MCP_TOTAL_TIMEOUT_MS)
      ),
    ]);

    const text = ((result as { content: McpTextPart[] }).content)
      .filter(p => p.type === 'text' && p.text)
      .map(p => p.text)
      .join('\n')
      .trim();

    return text || null;
  } catch (err) {
    console.warn('[BaristaBrain] MCP diagnose_shot failed — continuing without it:', err);
    return null;
  } finally {
    try { await (client as Client | null)?.close(); } catch { /* ignore */ }
  }
}
