import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import youtubesearchapi from "youtube-search-api";

export type SearchResult = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  isLive: boolean;
};

type YtThumbnail = { url: string; width: number; height: number };
type YtItem = {
  id: string;
  type: string;
  title?: string;
  channelTitle?: string;
  isLive?: boolean;
  length?: { simpleText?: string };
  thumbnail?: { thumbnails?: YtThumbnail[] };
};

export async function GET(req: NextRequest) {
  // Search is a signed-in-only experience.
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    // `false` = exclude playlists, `20` = result limit.
    const response = await youtubesearchapi.GetListByKeyword(q, false, 20, [
      { type: "video" },
    ]);

    const items: YtItem[] = response?.items ?? [];
    const results: SearchResult[] = items
      .filter((it) => it.type === "video" && it.id)
      .map((it) => {
        const thumbs = it.thumbnail?.thumbnails ?? [];
        const thumbnail = thumbs.length ? thumbs[thumbs.length - 1]!.url : "";
        return {
          id: it.id,
          title: it.title ?? "Untitled",
          channel: it.channelTitle ?? "Unknown",
          thumbnail,
          duration: it.length?.simpleText ?? "",
          isLive: Boolean(it.isLive),
        };
      });

    return NextResponse.json({ results });
  } catch (e) {
    console.error("YouTube search failed:", e);
    return NextResponse.json(
      { message: "Search failed. Please try again." },
      { status: 502 },
    );
  }
}
