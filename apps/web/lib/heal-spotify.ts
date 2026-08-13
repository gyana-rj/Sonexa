import { prismaClient } from '@repo/db/client';
import { spotifyOEmbed, youtubeIdForQuery } from '@/lib/resolve';

type Healable = {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
};

/**
 * Legacy Spotify rows stored a 22-char Spotify id (not playable in the room).
 * Resolve once to a YouTube id + metadata and persist.
 */
export async function healSpotifyStreams<T extends Healable>(streams: T[]): Promise<T[]> {
  await Promise.all(
    streams.map(async (s) => {
      if (s.type !== 'Spotify' || s.extractedId.length === 11) return;
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
      s.extractedId = youtubeId;
      s.title = title;
      if (meta?.thumbnail) {
        s.smallImg = meta.thumbnail;
        s.bigImg = meta.thumbnail;
      }
    }),
  );
  return streams;
}
