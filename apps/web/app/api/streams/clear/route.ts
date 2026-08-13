import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaClient } from '@repo/db/client';
import { clearPlayback } from '@/lib/playback-store';
import { activeCount } from '@/lib/presence-store';

/**
 * DELETE /api/streams/clear
 * Creator removes every song in their room — only when nobody else is listening.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 403 });
  }

  const user = await prismaClient.user.findFirst({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 403 });
  }

  const listeners = activeCount(user.id);
  // Allow clear when alone (0–1): only the host, or an empty heartbeat window.
  if (listeners > 1) {
    return NextResponse.json(
      {
        message: 'Others are still in the room. Clear is only available when you are alone.',
        count: listeners,
      },
      { status: 409 },
    );
  }

  await prismaClient.$transaction([
    prismaClient.upvote.deleteMany({
      where: { stream: { userId: user.id } },
    }),
    prismaClient.stream.deleteMany({
      where: { userId: user.id },
    }),
  ]);
  clearPlayback(user.id);

  return NextResponse.json({ ok: true, removed: true });
}
