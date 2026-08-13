import { prismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlayback, setPlayback } from "@/lib/playback-store";
import { healSpotifyStreams } from "@/lib/heal-spotify";
import { deriveRoomView, type RoomStream } from "@/lib/room-state";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
    const session = await getServerSession(authOptions);

    // Short-circuit unauthenticated requests before touching the database.
    if(!session?.user?.email){
        return NextResponse.json({ message: "Unauthenticated" }, { status: 403 });
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: session.user.email
        }
    });

    if(!user){
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        })
    }


    const streams = await prismaClient.stream.findMany({
        where: {
            userId: user.id
        },
        include: {
            _count: {
                select: {
                    upvote: true
                }
            },
            upvote: {
                where: {
                    userId: user.id
                }
            }
        }
    })

    await healSpotifyStreams(streams);

    const mapped = streams.map(({_count, upvote, ...rest}) => ({
        ...rest,
        upvote: _count.upvote,
        haveUpvoted: upvote.length ? true : false
    }));

    // Seed shared playback for the creator's own room (same rules as public GET).
    let playback = getPlayback(user.id);
    if (!playback.streamId && mapped.length > 0) {
        const seed: RoomStream[] = mapped.map((s) => ({
            id: s.id,
            title: s.title,
            votes: s.upvote,
            haveUpvoted: s.haveUpvoted,
        }));
        const view = deriveRoomView(seed, null);
        if (view.nowPlaying) {
            playback = setPlayback(user.id, {
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
    })
}