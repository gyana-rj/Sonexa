'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Artist } from '@/lib/data';

interface ArtistCardProps {
  artist: Artist;
  className?: string;
}

export function ArtistCard({ artist, className }: ArtistCardProps) {
  return (
    <Link href={`/artist/${artist.id}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'relative rounded-2xl p-3 transition-colors duration-300 hover:bg-white/[0.04]',
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-full shadow-soft">
          <img
            src={artist.image}
            alt={artist.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="mt-3 px-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{artist.name}</h3>
            {artist.verified && (
              <BadgeCheck size={14} className="shrink-0 text-accent" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground mt-0.5">Artist</p>
        </div>
      </motion.div>
    </Link>
  );
}
