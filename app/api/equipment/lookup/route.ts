import { NextResponse } from 'next/server';
import { lookupEquipment } from '@/lib/agents/equipment-lookup-agent';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ error: 'Query too short' }, { status: 400 });

  const result = await lookupEquipment(q);
  if (!result) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  return NextResponse.json(result);
}
