interface HeroIllustrationProps {
  mx?: number; // normalized mouse x, -1..1
  my?: number; // normalized mouse y, -1..1
}

/**
 * Entirely vector, handcrafted scene of a modern Indian neighbourhood
 * during golden hour. Layered background / middle / foreground with
 * atmospheric depth, warm painterly gradients and a soft grain texture.
 */
export function HeroIllustration({ mx = 0, my = 0 }: HeroIllustrationProps) {
  // subtle parallax offsets per depth layer
  const bg = { x: mx * 8, y: my * 6 };
  const mid = { x: mx * 18, y: my * 12 };
  const fg = { x: mx * 34, y: my * 20 };

  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* golden-hour sky */}
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1f4a" />
          <stop offset="34%" stopColor="#7a3a5e" />
          <stop offset="62%" stopColor="#c8613a" />
          <stop offset="82%" stopColor="#e6913f" />
          <stop offset="100%" stopColor="#f6c667" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2cf" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ffd67a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffd67a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="farBuild" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2e57" />
          <stop offset="100%" stopColor="#5b4a6e" />
        </linearGradient>
        <linearGradient id="terracotta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d3663a" />
          <stop offset="100%" stopColor="#a83f2a" />
        </linearGradient>
        <linearGradient id="crimson" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0392b" />
          <stop offset="100%" stopColor="#8f2320" />
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9c48a" />
          <stop offset="100%" stopColor="#d3a35f" />
        </linearGradient>
        <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e3c1" />
          <stop offset="100%" stopColor="#e6cd9c" />
        </linearGradient>
        <linearGradient id="forest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f5d47" />
          <stop offset="100%" stopColor="#1e3f31" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a4530" />
          <stop offset="100%" stopColor="#42221a" />
        </linearGradient>
        <linearGradient id="cafe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#173a3a" />
          <stop offset="100%" stopColor="#0e2626" />
        </linearGradient>
        <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffdf9e" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffdf9e" stopOpacity="0" />
        </radialGradient>
        {/* soft grain */}
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.06" />
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* sky */}
      <rect width="1440" height="900" fill="url(#sky)" />

      {/* BACKGROUND LAYER */}
      <g transform={`translate(${bg.x} ${bg.y})`}>
        <circle cx="1050" cy="300" r="360" fill="url(#sun)" />
        <circle cx="1050" cy="300" r="92" fill="#ffe9b0" opacity="0.9" />

        {/* atmospheric far skyline */}
        <g opacity="0.55" fill="url(#farBuild)">
          <rect x="80" y="360" width="90" height="220" />
          <rect x="200" y="320" width="70" height="260" />
          <rect x="300" y="380" width="110" height="200" />
          <rect x="1160" y="330" width="80" height="250" />
          <rect x="1260" y="300" width="100" height="280" />
          <rect x="1380" y="360" width="80" height="220" />
        </g>
        <g opacity="0.75" fill="url(#farBuild)">
          <rect x="420" y="330" width="120" height="250" />
          <rect x="560" y="300" width="90" height="280" />
          <rect x="820" y="340" width="100" height="240" />
          <rect x="940" y="310" width="120" height="270" />
          {/* little lit windows */}
          <g fill="#ffcf7a" opacity="0.5">
            <rect x="448" y="360" width="10" height="14" />
            <rect x="470" y="360" width="10" height="14" />
            <rect x="448" y="392" width="10" height="14" />
            <rect x="586" y="336" width="10" height="14" />
            <rect x="586" y="368" width="10" height="14" />
            <rect x="966" y="344" width="10" height="14" />
            <rect x="990" y="344" width="10" height="14" />
          </g>
        </g>
        {/* haze band */}
        <rect x="0" y="520" width="1440" height="120" fill="#e6913f" opacity="0.22" filter="url(#soft)" />
      </g>

      {/* MIDDLE GROUND — colourful buildings + palms */}
      <g transform={`translate(${mid.x} ${mid.y})`}>
        {/* left cluster */}
        <rect x="60" y="300" width="180" height="340" fill="url(#terracotta)" />
        <rect x="60" y="300" width="180" height="26" fill="#f4e3c1" opacity="0.35" />
        <g fill="#3a1f18" opacity="0.85">
          <rect x="88" y="352" width="34" height="46" rx="4" />
          <rect x="140" y="352" width="34" height="46" rx="4" />
          <rect x="192" y="352" width="34" height="46" rx="4" />
          <rect x="88" y="430" width="34" height="46" rx="4" />
          <rect x="140" y="430" width="34" height="46" rx="4" />
          <rect x="192" y="430" width="34" height="46" rx="4" />
        </g>
        {/* window glow */}
        <g fill="#ffcf7a" opacity="0.7">
          <rect x="140" y="352" width="34" height="46" rx="4" />
          <rect x="192" y="430" width="34" height="46" rx="4" />
        </g>

        <rect x="250" y="240" width="150" height="400" fill="url(#cream)" />
        <g fill="#7a3a2a" opacity="0.9">
          <rect x="272" y="292" width="30" height="42" rx="4" />
          <rect x="320" y="292" width="30" height="42" rx="4" />
          <rect x="272" y="360" width="30" height="42" rx="4" />
          <rect x="320" y="360" width="30" height="42" rx="4" />
          <rect x="272" y="428" width="30" height="42" rx="4" />
          <rect x="320" y="428" width="30" height="42" rx="4" />
        </g>
        {/* balcony */}
        <rect x="258" y="470" width="134" height="10" fill="#5b2a1f" />
        <rect x="266" y="480" width="6" height="24" fill="#5b2a1f" />
        <rect x="288" y="480" width="6" height="24" fill="#5b2a1f" />
        <rect x="310" y="480" width="6" height="24" fill="#5b2a1f" />
        <rect x="332" y="480" width="6" height="24" fill="#5b2a1f" />
        <rect x="354" y="480" width="6" height="24" fill="#5b2a1f" />
        <rect x="376" y="480" width="6" height="24" fill="#5b2a1f" />

        {/* right cluster */}
        <rect x="1120" y="280" width="170" height="360" fill="url(#crimson)" />
        <rect x="1120" y="280" width="170" height="22" fill="#f4e3c1" opacity="0.3" />
        <g fill="#3a1013" opacity="0.85">
          <rect x="1146" y="330" width="34" height="48" rx="4" />
          <rect x="1202" y="330" width="34" height="48" rx="4" />
          <rect x="1258" y="330" width="20" height="48" rx="4" />
          <rect x="1146" y="410" width="34" height="48" rx="4" />
          <rect x="1202" y="410" width="34" height="48" rx="4" />
        </g>
        <g fill="#ffcf7a" opacity="0.7">
          <rect x="1202" y="330" width="34" height="48" rx="4" />
          <rect x="1146" y="410" width="34" height="48" rx="4" />
        </g>

        <rect x="1290" y="330" width="150" height="310" fill="url(#sand)" />
        <g fill="#7a3a2a" opacity="0.85">
          <rect x="1314" y="378" width="30" height="44" rx="4" />
          <rect x="1362" y="378" width="30" height="44" rx="4" />
          <rect x="1314" y="446" width="30" height="44" rx="4" />
          <rect x="1362" y="446" width="30" height="44" rx="4" />
        </g>

        {/* forest-green tower centre-left */}
        <rect x="410" y="330" width="90" height="310" fill="url(#forest)" />
        <g fill="#0f221a" opacity="0.7">
          <rect x="430" y="366" width="20" height="30" rx="3" />
          <rect x="462" y="366" width="20" height="30" rx="3" />
          <rect x="430" y="410" width="20" height="30" rx="3" />
          <rect x="462" y="410" width="20" height="30" rx="3" />
        </g>

        {/* palm trees */}
        <PalmTree x={520} y={640} s={1.1} />
        <PalmTree x={1080} y={640} s={0.9} />
        <PalmTree x={30} y={640} s={0.8} />

        {/* string of festival lights */}
        <path d="M250 250 Q 340 300 410 260" stroke="#3a1f18" strokeWidth="2" fill="none" opacity="0.7" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={266 + i * 26}
            cy={262 + Math.sin(i) * 8 + (i > 2 ? (i - 2) * 4 : 0)}
            r="5"
            fill={["#ffd67a", "#ff8a5c", "#8fd4b0", "#ffd67a", "#ff8a5c", "#8fd4b0"][i]}
          />
        ))}
      </g>

      {/* ground / street */}
      <path d="M0 620 L1440 600 L1440 900 L0 900 Z" fill="url(#ground)" />
      <path d="M0 640 L1440 620 L1440 900 L0 900 Z" fill="#000" opacity="0.12" />

      {/* FOREGROUND LAYER — café, people, scooters, musician */}
      <g transform={`translate(${fg.x} ${fg.y})`}>
        {/* soft lamp glows */}
        <circle cx="620" cy="560" r="150" fill="url(#lamp)" opacity="0.6" />
        <circle cx="360" cy="600" r="120" fill="url(#lamp)" opacity="0.5" />

        {/* --- MUSIC CAFÉ / RECORD SHOP --- */}
        <g>
          <rect x="500" y="440" width="300" height="220" fill="url(#cafe)" />
          {/* awning */}
          <path d="M486 468 L814 468 L790 500 L510 500 Z" fill="#c0392b" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path
              key={i}
              d={`M${510 + i * 36} 500 L${498 + i * 36} 468 L${534 + i * 36} 468 L${546 + i * 36} 500 Z`}
              fill={i % 2 ? "#e9c48a" : "#c0392b"}
              opacity={i % 2 ? 0.95 : 1}
            />
          ))}
          {/* sign */}
          <rect x="560" y="416" width="180" height="34" rx="6" fill="#0e2626" stroke="#ffd67a" strokeWidth="2" />
          <text
            x="650"
            y="440"
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontSize="22"
            fill="#ffd67a"
            letterSpacing="3"
          >
            SONEXA
          </text>
          {/* warm window */}
          <rect x="524" y="512" width="120" height="120" rx="6" fill="#ffcf7a" opacity="0.9" />
          <rect x="524" y="512" width="120" height="120" rx="6" fill="url(#lamp)" />
          {/* vinyl records in window */}
          <circle cx="560" cy="548" r="18" fill="#1a1a1a" />
          <circle cx="560" cy="548" r="5" fill="#ff8a5c" />
          <circle cx="608" cy="548" r="18" fill="#1a1a1a" />
          <circle cx="608" cy="548" r="5" fill="#8fd4b0" />
          {/* door */}
          <rect x="668" y="524" width="96" height="108" rx="4" fill="#0a1c1c" />
          <rect x="668" y="524" width="96" height="108" rx="4" fill="#ffcf7a" opacity="0.25" />
          <circle cx="752" cy="580" r="4" fill="#ffd67a" />

          {/* interior silhouettes seen through window */}
          <g fill="#5b2a1f" opacity="0.7">
            <circle cx="700" cy="556" r="12" />
            <rect x="690" y="566" width="20" height="30" rx="6" />
          </g>
        </g>

        {/* hanging café lamp */}
        <line x1="470" y1="440" x2="470" y2="490" stroke="#0e2626" strokeWidth="3" />
        <path d="M458 490 L482 490 L488 508 L452 508 Z" fill="#0e2626" />
        <circle cx="470" cy="510" r="6" fill="#ffdf9e" />
        <circle cx="470" cy="510" r="26" fill="url(#lamp)" />

        {/* --- STREET MUSICIAN (guitar) --- */}
        <g transform="translate(360 520)">
          {/* body */}
          <circle cx="0" cy="-58" r="18" fill="#3a1f18" />
          <path d="M-20 -40 Q 0 -50 20 -40 L24 30 L-24 30 Z" fill="#8f2320" />
          {/* legs seated */}
          <rect x="-22" y="30" width="16" height="34" rx="6" fill="#2a140f" />
          <rect x="6" y="30" width="16" height="34" rx="6" fill="#2a140f" />
          {/* guitar */}
          <ellipse cx="18" cy="6" rx="20" ry="26" fill="#d3663a" transform="rotate(28 18 6)" />
          <circle cx="18" cy="6" r="7" fill="#3a1f18" transform="rotate(28 18 6)" />
          <rect x="20" y="-40" width="6" height="46" rx="3" fill="#3a1f18" transform="rotate(28 18 6)" />
          {/* arm */}
          <path d="M0 -34 Q 24 -20 30 -4" stroke="#3a1f18" strokeWidth="9" fill="none" strokeLinecap="round" />
          {/* music notes */}
          <g fill="#ffd67a" opacity="0.9">
            <circle cx="52" cy="-70" r="4" />
            <rect x="55" y="-92" width="2.5" height="22" />
            <circle cx="74" cy="-96" r="3.5" />
            <rect x="76.5" y="-116" width="2" height="20" />
          </g>
        </g>

        {/* --- VINTAGE SCOOTERS --- */}
        <Scooter x={900} y={600} color="#2f5d47" s={1.05} />
        <Scooter x={1120} y={636} color="#c8613a" s={0.9} />

        {/* --- PEOPLE listening / socialising --- */}
        {/* couple near café */}
        <Person x={470} y={620} body="#173a3a" head="#5b2a1f" s={1} />
        <Person x={512} y={624} body="#8f2320" head="#6b3423" s={0.96} />
        {/* person with headphones */}
        <g transform="translate(840 604)">
          <Person x={0} y={0} body="#2a1f4a" head="#5b2a1f" s={1.02} />
          <path d="M-13 -74 Q 0 -92 13 -74" stroke="#1a1a1a" strokeWidth="4" fill="none" />
          <rect x="-18" y="-76" width="8" height="12" rx="3" fill="#1a1a1a" />
          <rect x="10" y="-76" width="8" height="12" rx="3" fill="#1a1a1a" />
        </g>
        {/* walking pair right */}
        <Person x={1010} y={636} body="#d3663a" head="#6b3423" s={1.04} />
        <Person x={1050} y={640} body="#e9c48a" head="#5b2a1f" s={0.98} />
        {/* lone left */}
        <Person x={210} y={648} body="#8f2320" head="#5b2a1f" s={1.06} />

        {/* potted plants foreground */}
        <PottedPlant x={760} y={648} s={1} />
        <PottedPlant x={300} y={660} s={1.1} />
      </g>

      {/* warm overall glaze + vignette */}
      <rect width="1440" height="900" fill="#e6913f" opacity="0.06" />
      <rect width="1440" height="900" fill="url(#grain)" opacity="0.5" />
    </svg>
  );
}

function PalmTree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-6 0 Q -10 -80 0 -140 Q 4 -80 6 0 Z" fill="#3a2418" />
      <g fill="#2f5d47">
        <path d="M0 -140 Q -60 -150 -96 -120 Q -54 -138 0 -132 Z" />
        <path d="M0 -140 Q 60 -150 96 -120 Q 54 -138 0 -132 Z" />
        <path d="M0 -142 Q -30 -200 -70 -212 Q -30 -180 0 -138 Z" />
        <path d="M0 -142 Q 30 -200 70 -212 Q 30 -180 0 -138 Z" />
        <path d="M0 -144 Q -8 -210 0 -238 Q 8 -210 0 -144 Z" />
      </g>
      <g fill="#1e3f31">
        <path d="M0 -138 Q -40 -128 -78 -140 Q -40 -152 0 -142 Z" />
        <path d="M0 -138 Q 40 -128 78 -140 Q 40 -152 0 -142 Z" />
      </g>
    </g>
  );
}

function PottedPlant({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16 0 L16 0 L12 -26 L-12 -26 Z" fill="#a83f2a" />
      <g fill="#2f5d47">
        <path d="M0 -26 Q -20 -50 -26 -78 Q -8 -54 0 -30 Z" />
        <path d="M0 -26 Q 20 -50 26 -78 Q 8 -54 0 -30 Z" />
        <path d="M0 -28 Q -6 -60 0 -84 Q 6 -60 0 -28 Z" />
      </g>
    </g>
  );
}

function Scooter({ x, y, color, s }: { x: number; y: number; color: string; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* wheels */}
      <circle cx="-38" cy="0" r="16" fill="#1a1a1a" />
      <circle cx="-38" cy="0" r="6" fill="#5b5b5b" />
      <circle cx="40" cy="0" r="16" fill="#1a1a1a" />
      <circle cx="40" cy="0" r="6" fill="#5b5b5b" />
      {/* body */}
      <path d="M-42 -6 Q -30 -34 6 -34 L 30 -34 L 44 -8 Q 20 -18 -12 -12 Q -30 -12 -42 -6 Z" fill={color} />
      <path d="M-30 -34 Q -26 -52 -6 -52 L 0 -34 Z" fill={color} />
      {/* seat */}
      <rect x="-8" y="-40" width="34" height="10" rx="5" fill="#2a140f" />
      {/* handlebar */}
      <line x1="-26" y1="-50" x2="-40" y2="-30" stroke="#2a140f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="-42" cy="-30" r="4" fill="#2a140f" />
      {/* headlight */}
      <circle cx="-46" cy="-24" r="5" fill="#ffdf9e" />
    </g>
  );
}

function Person({
  x,
  y,
  body,
  head,
  s,
}: {
  x: number;
  y: number;
  body: string;
  head: string;
  s: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity="0.18" />
      <path d="M-14 0 Q -16 -46 0 -50 Q 16 -46 14 0 Z" fill={body} />
      <circle cx="0" cy="-64" r="12" fill={head} />
    </g>
  );
}
