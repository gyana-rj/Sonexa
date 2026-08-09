import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@repo/db/client";
import youtubesearchapi from "youtube-search-api";

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
            const extractedId = ytMatch[1] || "";

            const response = await youtubesearchapi.GetVideoDetails(extractedId);
            const thumbnails = response.thumbnail.thumbnails;
            thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1)


            const stream = await prismaClient.stream.create({
                data: {
                    userId: data.creatorId,
                    url: data.url,
                    extractedId,
                    type: "Youtube",
                    title: response.title ?? "Cant find the video",
                    smallImg: thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url
                    ?? "https://www.shutterstock.com/image-vector/image-not-found-failure-network-260nw-2330163829.jpg",
                    bigImg:thumbnails[thumbnails.length - 1].url ?? "https://www.shutterstock.com/image-vector/image-not-found-failure-network-260nw-2330163829.jpg"
                }
            });
            return NextResponse.json({
                message: "Youtube stream added successfully",
                id: stream.id
            })
        }

        else if(spotifyMatch){
            const extractedId = spotifyMatch[1] || "";

            const stream = await prismaClient.stream.create({
                data: {
                    userId: data.creatorId,
                    url: data.url,
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
        console.log(e);
        return NextResponse.json({
            message: "Error while adding stream"
        }, {
            status: 411
        })
    }
}

export async function GET(req: NextRequest){
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const streams = await prismaClient.stream.findMany({
        where: {
            userId: creatorId ?? ""
        }
    })

    return NextResponse.json({
        streams
    })
}