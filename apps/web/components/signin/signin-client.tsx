'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Disc3, Github, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

/** Turn NextAuth's terse error codes into something a human can act on. */
function errorMessage(code: string): string {
  switch (code) {
    case 'AccessDenied':
      return "We couldn't sign you in with that account. Try again or use a different one.";
    case 'OAuthAccountNotLinked':
      return 'This email is already linked to a different provider. Use the one you signed up with.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'Callback':
      return "Something went wrong reaching the provider. Please try again.";
    case 'Configuration':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    default:
      return 'Something went wrong signing you in. Please try again.';
  }
}

export function SignInClient({
  error,
  callbackUrl,
}: {
  error: string | null;
  callbackUrl: string;
}) {
  const [pending, setPending] = useState<'google' | 'github' | null>(null);

  function go(provider: 'google' | 'github') {
    setPending(provider);
    void signIn(provider, { callbackUrl });
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#160f1f] px-5 py-10 text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-[-8%] h-96 w-96 rounded-full bg-orange-600/20 blur-[150px]" />
        <div className="absolute right-1/5 bottom-[-6%] h-96 w-96 rounded-full bg-rose-700/20 blur-[150px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      </div>

      {/* back to home */}
      <Link
        href="/"
        className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* gradient rim */}
        <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-orange-400/40 via-white/5 to-rose-500/30" />

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* brand */}
          <div className="flex flex-col items-center text-center">
            <motion.span
              initial={{ rotate: -12, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 12 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 shadow-lg shadow-orange-900/40"
            >
              <Disc3 className="h-7 w-7" />
            </motion.span>
            <h1
              className="mt-5 text-3xl font-semibold text-white"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Welcome to Sonexa
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              After signing in, click <strong className="text-white/80">Open app</strong> on the
              home page and search for any song to play it instantly.
            </p>
          </div>

          {/* error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage(error)}</span>
            </motion.div>
          )}

          {/* providers */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => go('google')}
              disabled={pending !== null}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 py-3.5 text-sm font-medium text-[#1a1a1a] shadow-sm transition-all hover:shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === 'google' ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#1a1a1a]/70" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => go('github')}
              disabled={pending !== null}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === 'github' ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              ) : (
                <Github className="h-5 w-5" />
              )}
              Continue with GitHub
            </button>
          </div>

          {/* divider + note */}
          <div className="mt-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-widest text-white/35">Secure sign-in</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
            By continuing you agree to Sonexa&rsquo;s Terms of Service and acknowledge
            our Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
