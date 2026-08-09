'use client';

import { motion } from 'framer-motion';

interface EqualizerBarsProps {
  playing: boolean;
  bars?: number;
  className?: string;
  color?: string;
}

export function EqualizerBars({
  playing,
  bars = 4,
  className = '',
  color = 'currentColor',
}: EqualizerBarsProps) {
  return (
    <div className={`flex items-end gap-[2px] ${className}`} style={{ height: '14px' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[2.5px] rounded-full"
          style={{ background: color, height: '100%' }}
          animate={
            playing
              ? { scaleY: [0.25, 1, 0.4, 0.8, 0.3] }
              : { scaleY: 0.25 }
          }
          transition={
            playing
              ? {
                  duration: 0.9 + i * 0.12,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.08,
                }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
