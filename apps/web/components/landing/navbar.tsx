'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc3 } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

export function Navbar() {
  const session = useSession();
  const isSignedIn = !!session.data?.user;

  return (
    <>
      <AnimatePresence>
        {isSignedIn && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-0 top-[4.75rem] z-40 px-4 sm:top-[5rem] sm:px-8"
          >
            <p className="mx-auto max-w-2xl rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-100/90 backdrop-blur-md">
              You&apos;re signed in — click{' '}
              <span className="font-medium text-white">Open app</span> above, then search for any
              song to start listening.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-8"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-white/10 px-4 py-2.5 shadow-lg backdrop-blur-xl sm:px-6">
          {/* logo */}
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-md">
              <Disc3 className="h-5 w-5" />
            </span>
            <span className="text-xl tracking-wide" style={{ fontFamily: 'Fraunces, serif' }}>
              Sonexa
            </span>
          </Link>

          {/* links */}
          <ul className="hidden items-center gap-1 md:flex">
            <li>
              <Link
                href={isSignedIn ? '/listen' : '/signin?callbackUrl=/listen'}
                className="group relative rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:text-white"
              >
                Radio
                <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-amber-300 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          </ul>

          {/* actions */}
          <div className="flex items-center gap-2">
            {isSignedIn && (
              <Link
                href="/listen"
                className="rounded-full bg-gradient-to-r from-orange-400 to-red-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-105"
              >
                Open app
              </Link>
            )}
            <button
              onClick={() =>
                isSignedIn ? signOut({ callbackUrl: '/' }) : signIn(undefined, { callbackUrl: '/' })
              }
              className="rounded-full px-5 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
            >
              {isSignedIn ? 'Sign Out' : 'Sign In'}
            </button>
          </div>
        </nav>
      </motion.header>
    </>
  );
}
