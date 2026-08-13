/** Curated landing-page music — each item maps to a YouTube search on /listen. */

export type TrendingTrack = {
  title: string;
  artist: string;
  /** Passed to /listen search */
  searchQuery: string;
  from: string;
  to: string;
  plays: string;
};

export type PlaylistTrack = {
  title: string;
  artist: string;
  searchQuery: string;
};

export type MoodPlaylist = {
  id: string;
  name: string;
  tag: string;
  tracks: PlaylistTrack[];
};

export const trendingTracks: TrendingTrack[] = [
  {
    title: 'Unakkul Naane',
    artist: 'Pritt',
    searchQuery: 'Unakkul Naane Pritt',
    from: '#c0392b',
    to: '#7a2320',
    plays: '12.4M',
  },
  {
    title: 'Chaleya',
    artist: 'Arijit Singh',
    searchQuery: 'Chaleya Jawan Arijit Singh',
    from: '#d3663a',
    to: '#a83f2a',
    plays: '9.8M',
  },
  {
    title: 'Pasoori',
    artist: 'Ali Sethi, Shae Gill',
    searchQuery: 'Pasoori Ali Sethi',
    from: '#2f5d47',
    to: '#173a3a',
    plays: '8.1M',
  },
  {
    title: 'Kesariya',
    artist: 'Arijit Singh',
    searchQuery: 'Kesariya Brahmastra Arijit Singh',
    from: '#7a3a5e',
    to: '#c8613a',
    plays: '7.6M',
  },
  {
    title: 'Apna Bana Le',
    artist: 'Arijit Singh',
    searchQuery: 'Apna Bana Le Arijit Singh',
    from: '#e6913f',
    to: '#a83f2a',
    plays: '6.9M',
  },
  {
    title: 'Satranga',
    artist: 'Arijit Singh',
    searchQuery: 'Satranga Animal Arijit Singh',
    from: '#2a1f4a',
    to: '#7a2320',
    plays: '5.5M',
  },
  {
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    searchQuery: 'Tum Hi Ho Aashiqui 2',
    from: '#c8613a',
    to: '#7a3a5e',
    plays: '4.7M',
  },
];

export const moodPlaylists: MoodPlaylist[] = [
  {
    id: 'chill',
    name: 'Chill',
    tag: 'Unwind & drift',
    tracks: [
      { title: 'Let Her Go', artist: 'Passenger', searchQuery: 'Let Her Go Passenger' },
      { title: 'Perfect', artist: 'Ed Sheeran', searchQuery: 'Perfect Ed Sheeran' },
      { title: 'Photograph', artist: 'Ed Sheeran', searchQuery: 'Photograph Ed Sheeran' },
      { title: 'Yellow', artist: 'Coldplay', searchQuery: 'Yellow Coldplay' },
      { title: 'Fix You', artist: 'Coldplay', searchQuery: 'Fix You Coldplay' },
    ],
  },
  {
    id: 'focus',
    name: 'Focus',
    tag: 'Deep work flow',
    tracks: [
      { title: 'Interstellar Main Theme', artist: 'Hans Zimmer', searchQuery: 'Interstellar Main Theme Hans Zimmer' },
      { title: 'Time', artist: 'Hans Zimmer', searchQuery: 'Time Inception Hans Zimmer' },
      { title: 'Experience', artist: 'Ludovico Einaudi', searchQuery: 'Experience Ludovico Einaudi' },
      { title: 'Nuvole Bianche', artist: 'Ludovico Einaudi', searchQuery: 'Nuvole Bianche Ludovico Einaudi' },
      { title: 'Cornfield Chase', artist: 'Hans Zimmer', searchQuery: 'Cornfield Chase Hans Zimmer' },
    ],
  },
  {
    id: 'workout',
    name: 'Workout',
    tag: 'Full energy',
    tracks: [
      { title: 'Believer', artist: 'Imagine Dragons', searchQuery: 'Believer Imagine Dragons' },
      { title: 'Thunder', artist: 'Imagine Dragons', searchQuery: 'Thunder Imagine Dragons' },
      { title: 'Stronger', artist: 'Kanye West', searchQuery: 'Stronger Kanye West' },
      { title: 'Eye of the Tiger', artist: 'Survivor', searchQuery: 'Eye of the Tiger Survivor' },
      { title: 'Till I Collapse', artist: 'Eminem', searchQuery: 'Till I Collapse Eminem' },
    ],
  },
  {
    id: 'romance',
    name: 'Romance',
    tag: 'Golden feelings',
    tracks: [
      { title: 'Raataan Lambiyan', artist: 'Arijit Singh', searchQuery: 'Raataan Lambiyan Shershaah' },
      { title: 'Tum Se', artist: 'Arijit Singh', searchQuery: 'Tum Se Arijit Singh' },
      { title: 'Shayad', artist: 'Arijit Singh', searchQuery: 'Shayad Love Aaj Kal Arijit Singh' },
      { title: 'Gerua', artist: 'Arijit Singh', searchQuery: 'Gerua Dilwale Arijit Singh' },
      { title: 'Raabta', artist: 'Arijit Singh', searchQuery: 'Raabta Agent Vinod Arijit Singh' },
    ],
  },
  {
    id: 'party',
    name: 'Party',
    tag: 'Turn it up',
    tracks: [
      { title: 'Kala Chashma', artist: 'Badshah', searchQuery: 'Kala Chashma Baar Baar Dekho' },
      { title: 'London Thumakda', artist: 'Neha Kakkar', searchQuery: 'London Thumakda Queen' },
      { title: 'Gallan Goodiyan', artist: 'Shankar Mahadevan', searchQuery: 'Gallan Goodiyan Dil Dhadakne Do' },
      { title: 'Nachde Ne Saare', artist: 'Jasleen Royal', searchQuery: 'Nachde Ne Saare Baar Baar Dekho' },
      { title: 'Kar Gayi Chull', artist: 'Badshah', searchQuery: 'Kar Gayi Chull Kapoor and Sons' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    tag: 'Open roads',
    tracks: [
      { title: 'Ilahi', artist: 'Arijit Singh', searchQuery: 'Ilahi Yeh Jawaani Hai Deewani' },
      { title: 'Safarnama', artist: 'Lucky Ali', searchQuery: 'Safarnama Tamasha Lucky Ali' },
      { title: 'Dil Dhadakne Do', artist: 'Javed Akhtar', searchQuery: 'Dil Dhadakne Do title track' },
      { title: 'Patakha Guddi', artist: 'Nooran Sisters', searchQuery: 'Patakha Guddi Highway' },
      { title: 'Maahi Ve', artist: 'Shankar Mahadevan', searchQuery: 'Maahi Ve Kal Ho Naa Ho' },
    ],
  },
];

export function getMoodPlaylist(id: string): MoodPlaylist | undefined {
  return moodPlaylists.find((m) => m.id === id);
}
