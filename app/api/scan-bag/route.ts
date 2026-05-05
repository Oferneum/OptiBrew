import { NextResponse } from 'next/server';
import { orchestrateBagScan } from '@/lib/agents/orchestrator';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const base64      = Buffer.from(arrayBuffer).toString('base64');
  const mimeType    = file.type || 'image/jpeg';

  try {
    const result = await orchestrateBagScan(base64, mimeType);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[scan-bag]', err);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
