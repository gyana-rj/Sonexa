import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaClient } from '@repo/db/client';
import { getPlayback, setPlayback } from '@/lib/playback-store';
import { advancePlayback, type RoomStream } from '@/lib/room-state';

const bodySchema = z.object({
  creatorId: z.string().min(1),
  /** Set an explicit track, or omit when using `action: "advance"`. */
  streamId: z.string().optional().nullable(),
  playing: z.boolean().optional(),
  action: z.enum(['set', 'advance']).default('set'),
});

/**
 * POST /api/streams/playback
 * Host (or any signed-in listener) updates the room's shared now-playing pointer.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 });
  }

  const { creatorId, streamId, playing, action } = parsed.data;

  const room = await prismaClient.user.findFirst({
    where: { id: creatorId },
    select: { id: true },
  });
  if (!room) {
    return NextResponse.json({ message: 'Room not found' }, { status: 404 });
  }

  if (action === 'advance') {
    const streams = await prismaClient.stream.findMany({
      where: { userId: creatorId },
      include: { _count: { select: { upvote: true } } },
    });
    const mapped: RoomStream[] = streams.map((s) => ({
      id: s.id,
      title: s.title,
      votes: s._count.upvote,
      haveUpvoted: false,
    }));
    const current = getPlayback(creatorId);
    const next = advancePlayback(mapped, {
      streamId: current.streamId,
      playing: current.playing,
    });
    const stored = setPlayback(creatorId, next);
    return NextResponse.json({ playback: stored });
  }

  if (streamId) {
    const stream = await prismaClient.stream.findFirst({
      where: { id: streamId, userId: creatorId },
      select: { id: true },
    });
    if (!stream) {
      return NextResponse.json({ message: 'Stream not in this room' }, { status: 404 });
    }
  }

  const stored = setPlayback(creatorId, {
    streamId: streamId ?? null,
    playing: playing ?? Boolean(streamId),
  });

  return NextResponse.json({ playback: stored });
}

/** GET /api/streams/playback?creatorId=… */
export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get('creatorId');
  if (!creatorId) {
    return NextResponse.json({ message: 'creatorId required' }, { status: 400 });
  }
  return NextResponse.json({ playback: getPlayback(creatorId) });
}
