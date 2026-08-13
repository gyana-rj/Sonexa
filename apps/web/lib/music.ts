export type Source = 'youtube' | 'spotify';

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds (0 if unknown)
  source: Source;
  youtubeId?: string;
  cover: string;
};

export type QueueItem = Track & { votes: number; voted: boolean };

const PALETTES = [
  ['#ff8a3d', '#ffb86b', '#2ec4b6'],
  ['#2ec4b6', '#0b1020', '#ff8a3d'],
  ['#ffb86b', '#ff8a3d', '#f8f4ec'],
  ['#2ec4b6', '#ffb86b', '#0b1020'],
  ['#ff8a3d', '#0b1020', '#2ec4b6'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

/** Deterministic abstract gradient cover as an SVG data URI — a graceful fallback when no thumbnail exists. */
export function makeCover(seed: string): string {
  const h = hash(seed);
  const [a, b, c] = PALETTES[h % PALETTES.length]!;
  const cx = 20 + (h % 60);
  const cy = 25 + ((h >> 3) % 55);
  const rot = h % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1' gradientTransform='rotate(${rot} .5 .5)'>
        <stop offset='0' stop-color='${a}'/><stop offset='.55' stop-color='${b}'/><stop offset='1' stop-color='${c}'/>
      </linearGradient>
      <radialGradient id='r' cx='${cx}%' cy='${cy}%' r='70%'>
        <stop offset='0' stop-color='${c}' stop-opacity='.9'/><stop offset='1' stop-color='${a}' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='600' height='600' fill='${a}'/>
    <rect width='600' height='600' fill='url(#g)'/>
    <circle cx='${cx * 6}' cy='${cy * 6}' r='260' fill='url(#r)'/>
    <g fill='none' stroke='#f8f4ec' stroke-opacity='.14'>
      ${[220, 170, 120, 70].map((rr) => `<circle cx='300' cy='300' r='${rr}'/>`).join('')}
    </g>
    <circle cx='300' cy='300' r='28' fill='#0b1020' fill-opacity='.35'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function fmt(sec: number): string {
  if (!sec || sec < 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type Parsed = { source: Source; key: string; youtubeId?: string } | null;

export function parseUrl(raw: string): Parsed {
  const url = raw.trim();
  if (!url) return null;
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (yt) return { source: 'youtube', key: yt[1]!, youtubeId: yt[1]! };
  const sp = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/);
  if (sp) return { source: 'spotify', key: sp[1]! };
  return null;
}

/** Split a raw video title into an "Artist — Song" pair when the title follows that common form. */
export function splitTitle(raw: string): { title: string; artist: string } {
  const m = raw.match(/^(.{1,60}?)\s+[-–—|]\s+(.+)$/);
  if (m) return { artist: m[1]!.trim(), title: m[2]!.trim() };
  return { title: raw, artist: '' };
}
