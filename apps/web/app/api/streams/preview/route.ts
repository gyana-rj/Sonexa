import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyOEmbed } from "@/lib/resolve";

const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_REGEX = /open\.spotify\.com\/track\/([A-Za-z0-9]{22})/;

export type StreamPreview = {
  source: "youtube" | "spotify";
  youtubeId?: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
};

type OEmbed = { title: string; author_name: string; thumbnail_url: string };

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url")?.trim() ?? "";
  const yt = url.match(YT_REGEX);
  const sp = url.match(SPOTIFY_REGEX);

  if (yt) {
    const id = yt[1]!;
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const meta = (await res.json()) as OEmbed;
        const preview: StreamPreview = {
          source: "youtube",
          youtubeId: id,
          title: meta.title,
          artist: meta.author_name,
          thumbnail: meta.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          duration: 0,
        };
        return NextResponse.json({ preview });
      }
    } catch {
      // fall through to a minimal preview below
    }
    const preview: StreamPreview = {
      source: "youtube",
      youtubeId: id,
      title: "YouTube track",
      artist: "",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: 0,
    };
    return NextResponse.json({ preview });
  }

  if (sp) {
    const meta = await spotifyOEmbed(url);
    const preview: StreamPreview = {
      source: "spotify",
      title: meta?.title ?? "Spotify track",
      artist: "Spotify",
      thumbnail: meta?.thumbnail ?? "",
      duration: 0,
    };
    return NextResponse.json({ preview });
  }

  return NextResponse.json({ preview: null });
}
