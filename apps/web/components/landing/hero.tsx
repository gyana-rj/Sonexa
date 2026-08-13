'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, ArrowRight } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { HeroIllustration } from './hero-illustration';
import { GlassPlayer } from './glass-player';
import { FloatingAlbums } from './floating-albums';
import { LightRays, Particles, BackgroundWaveform } from './ambient-effects';

/** The original single-screen hero, self-contained and clipped. */
export function Hero() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const session = useSession();
  const router = useRouter();
  const isSignedIn = !!session.data?.user;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* full-screen vector illustration */}
      <div className="absolute inset-0">
        <motion.div
          className="h-full w-full"
          animate={{ scale: 1.06 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          <HeroIllustration mx={mouse.x} my={mouse.y} />
        </motion.div>
      </div>

      {/* dark gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#140b16]/90 via-[#140b16]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100913] via-transparent to-[#160f1f]/60" />

      {/* dynamic gradient glow */}
      <motion.div
        className="pointer-events-none absolute left-[10%] top-1/3 h-[36rem] w-[36rem] rounded-full bg-orange-500/20 blur-[120px]"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* premium ambient effects */}
      <LightRays />
      <Particles />
      <BackgroundWaveform />

      <FloatingAlbums />

      {/* hero content — center-left */}
      <div className="relative z-30 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pt-28 pb-16 sm:px-10">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-amber-100 backdrop-blur-md"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
            The sound of modern India
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[13vw] leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 600 }}
          >
            Every Song
            <br />
            Has A{' '}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text italic text-transparent">
              Story
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="mt-6 max-w-lg text-lg text-white/75"
          >
            Discover timeless classics, hidden gems, and the soundtrack to every moment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                isSignedIn ? router.push('/listen') : signIn(undefined, { callbackUrl: '/' })
              }
              className="group flex items-center gap-2 rounded-full bg-gradient-to-br from-orange-400 to-red-600 px-7 py-3.5 text-white shadow-xl shadow-orange-900/40"
            >
              <Play className="h-5 w-5 fill-current" />
              {isSignedIn ? 'Open Sonexa' : 'Start Listening'}
            </motion.button>
            
          </motion.div>
        </div>
      </div>

      {/* glass player floating near bottom center */}
      <div className="absolute inset-x-0 bottom-6 z-40 flex justify-center px-4 sm:bottom-10">
        <GlassPlayer />
      </div>
    </section>
  );
}
