'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

/** True only after the component has mounted on the client. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Slow-moving diagonal light rays. */
export function LightRays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute -top-1/2 h-[200%] w-40 rotate-12 bg-gradient-to-b from-amber-200/25 via-orange-200/10 to-transparent blur-2xl"
          style={{ left: `${18 + i * 26}%` }}
          animate={{ x: [0, 40, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** Floating warm particles (like drifting dust in sunlight). */
export function Particles() {
  const mounted = useMounted();
  const dots = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 5,
        dur: 8 + Math.random() * 12,
        delay: Math.random() * 6,
      })),
    [],
  );
  if (!mounted) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-amber-100"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            filter: 'blur(0.5px)',
          }}
          animate={{ y: [0, -60, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** Animated waveform sitting behind the hero content. */
export function BackgroundWaveform() {
  const mounted = useMounted();
  const bars = useMemo(() => Array.from({ length: 60 }, () => 0.2 + Math.random() * 0.8), []);
  if (!mounted) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-64 items-end justify-center gap-1.5 opacity-[0.12]">
      {bars.map((b, i) => (
        <motion.span
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-orange-500 to-amber-200"
          animate={{ height: [`${b * 30}%`, `${b * 100}%`, `${b * 30}%`] }}
          transition={{
            duration: 1.6 + (i % 5) * 0.25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}
