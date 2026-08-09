'use client';

import { motion } from 'framer-motion';

interface FloatingArtworkProps {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

export function FloatingArtwork({
  src,
  alt = '',
  size = 200,
  className = '',
}: FloatingArtworkProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
      />
      <img
        src={src}
        alt={alt}
        className="relative rounded-3xl object-cover shadow-lift w-full h-full"
      />
    </motion.div>
  );
}
