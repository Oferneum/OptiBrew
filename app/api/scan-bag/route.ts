import { NextResponse } from 'next/server';
import { orchestrateBagScan } from '@/lib/agents/orchestrator';
import type { ImageInput } from '@/lib/agents/vision-agent';

export async function POST(req: Request) {
  const formData = await req.formData();
  const files    = formData.getAll('image') as File[];
  if (files.length === 0) return NextResponse.json({ error: 'No images provided' }, { status: 400 });

  const images: ImageInput[] = await Promise.all(
    files.map(async (file) => ({
      data:     Buffer.from(await file.arrayBuffer()).toString('base64'),
      mimeType: file.type || 'image/jpeg',
    })),
  );

  try {
    const result = await orchestrateBagScan(images);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[scan-bag]', err);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
