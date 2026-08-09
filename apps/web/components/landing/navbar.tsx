'use client';

import { motion } from 'framer-motion';
import { Disc3 } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

const links = ['Discover', 'Playlists', 'Artists', 'Radio'];

export function Navbar() {
  const session = useSession();
  const isSignedIn = !!session.data?.user;

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-8"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 py-2.5 shadow-lg backdrop-blur-xl sm:px-6">
        {/* logo */}
        <a href="#" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-md">
            <Disc3 className="h-5 w-5" />
          </span>
          <span className="text-xl tracking-wide" style={{ fontFamily: 'Fraunces, serif' }}>
            Sonexa
          </span>
        </a>

        {/* links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l}>
              <a
                href="#"
                className="group relative rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:text-white"
              >
                {l}
                <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-amber-300 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        {/* actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => (isSignedIn ? signOut() : signIn())}
            className="rounded-full px-5 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
          >
            {isSignedIn ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
