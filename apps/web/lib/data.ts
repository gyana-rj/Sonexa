export interface Artist {
  id: string;
  name: string;
  image: string;
  banner: string;
  monthlyListeners: number;
  bio: string;
  verified: boolean;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  cover: string;
  duration: number; // seconds
  plays: number;
  liked?: boolean;
  lyrics?: string[];
  genre: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  cover: string;
  year: number;
  trackIds: string[];
  type: 'album' | 'single' | 'ep';
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  songIds: string[];
  curator: string;
  mood?: string;
  color?: string;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPlays(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatListeners(n: number): string {
  return `${n.toLocaleString()} monthly listeners`;
}

// Pexels image URLs
const COVERS = [
  'https://images.pexels.com/photos/16251531/pexels-photo-16251531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/20792953/pexels-photo-20792953.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6199739/pexels-photo-6199739.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/3109821/pexels-photo-3109821.png?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/25034239/pexels-photo-25034239.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8168570/pexels-photo-8168570.png?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8896511/pexels-photo-8896511.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8168564/pexels-photo-8168564.png?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/2158547/pexels-photo-2158547.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/2733337/pexels-photo-2733337.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/12431908/pexels-photo-12431908.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8168567/pexels-photo-8168567.png?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13327045/pexels-photo-13327045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/35639410/pexels-photo-35639410.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8168566/pexels-photo-8168566.png?auto=compress&cs=tinysrgb&h=650&w=940',
];

const ARTIST_IMAGES = [
  'https://images.pexels.com/photos/7611743/pexels-photo-7611743.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/19262018/pexels-photo-19262018.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/30770887/pexels-photo-30770887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6189102/pexels-photo-6189102.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7586585/pexels-photo-7586585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17029180/pexels-photo-17029180.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7586587/pexels-photo-7586587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/10153335/pexels-photo-10153335.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/12847344/pexels-photo-12847344.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29865934/pexels-photo-29865934.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export const artists: Artist[] = [
  { id: 'a1', name: 'Luna Vega', image: ARTIST_IMAGES[0], banner: COVERS[0], monthlyListeners: 18420000, verified: true, bio: 'Luna Vega crafts ethereal soundscapes that blur the line between dream and memory. Rising from the Berlin underground, her music is a study in atmosphere and restraint.' },
  { id: 'a2', name: 'Kairo Sound', image: ARTIST_IMAGES[1], banner: COVERS[3], monthlyListeners: 12300000, verified: true, bio: 'Kairo Sound fuses analog warmth with digital precision. A producer and multi-instrumentalist, his work has become synonymous with late-night introspection.' },
  { id: 'a3', name: 'Mira Solene', image: ARTIST_IMAGES[2], banner: COVERS[1], monthlyListeners: 9870000, verified: true, bio: 'Mira Solene writes songs that feel like letters never sent. Her acoustic-driven storytelling has earned her a devoted following across three continents.' },
  { id: 'a4', name: 'The Nocturnes', image: ARTIST_IMAGES[3], banner: COVERS[5], monthlyListeners: 7420000, verified: true, bio: 'The Nocturnes are a four-piece ensemble exploring the space between jazz, soul, and ambient. Their live shows are immersive, dim-lit affairs.' },
  { id: 'a5', name: 'Sable', image: ARTIST_IMAGES[4], banner: COVERS[2], monthlyListeners: 6100000, verified: false, bio: 'Sable makes music for the hours after midnight. Minimal, textured, and quietly devastating.' },
  { id: 'a6', name: 'Atlas Reign', image: ARTIST_IMAGES[5], banner: COVERS[6], monthlyListeners: 15200000, verified: true, bio: 'Atlas Reign bridges continents with a sound that is equal parts folklore and future. A storyteller first, a musician second.' },
  { id: 'a7', name: 'Vesper', image: ARTIST_IMAGES[6], banner: COVERS[7], monthlyListeners: 4350000, verified: false, bio: 'Vesper builds worlds in sound. Each release is a self-contained universe, meticulously arranged and deeply felt.' },
  { id: 'a8', name: 'Coda Lumen', image: ARTIST_IMAGES[7], banner: COVERS[8], monthlyListeners: 8900000, verified: true, bio: 'Coda Lumen is the project of composer and pianist Ada Reyes. Classical training meets modern production in a signature blend of elegance and edge.' },
];

const songTitles = [
  'Midnight Reverie', 'Glass Horizons', 'Slow Burn', 'Paper Moon', 'Velvet Static',
  'Northern Lights', 'Afterglow', 'Weightless', 'Crimson Hour', 'Echo Chamber',
  'Lantern', 'Driftwood', 'Silent Frame', 'Tide', 'Ember', 'Halcyon',
  'Paper Walls', 'Lowlight', 'Sonder', 'Ferris Wheel', 'Cassette', 'Rivulet',
  'Open Window', 'Comet', 'Foothold', 'Mirage', 'Periwinkle', 'Saudade',
  'Threshold', 'Undercurrent', 'Vivid', 'Wistful', 'Xanadu', 'Yonder', 'Zenith',
];

export const genres = ['Ambient', 'Indie', 'Electronic', 'Soul', 'Folk', 'Synthwave'];

function buildCatalog() {
  const songs: Song[] = [];
  const albums: Album[] = [];

  let coverIdx = 0;
  let titleIdx = 0;

  artists.forEach((artist, ai) => {
    const albumCount = 2;
    for (let al = 0; al < albumCount; al++) {
      const albumId = `${artist.id}-al${al + 1}`;
      const albumTitle = ['Reverie', 'Nocturne', 'Latitude', 'Foothold', 'Cassette', 'Mirage', 'Halcyon', 'Threshold', 'Lowlight', 'Sonder'][(ai * 2 + al) % 10];
      const cover = COVERS[coverIdx % COVERS.length];
      coverIdx++;

      const trackCount = 5;
      const trackIds: string[] = [];
      for (let t = 0; t < trackCount; t++) {
        const songId = `${albumId}-t${t + 1}`;
        const title = songTitles[titleIdx % songTitles.length];
        titleIdx++;
        const duration = 180 + Math.floor(Math.random() * 120);
        const plays = Math.floor(Math.random() * 80_000_000) + 500_000;
        songs.push({
          id: songId,
          title,
          artistId: artist.id,
          artistName: artist.name,
          albumId,
          albumTitle,
          cover,
          duration,
          plays,
          genre: genres[ai % genres.length],
          lyrics: [
            `In the ${title.toLowerCase()} we found a quiet place`,
            `Every shadow took a different shape`,
            `And the hours moved like waves`,
            `Slow, and unafraid`,
            `Hold the light, don't let it fade`,
            `We were never meant to stay`,
            `But the memory remains`,
          ],
        });
        trackIds.push(songId);
      }
      albums.push({
        id: albumId,
        title: albumTitle,
        artistId: artist.id,
        artistName: artist.name,
        cover,
        year: 2021 + al + (ai % 3),
        trackIds,
        type: al === 0 ? 'album' : 'ep',
      });
    }
  });

  return { songs, albums };
}

const { songs: allSongs, albums: allAlbums } = buildCatalog();

export const songs = allSongs;
export const albums = allAlbums;

export const playlists: Playlist[] = [
  { id: 'p1', title: 'Midnight Drive', description: 'Synth-soaked tracks for empty highways and city lights.', cover: COVERS[2], songIds: songs.slice(0, 8).map(s => s.id), curator: 'Cadence Editorial', mood: 'Night', color: '#7C3AED' },
  { id: 'p2', title: 'Morning Calm', description: 'Gentle melodies to ease into the day.', cover: COVERS[1], songIds: songs.slice(8, 16).map(s => s.id), curator: 'Cadence Editorial', mood: 'Calm', color: '#3B82F6' },
  { id: 'p3', title: 'Deep Focus', description: 'Instrumental and ambient for flow state.', cover: COVERS[4], songIds: songs.slice(16, 24).map(s => s.id), curator: 'Cadence Editorial', mood: 'Focus', color: '#22C55E' },
  { id: 'p4', title: 'Golden Hour', description: 'Warm, sunlit songs for the late afternoon.', cover: COVERS[3], songIds: songs.slice(24, 32).map(s => s.id), curator: 'Cadence Editorial', mood: 'Happy', color: '#F59E0B' },
  { id: 'p5', title: 'Rainy Day', description: 'Cozy, introspective tracks for grey skies.', cover: COVERS[10], songIds: songs.slice(32, 40).map(s => s.id), curator: 'Cadence Editorial', mood: 'Melancholy', color: '#64748B' },
  { id: 'p6', title: 'Late Night Vibes', description: 'Smooth, moody selections for after midnight.', cover: COVERS[5], songIds: songs.slice(40, 48).map(s => s.id), curator: 'Cadence Editorial', mood: 'Night', color: '#7C3AED' },
  { id: 'p7', title: 'Workout Energy', description: 'High-energy beats to push through.', cover: COVERS[6], songIds: songs.slice(48, 56).map(s => s.id), curator: 'Cadence Editorial', mood: 'Energy', color: '#EF4444' },
  { id: 'p8', title: 'Acoustic Soul', description: 'Stripped-back performances and raw voices.', cover: COVERS[9], songIds: songs.slice(56, 64).map(s => s.id), curator: 'Cadence Editorial', mood: 'Soul', color: '#14B8A6' },
];

export const moods = [
  { name: 'Focus', color: '#22C55E', cover: COVERS[4] },
  { name: 'Calm', color: '#3B82F6', cover: COVERS[1] },
  { name: 'Night', color: '#7C3AED', cover: COVERS[2] },
  { name: 'Happy', color: '#F59E0B', cover: COVERS[3] },
  { name: 'Energy', color: '#EF4444', cover: COVERS[6] },
  { name: 'Melancholy', color: '#64748B', cover: COVERS[10] },
  { name: 'Soul', color: '#14B8A6', cover: COVERS[9] },
  { name: 'Romance', color: '#EC4899', cover: COVERS[0] },
];

export function getSong(id: string): Song | undefined {
  return songs.find(s => s.id === id);
}

export function getArtist(id: string): Artist | undefined {
  return artists.find(a => a.id === id);
}

export function getAlbum(id: string): Album | undefined {
  return albums.find(a => a.id === id);
}

export function getPlaylist(id: string): Playlist | undefined {
  return playlists.find(p => p.id === id);
}

export function getArtistSongs(artistId: string): Song[] {
  return songs.filter(s => s.artistId === artistId);
}

export function getArtistAlbums(artistId: string): Album[] {
  return albums.filter(a => a.artistId === artistId);
}

export function getAlbumSongs(albumId: string): Song[] {
  const album = getAlbum(albumId);
  if (!album) return [];
  return album.trackIds.map(id => getSong(id)).filter(Boolean) as Song[];
}

export function getPlaylistSongs(playlistId: string): Song[] {
  const playlist = getPlaylist(playlistId);
  if (!playlist) return [];
  return playlist.songIds.map(id => getSong(id)).filter(Boolean) as Song[];
}

export function searchAll(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return { songs: [], artists: [], albums: [], playlists: [] };
  return {
    songs: songs.filter(s => s.title.toLowerCase().includes(q) || s.artistName.toLowerCase().includes(q)),
    artists: artists.filter(a => a.name.toLowerCase().includes(q)),
    albums: albums.filter(a => a.title.toLowerCase().includes(q) || a.artistName.toLowerCase().includes(q)),
    playlists: playlists.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  };
}

export function getSimilarSongs(songId: string, count = 5): Song[] {
  const song = getSong(songId);
  if (!song) return [];
  return songs
    .filter(s => s.id !== songId && s.genre === song.genre)
    .slice(0, count);
}

export function getRecentlyPlayed(): Song[] {
  return songs.slice(50, 58);
}

export function getContinueListening(): Album[] {
  return albums.slice(0, 6);
}

export function getTrendingAlbums(): Album[] {
  return albums.slice(2, 10);
}

export function getNewReleases(): Album[] {
  return albums.slice(4, 12);
}

export function getTopCharts(): Song[] {
  return [...songs].sort((a, b) => b.plays - a.plays).slice(0, 10);
}

export function getFeaturedArtists(): Artist[] {
  return artists.slice(0, 6);
}

export function getRelatedArtists(artistId: string): Artist[] {
  return artists.filter(a => a.id !== artistId).slice(0, 5);
}
