import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaClient } from "@repo/db/client";
import { spotifyOEmbed, youtubeIdForQuery } from "@/lib/resolve";
import { getPlayback, setPlayback } from "@/lib/playback-store";
import { healSpotifyStreams } from "@/lib/heal-spotify";
import { deriveRoomView, type RoomStream } from "@/lib/room-state";

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_REGEX = /open\.spotify\.com\/track\/([A-Za-z0-9]{22})/;

const createStreamSchema = z.object({
  url: z.string(),
  creatorId: z.string().optional(),
});

type OEmbed = { title: string; author_name: string; thumbnail_url: string };

async function ytOEmbed(id: string): Promise<OEmbed | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as OEmbed;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user?.email
    ? await prismaClient.user.findFirst({ where: { email: session.user.email } })
    : null;

  if (!user) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 403 });
  }

  try {
    const data = createStreamSchema.parse(await req.json());
    const ytMatch = data.url.match(YT_REGEX);
    const spotifyMatch = data.url.match(SPOTIFY_REGEX);

    // When adding from another creator's shared room, the track belongs to that
    // room (its creator), not to the visitor. Fall back to self for one's own room.
    let ownerId = user.id;
    if (data.creatorId && data.creatorId !== user.id) {
      const creator = await prismaClient.user.findFirst({
        where: { id: data.creatorId },
        select: { id: true },
      });
      if (!creator) {
        return NextResponse.json({ message: "Room not found" }, { status: 404 });
      }
      ownerId = creator.id;
    }

    if (ytMatch) {
      const extractedId = ytMatch[1]!;
      const meta = await ytOEmbed(extractedId);

      const stream = await prismaClient.stream.create({
        data: {
          userId: ownerId,
          url: data.url,
          extractedId,
          type: "Youtube",
          title: meta?.title ?? "YouTube track",
          smallImg: `https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`,
          bigImg: meta?.thumbnail_url ?? `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
        },
      });

      return NextResponse.json({ message: "Youtube stream added successfully", id: stream.id });
    }

    if (spotifyMatch) {
      // Spotify audio can't stream in a plain web page, so resolve the track to its
      // YouTube equivalent for playback while keeping the real Spotify title + art.
      const meta = await spotifyOEmbed(data.url);
      const title = meta?.title ?? "Spotify track";
      const youtubeId = await youtubeIdForQuery(title);

      const stream = await prismaClient.stream.create({
        data: {
          userId: ownerId,
          url: data.url,
          // Store the resolved YouTube id so the track is actually playable in the room.
          extractedId: youtubeId ?? spotifyMatch[1]!,
          type: "Spotify",
          title,
          smallImg: meta?.thumbnail ?? "",
          bigImg: meta?.thumbnail ?? "",
        },
      });
      return NextResponse.json({ message: "Spotify stream added successfully", id: stream.id });
    }

    return NextResponse.json(
      { message: "Invalid url. Please provide a valid YouTube or Spotify track link." },
      { status: 411 },
    );
  } catch (e) {
    console.error("add stream failed:", e);
    return NextResponse.json({ message: "Error while adding stream" }, { status: 411 });
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  if (!creatorId) {
    return NextResponse.json({ streams: [] });
  }

  // Identify the viewer (if any) so we can flag which tracks they've upvoted.
  const session = await getServerSession(authOptions);
  const viewer = session?.user?.email
    ? await prismaClient.user.findFirst({ where: { email: session.user.email } })
    : null;

  const streams = await prismaClient.stream.findMany({
    where: { userId: creatorId },
    include: {
      _count: { select: { upvote: true } },
      // Only the viewer's own upvote rows (empty for anonymous) → drives haveUpvoted.
      upvote: { where: { userId: viewer?.id ?? "" } },
    },
  });

  // Same heal as /api/streams/my — guests must get playable YouTube ids too.
  await healSpotifyStreams(streams);

  const mapped = streams.map(({ _count, upvote, ...rest }) => ({
    ...rest,
    upvote: _count.upvote,
    haveUpvoted: upvote.length > 0,
  }));

  // Seed a shared now-playing pointer so every client agrees on first join.
  let playback = getPlayback(creatorId);
  if (!playback.streamId && mapped.length > 0) {
    const seed: RoomStream[] = mapped.map((s) => ({
      id: s.id,
      title: s.title,
      votes: s.upvote,
      haveUpvoted: s.haveUpvoted,
    }));
    const view = deriveRoomView(seed, null);
    if (view.nowPlaying) {
      playback = setPlayback(creatorId, {
        streamId: view.nowPlaying.id,
        playing: false,
      });
    }
  }

  return NextResponse.json({
    streams: mapped,
    playback: {
      streamId: playback.streamId,
      playing: playback.playing,
      positionSec: playback.positionSec,
      updatedAt: playback.updatedAt,
    },
  });
}
