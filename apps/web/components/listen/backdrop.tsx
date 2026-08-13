'use client';

import { motion } from 'framer-motion';

/**
 * Full-screen handcrafted vector artwork: layered organic gradient shapes,
 * floating vinyl-inspired circles, a waveform ribbon and glass reflections
 * over a deep-navy ground. Carries most of the listening-room's visual weight.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="glowEmber" cx="30%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#ffb86b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0b1020" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowTeal" cx="70%" cy="70%" r="60%">
            <stop offset="0%" stopColor="#2ec4b6" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#2ec4b6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0b1020" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flowA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8a3d" />
            <stop offset="55%" stopColor="#ffb86b" />
            <stop offset="100%" stopColor="#2ec4b6" />
          </linearGradient>
          <linearGradient id="flowB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2ec4b6" />
            <stop offset="100%" stopColor="#ff8a3d" />
          </linearGradient>
          <linearGradient id="vinyl" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb86b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0.2" />
          </linearGradient>
          <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="34" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="#0b1020" />
        <rect width="1440" height="900" fill="url(#glowEmber)" />
        <rect width="1440" height="900" fill="url(#glowTeal)" />

        {/* Large flowing organic blobs, softly blurred */}
        <g filter="url(#soft)" opacity="0.7">
          <motion.path
            fill="url(#flowA)"
            initial={{ opacity: 0.7 }}
            animate={{
              d: [
                'M-120,520 C160,360 360,560 560,470 C820,350 900,600 1180,520 C1400,455 1520,720 1520,980 L-160,980 Z',
                'M-120,560 C220,440 340,600 620,500 C860,410 960,640 1200,560 C1420,500 1520,720 1520,980 L-160,980 Z',
                'M-120,520 C160,360 360,560 560,470 C820,350 900,600 1180,520 C1400,455 1520,720 1520,980 L-160,980 Z',
              ],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
        <g filter="url(#soft)" opacity="0.45">
          <motion.ellipse
            cx="1120"
            cy="220"
            rx="360"
            ry="260"
            fill="url(#flowB)"
            animate={{ cx: [1120, 1180, 1120], cy: [220, 180, 220] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* Floating vinyl-inspired concentric circles */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '250px 250px' }}
          opacity="0.5"
        >
          {[210, 165, 120, 75].map((r) => (
            <circle
              key={r}
              cx="250"
              cy="250"
              r={r}
              fill="none"
              stroke="url(#vinyl)"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
          ))}
          <circle cx="250" cy="250" r="30" fill="url(#vinyl)" opacity="0.5" />
        </motion.g>

        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '1230px 700px' }}
          opacity="0.35"
        >
          {[150, 110, 70].map((r) => (
            <circle
              key={r}
              cx="1230"
              cy="700"
              r={r}
              fill="none"
              stroke="#2ec4b6"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          ))}
        </motion.g>

        {/* Waveform-inspired ribbon */}
        <g opacity="0.5" stroke="url(#flowA)" strokeWidth="2" fill="none" strokeLinecap="round">
          {Array.from({ length: 46 }).map((_, i) => {
            const x = 120 + i * 26;
            const base = 150 + Math.sin(i * 0.6) * 34;
            return (
              <motion.line
                key={i}
                x1={x}
                x2={x}
                y1={base}
                y2={base}
                animate={{
                  y1: [base - 8, base - 42 - (i % 5) * 8, base - 8],
                  y2: [base + 8, base + 42 + (i % 5) * 8, base + 8],
                }}
                transition={{
                  duration: 2.4 + (i % 6) * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }}
              />
            );
          })}
        </g>

        {/* Glass reflection sheen */}
        <path d="M0,0 L620,0 L360,900 L0,900 Z" fill="#f8f4ec" opacity="0.03" />
      </svg>

      {/* Soft grain texture */}
      <div className="grain absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      {/* Vignette to seat the artwork */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_20%,transparent_40%,rgba(4,7,16,0.55)_100%)]" />

      {/* Floating ambient particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  );
}

const COLORS = ['#ff8a3d', '#ffb86b', '#2ec4b6', '#f8f4ec'];
const PARTICLES = Array.from({ length: 26 }).map((_, i) => ({
  x: (i * 37.6) % 100,
  y: (i * 53.9) % 100,
  size: 2 + ((i * 7) % 4),
  color: COLORS[i % COLORS.length],
  drift: 40 + ((i * 13) % 70),
  dur: 9 + ((i * 5) % 12),
  delay: (i % 8) * 0.7,
}));
