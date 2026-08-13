import youtubesearchapi from "youtube-search-api";

export type SpotifyMeta = { title: string; thumbnail: string };

/**
 * Fetch a Spotify track's public metadata via oEmbed — no API key or auth required.
 * Returns the real track title and cover art.
 */
export async function spotifyOEmbed(trackUrl: string): Promise<SpotifyMeta | null> {
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return {
      title: data.title ?? "Spotify track",
      thumbnail: data.thumbnail_url ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Find the best-matching YouTube video id for a search term.
 *
 * Spotify can't be played back in a plain web page (that needs Premium + the Web
 * Playback SDK per listener), so we resolve a Spotify track to its YouTube
 * equivalent and play that instead — giving everyone in the room real, shared audio.
 */
export async function youtubeIdForQuery(query: string): Promise<string | null> {
  try {
    const res = await youtubesearchapi.GetListByKeyword(query, false, 5, [
      { type: "video" },
    ]);
    const items: Array<{ id: string; type: string }> = res?.items ?? [];
    const first = items.find((i) => i.type === "video" && i.id);
    return first?.id ?? null;
  } catch {
    return null;
  }
}
