import { NextResponse } from 'next/server';
import { getBestBrewMethod } from '@/lib/agents/community-analytics-agent';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getBestBrewMethod(id);
  return NextResponse.json(result ?? null);
}
