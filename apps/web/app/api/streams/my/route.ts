import { prismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyOEmbed, youtubeIdForQuery } from "@/lib/resolve";
import { getPlayback, setPlayback } from "@/lib/playback-store";
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

    // Heal legacy Spotify rows: older tracks stored the raw 22-char Spotify id
    // (not playable) and a placeholder title. Resolve them to a real title, cover,
    // and playable YouTube id once, then persist so this only runs a single time.
    await Promise.all(
        streams.map(async (s) => {
            if (s.type !== "Spotify" || s.extractedId.length === 11) return;
            const meta = await spotifyOEmbed(s.url);
            const title = meta?.title ?? s.title;
            const youtubeId = await youtubeIdForQuery(title);
            if (!youtubeId) return;
            await prismaClient.stream.update({
                where: { id: s.id },
                data: {
                    extractedId: youtubeId,
                    title,
                    smallImg: meta?.thumbnail ?? s.smallImg,
                    bigImg: meta?.thumbnail ?? s.bigImg,
                },
            });
            // Reflect the update in the response we're about to send.
            s.extractedId = youtubeId;
            s.title = title;
            if (meta?.thumbnail) {
                s.smallImg = meta.thumbnail;
                s.bigImg = meta.thumbnail;
            }
        }),
    );

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
        },
    })
}