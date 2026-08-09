'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/** Fades + rises content into view on scroll. */
export function Reveal({ children, delay = 0, y = 40, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Section shell with consistent premium spacing + heading treatment. */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-amber-200 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        {eyebrow}
      </span>
      <h2
        className="text-4xl leading-tight text-white sm:text-5xl"
        style={{ fontFamily: 'Fraunces, serif', fontWeight: 600 }}
      >
        {title}{' '}
        {accent && (
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text italic text-transparent">
            {accent}
          </span>
        )}
      </h2>
      {subtitle && <p className="mt-4 text-lg text-white/65">{subtitle}</p>}
    </Reveal>
  );
}
