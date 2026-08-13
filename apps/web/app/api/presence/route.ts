import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { activeCount, touchPresence } from '@/lib/presence-store';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  let roomId = req.nextUrl.searchParams.get('creatorId');
  if (!roomId) {
    try {
      const body = (await req.json()) as { creatorId?: string };
      roomId = body?.creatorId ?? 'global';
    } catch {
      roomId = 'global';
    }
  }

  if (email) {
    return NextResponse.json({ count: touchPresence(roomId, email) });
  }
  return NextResponse.json({ count: activeCount(roomId) });
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('creatorId') ?? 'global';
  return NextResponse.json({ count: activeCount(roomId) });
}
