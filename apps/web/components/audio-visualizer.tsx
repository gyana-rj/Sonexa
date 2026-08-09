'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface AudioVisualizerProps {
  playing: boolean;
  bars?: number;
  className?: string;
  gradient?: string;
}

export function AudioVisualizer({
  playing,
  bars = 48,
  className = '',
  gradient = 'linear-gradient(180deg, #7C3AED 0%, #3B82F6 100%)',
}: AudioVisualizerProps) {
  const configs = useMemo(
    () =>
      Array.from({ length: bars }).map((_, i) => ({
        delay: (i * 0.04) % 0.8,
        duration: 0.7 + ((i * 0.07) % 0.6),
        minHeight: 8 + ((i * 13) % 20),
      })),
    [bars]
  );

  return (
    <div className={`flex items-end justify-center gap-[3px] ${className}`}>
      {configs.map((c, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full"
          style={{
            background: gradient,
            minHeight: c.minHeight,
            transformOrigin: 'bottom',
          }}
          animate={
            playing
              ? { scaleY: [0.3, 1, 0.5, 0.85, 0.4] }
              : { scaleY: 0.15 }
          }
          transition={
            playing
              ? {
                  duration: c.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: c.delay,
                }
              : { duration: 0.4 }
          }
        />
      ))}
    </div>
  );
}
