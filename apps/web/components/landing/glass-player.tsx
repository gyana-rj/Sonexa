'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle } from 'lucide-react';

/** Premium glassmorphism music player with a live visualiser. */
export function GlassPlayer() {
  const [playing, setPlaying] = useState(true);
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
      className="w-full max-w-xl"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl sm:p-5">
        {/* inner glow */}
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-orange-400/10 via-transparent to-amber-300/10" />

        <div className="relative flex items-center gap-4">
          {/* rotating vinyl / cover */}
          <div className="relative shrink-0">
            <motion.div
              className="h-16 w-16 rounded-full bg-[conic-gradient(from_0deg,#1a1a1a,#3a1f18,#1a1a1a)] sm:h-20 sm:w-20"
              animate={{ rotate: playing ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute inset-0 m-auto flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-red-600" />
              </div>
            </motion.div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-white" style={{ fontFamily: 'Fraunces, serif' }}>
                  Golden Hour
                </p>
                <p className="truncate text-sm text-white/60">Meera &amp; The Alleys</p>
              </div>
              <button
                onClick={() => setLiked((v) => !v)}
                className="shrink-0 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Like"
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {/* live visualiser */}
            <div className="mt-2 flex h-8 items-end gap-[3px]">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-[3px] flex-1 rounded-full bg-gradient-to-t from-orange-500 to-amber-200"
                  animate={{
                    height: playing ? ['20%', `${30 + ((i * 37) % 70)}%`, '20%'] : '20%',
                  }}
                  transition={{
                    duration: 0.9 + (i % 6) * 0.12,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.03,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="relative mt-4 flex items-center gap-3 text-xs text-white/60">
          <span>1:42</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-300"
              initial={{ width: '10%' }}
              animate={{ width: playing ? '62%' : '38%' }}
              transition={{ duration: 1 }}
            />
          </div>
          <span>3:58</span>
        </div>

        {/* controls */}
        <div className="relative mt-4 flex items-center justify-center gap-5 text-white">
          <button className="text-white/60 transition-colors hover:text-white" aria-label="Shuffle">
            <Shuffle className="h-5 w-5" />
          </button>
          <button className="text-white/80 transition-transform hover:scale-110" aria-label="Previous">
            <SkipBack className="h-6 w-6 fill-current" />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => setPlaying((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-lg shadow-orange-900/40"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
          </motion.button>
          <button className="text-white/80 transition-transform hover:scale-110" aria-label="Next">
            <SkipForward className="h-6 w-6 fill-current" />
          </button>
          <button className="text-white/60 transition-colors hover:text-white" aria-label="Repeat">
            <span className="text-sm tracking-widest">∞</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
