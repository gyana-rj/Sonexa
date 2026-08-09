'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface Album {
  title: string;
  artist: string;
  from: string;
  to: string;
}

const albums: Album[] = [
  { title: 'Monsoon Letters', artist: 'Aarav Sen', from: '#c0392b', to: '#7a2320' },
  { title: 'Golden Hour', artist: 'Meera & The Alleys', from: '#d3663a', to: '#a83f2a' },
  { title: 'Bazaar Nights', artist: 'Kabir Roy', from: '#2f5d47', to: '#173a3a' },
];

/** Floating, softly bobbing album cards scattered around the hero. */
export function FloatingAlbums() {
  const positions = [
    'right-[6%] top-[22%] hidden lg:block',
    'right-[16%] top-[52%] hidden xl:block',
    'right-[3%] bottom-[16%] hidden lg:block',
  ];
  return (
    <>
      {albums.map((a, i) => (
        <motion.div
          key={a.title}
          className={`absolute z-20 ${positions[i]}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 + i * 0.2, duration: 0.8 }}
        >
          <motion.div
            className="group w-56 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl"
            animate={{ y: [0, -14, 0], rotate: [i % 2 ? -2 : 2, i % 2 ? 1 : -1, i % 2 ? -2 : 2] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05, y: -6 }}
          >
            <div
              className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl"
              style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-black/30 bg-black/40">
                  <div className="m-auto mt-6 h-4 w-4 rounded-full bg-amber-200/70" />
                </div>
              </div>
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
            </div>
            <p className="truncate text-white" style={{ fontFamily: 'Fraunces, serif' }}>
              {a.title}
            </p>
            <p className="truncate text-sm text-white/60">{a.artist}</p>
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}
