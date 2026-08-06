import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@repo/db/client";

const YT_REGEX = new RegExp("^(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[?&][^\\s]*)?$");
const SPOTIFY_REGEX = new RegExp("^https?:\\/\\/(?:open\\.)?spotify\\.com\\/(?:track|album|playlist|artist|episode|show)\\/([A-Za-z0-9]{22})(?:\\?.*)?$");
const createStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
})
export async function POST(req: NextRequest){
    try{
        const data = createStreamSchema.parse(await req.json());
        const ytMatch = data.url.match(YT_REGEX)
        const spotifyMatch = data.url.match(SPOTIFY_REGEX);

        if(ytMatch){
            const extractedId = ytMatch[1];

            const stream = await prismaClient.stream.create({
                data: {
                    userId: data.creatorId,
                    extractedId,
                    type: "Youtube"
                }
            });
            return NextResponse.json({
                message: "Youtube stream added successfully",
                id: stream.id
            })
        }

        else if(spotifyMatch){
            const extractedId = spotifyMatch[1];

            const stream = await prismaClient.stream.create({
                data: {
                    userId: data.creatorId,
                    extractedId,
                    type: "Spotify"
                }
            })
            return NextResponse.json({
                message: "Spotify stream added successfully",
                id: stream.id
            })
        }

        else{
            return NextResponse.json({
                message: "Inbvalid url, Please provide a valid url to add a stream"
            }, {
                status: 411
            })
        }

    }catch(e){
        return NextResponse.json({
            message: "Error while adding stream"
        }, {
            status: 411
        })
    }
}