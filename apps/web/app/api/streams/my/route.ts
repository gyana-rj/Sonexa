import { prismaClient } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function GET(req: NextRequest){
    const session = await getServerSession();

    const user = await prismaClient.user.findFirst({
        where: {
            email: session?.user?.email ?? ""
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

    return NextResponse.json({
        streams: streams.map(({_count, ...rest}) => ({
            ...rest,
            upvote: _count.upvote,
            haveUpvoted: rest.upvote.length ? true : false
        }))
    })
}