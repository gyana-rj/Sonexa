/**
 * Small handcrafted vector scenes for each mood, in the same warm
 * golden-hour palette as the hero illustration. viewBox 0 0 200 200.
 */
type ArtProps = { className?: string };

const wrap = "h-full w-full";

export function ChillArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-chill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2e57" />
          <stop offset="100%" stopColor="#c8613a" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-chill)" />
      <circle cx="150" cy="60" r="34" fill="#ffd67a" opacity="0.9" />
      {/* hammock between palms */}
      <path d="M20 90 Q 100 150 180 90" stroke="#2a140f" strokeWidth="4" fill="none" />
      <path d="M30 96 Q 100 138 170 96 L170 108 Q 100 150 30 108 Z" fill="#8f2320" />
      <rect x="24" y="70" width="6" height="120" fill="#3a2418" />
      <rect x="170" y="70" width="6" height="120" fill="#3a2418" />
      <path d="M27 70 Q 0 60 -6 78 Q 18 64 27 74 Z" fill="#2f5d47" />
      <path d="M173 70 Q 200 60 206 78 Q 182 64 173 74 Z" fill="#2f5d47" />
    </svg>
  );
}

export function FocusArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-focus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#173a3a" />
          <stop offset="100%" stopColor="#0e2626" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-focus)" />
      <circle cx="100" cy="90" r="46" fill="none" stroke="#ffd67a" strokeWidth="2" opacity="0.5" />
      <circle cx="100" cy="90" r="30" fill="none" stroke="#e9c48a" strokeWidth="2" opacity="0.7" />
      {/* headphones */}
      <path d="M60 100 Q 100 40 140 100" stroke="#d3663a" strokeWidth="8" fill="none" />
      <rect x="52" y="98" width="16" height="30" rx="8" fill="#a83f2a" />
      <rect x="132" y="98" width="16" height="30" rx="8" fill="#a83f2a" />
      <rect x="90" y="150" width="20" height="20" rx="4" fill="#ffd67a" opacity="0.8" />
    </svg>
  );
}

export function WorkoutArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-work" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0392b" />
          <stop offset="100%" stopColor="#7a2320" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-work)" />
      {/* equaliser bars = energy */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={30 + i * 25}
          y={140 - (i % 2 ? 70 : 45)}
          width="16"
          height={i % 2 ? 90 : 65}
          rx="6"
          fill={i % 2 ? "#ffd67a" : "#e9c48a"}
          opacity={0.9}
        />
      ))}
      {/* dumbbell */}
      <rect x="70" y="150" width="60" height="10" rx="5" fill="#2a140f" />
      <circle cx="70" cy="155" r="12" fill="#2a140f" />
      <circle cx="130" cy="155" r="12" fill="#2a140f" />
    </svg>
  );
}

export function RomanceArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-rom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a3a5e" />
          <stop offset="100%" stopColor="#c8613a" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-rom)" />
      <circle cx="100" cy="70" r="40" fill="#ffd67a" opacity="0.85" />
      {/* two silhouettes */}
      <g fill="#3a1013">
        <path d="M60 190 Q 58 130 78 126 Q 96 130 92 190 Z" />
        <circle cx="76" cy="116" r="13" />
        <path d="M108 190 Q 106 130 126 126 Q 144 130 140 190 Z" />
        <circle cx="124" cy="116" r="13" />
      </g>
      {/* heart note */}
      <path d="M100 96 q -10 -14 -20 -4 q -8 8 20 26 q 28 -18 20 -26 q -10 -10 -20 4 Z" fill="#ff8a5c" />
    </svg>
  );
}

export function PartyArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-party" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1f4a" />
          <stop offset="100%" stopColor="#8f2320" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-party)" />
      {/* disco / light beams */}
      <circle cx="100" cy="40" r="18" fill="#ffd67a" />
      <path d="M100 40 L20 200 L60 200 Z" fill="#ff8a5c" opacity="0.35" />
      <path d="M100 40 L100 200 L140 200 Z" fill="#8fd4b0" opacity="0.3" />
      <path d="M100 40 L180 200 L140 200 Z" fill="#ffd67a" opacity="0.35" />
      {/* confetti notes */}
      <g fill="#ffd67a">
        <circle cx="46" cy="90" r="5" />
        <circle cx="150" cy="80" r="5" />
        <circle cx="70" cy="140" r="4" />
        <circle cx="140" cy="150" r="4" />
      </g>
    </svg>
  );
}

export function TravelArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className ?? wrap} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="m-trav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6913f" />
          <stop offset="100%" stopColor="#2f5d47" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#m-trav)" />
      <circle cx="150" cy="55" r="26" fill="#fff2cf" opacity="0.9" />
      {/* rolling hills */}
      <path d="M0 140 Q 60 110 120 140 T 240 140 L240 200 L0 200 Z" fill="#1e3f31" />
      <path d="M0 160 Q 70 135 140 160 T 260 160 L260 200 L0 200 Z" fill="#173a3a" />
      {/* winding road */}
      <path d="M100 200 Q 120 160 90 140 Q 60 120 100 100" stroke="#e9c48a" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* scooter dot */}
      <circle cx="96" cy="150" r="6" fill="#c0392b" />
    </svg>
  );
}
