'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Play,
  Pause,
  Plus,
  X,
  Loader2,
  Music2,
  LogOut,
  Radio,
  SkipForward,
  SkipBack,
  Trash2,
} from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';
import { getMoodPlaylist } from '@/lib/landing-music';
import { Backdrop } from './backdrop';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/dashboard/youtube-player';

function fmt(sec: number): string {
  if (!sec || sec < 0 || !Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ---------- main ---------- */

export function ListenClient({
  userName,
  userImage,
  initialQuery,
  initialMood,
}: {
  userName: string;
  userImage: string | null;
  initialQuery?: string;
  initialMood?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));

  const [current, setCurrent] = useState<SearchResult | null>(null);
  const [queue, setQueue] = useState<SearchResult[]>([]);
  const [playlistLabel, setPlaylistLabel] = useState<string | null>(null);

  // playback state, driven by the real YouTube player
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const autoPlayQueryRef = useRef(initialQuery?.trim() || null);
  const moodLoadedRef = useRef(false);

  /* --- open/close the search overlay --- */
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // focus the field when the overlay opens; close it on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const focus = setTimeout(() => searchInputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [searchOpen]);

  /* --- debounced search --- */
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setSearched(true);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError('Something went wrong searching. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  /* --- queue actions --- */
  const playNow = useCallback((track: SearchResult) => {
    setCurrent(track);
    setElapsed(0);
    setDuration(0);
    setPlaying(true);
    setQueue((q) => q.filter((t) => t.id !== track.id));
    // Kick the iframe in this click handler so autoplay isn't blocked.
    // Pass the id — React state won't have updated yet.
    playerRef.current?.play(track.id);
  }, []);

  /* --- auto-play first result when opened from landing trending --- */
  useEffect(() => {
    const pending = autoPlayQueryRef.current;
    if (!pending || loading || !searched || query.trim() !== pending) return;
    const first = results[0];
    if (!first) return;
    autoPlayQueryRef.current = null;
    setSearchOpen(false);
    playNow(first);
  }, [loading, searched, results, query, playNow]);

  /* --- load mood playlist from landing --- */
  useEffect(() => {
    if (!initialMood || moodLoadedRef.current) return;
    const playlist = getMoodPlaylist(initialMood);
    if (!playlist) return;

    moodLoadedRef.current = true;
    setPlaylistLabel(`${playlist.name} playlist`);
    let cancelled = false;

    (async () => {
      const resolved: SearchResult[] = [];
      for (const track of playlist.tracks) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(track.searchQuery)}`);
          if (!res.ok) continue;
          const data = (await res.json()) as { results: SearchResult[] };
          const first = data.results?.[0];
          if (first) resolved.push(first);
        } catch {
          /* skip failed lookups */
        }
      }
      if (cancelled || resolved.length === 0) return;
      const [first, ...rest] = resolved;
      setCurrent(first!);
      setQueue(rest);
      setElapsed(0);
      setDuration(0);
      setPlaying(true);
      playerRef.current?.play(first!.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialMood]);

  const addToQueue = useCallback(
    (track: SearchResult) => {
      setQueue((q) => {
        if (current?.id === track.id) return q;
        return q.some((t) => t.id === track.id) ? q : [...q, track];
      });
    },
    [current],
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const playNext = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) {
        setCurrent(null);
        setPlaying(false);
        return q;
      }
      const [first, ...rest] = q;
      setCurrent(first!);
      setElapsed(0);
      setDuration(0);
      setPlaying(true);
      playerRef.current?.play(first!.id);
      return rest;
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (!current) return;
    setPlaying((p) => {
      const next = !p;
      if (next) playerRef.current?.play(current.id);
      return next;
    });
  }, [current]);

  const restart = useCallback(() => {
    playerRef.current?.seekTo(0);
    setElapsed(0);
  }, []);

  const seekTo = useCallback(
    (fraction: number) => {
      if (!duration) return;
      const t = Math.max(0, Math.min(1, fraction)) * duration;
      playerRef.current?.seekTo(t);
      setElapsed(t);
    },
    [duration],
  );

  const stop = useCallback(() => {
    setCurrent(null);
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
  }, []);

  return (
    <div className="relative min-h-screen w-full text-cream font-sans">
      <Backdrop />

      {/* real audio playback — an off-screen YouTube player driven by room state */}
      <YouTubePlayer
        ref={playerRef}
        videoId={current?.id ?? null}
        playing={playing}
        onProgress={(cur, d) => {
          setElapsed(cur);
          if (d > 0) setDuration(d);
        }}
        onEnded={playNext}
        onPlayingChange={setPlaying}
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-28 pt-6 sm:px-8">
        {/* Masthead */}
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ember to-amberwarm shadow-[0_8px_30px_rgba(255,138,61,0.45)]">
              <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg tracking-tight text-cream">
                Sonexa
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.32em] text-cream/40">
                Listening Room
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openSearch}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-cream/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-cream"
              aria-label="Search for a song"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs text-cream/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-cream sm:flex"
            >
              <Radio className="h-4 w-4" /> Creator space
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 backdrop-blur-xl">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-ember to-amberwarm text-xs font-semibold text-ink">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-sm text-cream/70 sm:block">
                {userName}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex h-9 w-9 items-center justify-center rounded-full text-cream/60 transition hover:bg-white/10 hover:text-cream"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* SECTION 1 — NOW PLAYING */}
        <section className="mt-14 lg:mt-20">
          <p className="text-center text-xs uppercase tracking-[0.4em] text-amberwarm">
            Now Playing
          </p>
          {playlistLabel && (
            <p className="mt-3 text-center text-sm text-cream/50">{playlistLabel}</p>
          )}

          <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Artwork */}
            <div className="group relative mx-auto aspect-square w-full max-w-[420px]">
              <div className="absolute -inset-8 rounded-[3rem] bg-ember/20 blur-3xl transition group-hover:bg-ember/30" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id ?? 'idle'}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                  className="relative h-full w-full overflow-hidden rounded-[2.25rem] shadow-[0_50px_140px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
                >
                  {current?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.thumbnail}
                      alt={`${current.title} artwork`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink to-[#141a2e] text-cream/40">
                      <Music2 className="h-12 w-12" />
                      <span className="text-sm">Nothing playing yet</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* spinning vinyl badge */}
              <motion.div
                animate={{ rotate: playing ? 360 : 0 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-6 -right-6 flex h-24 w-24 items-center justify-center rounded-full bg-ink/80 ring-1 ring-white/10 backdrop-blur-xl"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal to-ink ring-4 ring-ink">
                  <div className="mx-auto mt-[30px] h-2 w-2 rounded-full bg-cream/60" />
                </div>
              </motion.div>
            </div>

            {/* Track info + controls */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ffbd8f] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" /> YouTube
                </span>
                {current?.duration && (
                  <span className="text-xs tabular-nums text-cream/40">{current.duration}</span>
                )}
              </div>

              <h1 className="mt-6 font-display text-4xl font-light leading-[0.98] tracking-tight text-cream md:text-5xl">
                {current ? current.title : 'Pick a track to begin'}
              </h1>
              <p className="mt-3 truncate text-lg text-cream/50">
                {current ? current.channel : 'Search below and press play'}
              </p>

              {/* Progress */}
              <div className="mt-10 w-full max-w-[460px] lg:mx-0">
                <button
                  type="button"
                  disabled={!current || !duration}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seekTo((e.clientX - rect.left) / rect.width);
                  }}
                  className="group/bar block h-3 w-full cursor-pointer disabled:cursor-default"
                  aria-label="Seek"
                >
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10 transition-all group-hover/bar:h-1.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ember to-amberwarm"
                      style={{
                        width: duration ? `${Math.min(100, (elapsed / duration) * 100)}%` : '0%',
                      }}
                    />
                  </div>
                </button>
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-cream/40">
                  <span>{fmt(elapsed)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 flex items-center justify-center gap-8 lg:justify-start">
                <button
                  onClick={restart}
                  disabled={!current}
                  className="text-cream/50 transition hover:text-cream disabled:opacity-30"
                  aria-label="Restart track"
                >
                  <SkipBack className="h-6 w-6" fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!current}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-ink shadow-[0_12px_40px_rgba(248,244,236,0.25)] transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? (
                    <Pause className="h-6 w-6" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={playNext}
                  disabled={queue.length === 0}
                  className="text-cream/50 transition hover:text-cream disabled:opacity-30"
                  aria-label="Skip to next"
                >
                  <SkipForward className="h-6 w-6" fill="currentColor" />
                </button>
              </div>

              {current && (
                <button
                  onClick={stop}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs text-cream/35 transition hover:text-cream/70"
                >
                  <X className="h-3.5 w-3.5" /> Stop
                </button>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2 — QUEUE */}
        <section className="mx-auto mt-24 max-w-3xl">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-amberwarm">Up Next</p>
              <h2 className="mt-4 font-display text-3xl font-light text-cream sm:text-4xl">
                The queue
              </h2>
            </div>
            <span className="text-sm tabular-nums text-cream/40">
              {queue.length} {queue.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {queue.length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-cream/40">
                Queue is empty — hit Search in the navbar to find tracks and add them with the + button.
              </div>
            )}
            <AnimatePresence initial={false}>
              {queue.map((song, i) => (
                <motion.div
                  key={song.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="group flex items-center gap-4 rounded-[1.5rem] bg-white/[0.04] p-3.5 backdrop-blur-xl transition hover:bg-white/[0.07]"
                >
                  <span className="w-5 text-center text-sm tabular-nums text-cream/25">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => playNow(song)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                    aria-label={`Play ${song.title}`}
                  >
                    {song.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={song.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-white/10">
                        <Music2 className="h-5 w-5 text-cream/40" />
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <Play className="h-5 w-5 fill-cream text-cream" />
                    </span>
                  </button>
                  <button onClick={() => playNow(song)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-cream">{song.title}</p>
                    <p className="mt-1 truncate text-sm text-cream/45">{song.channel}</p>
                  </button>
                  {song.duration && (
                    <span className="hidden shrink-0 text-xs tabular-nums text-cream/40 sm:block">
                      {song.duration}
                    </span>
                  )}
                  <button
                    onClick={() => removeFromQueue(song.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cream/40 transition hover:bg-white/10 hover:text-red-300"
                    aria-label="Remove from queue"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* SEARCH OVERLAY — opens from the navbar, closes on click-away / Esc */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeSearch();
            }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-16 backdrop-blur-md sm:py-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="w-full max-w-2xl"
            >
              <div className="relative text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-amberwarm">Add to the room</p>
                <h2 className="mt-4 font-display text-3xl font-light text-cream sm:text-4xl">
                  What do you want to hear?
                </h2>
                <button
                  onClick={closeSearch}
                  className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-cream/60 transition hover:bg-white/10 hover:text-cream"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-5 py-3.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl focus-within:ring-2 focus-within:ring-ember/60">
                  <Search className="h-5 w-5 shrink-0 text-cream/40" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for songs, artists, albums…"
                    className="w-full bg-transparent text-cream placeholder:text-cream/30 focus:outline-none"
                  />
                  {loading ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amberwarm" />
                  ) : query ? (
                    <button
                      onClick={() => setQuery('')}
                      className="shrink-0 rounded-full p-1 text-cream/50 transition hover:bg-white/10 hover:text-cream"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl bg-red-500/10 p-6 text-center text-sm text-red-200 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}

              {!error && !query && (
                <EmptyState
                  icon={<Music2 className="h-7 w-7" />}
                  title="Start typing to search"
                  subtitle="Play a track instantly or add it to the queue."
                />
              )}

              {!error && searched && !loading && results.length === 0 && query && (
                <EmptyState
                  icon={<Search className="h-7 w-7" />}
                  title={`No results for “${query}”`}
                  subtitle="Try a different spelling or another track."
                />
              )}

              <ul className="mt-5 space-y-2.5 pb-4">
                {results.map((track, i) => (
                  <motion.li
                    key={track.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  >
                    <ResultRow
                      track={track}
                      isCurrent={current?.id === track.id}
                      isQueued={queue.some((t) => t.id === track.id)}
                      onPlay={() => playNow(track)}
                      onQueue={() => addToQueue(track)}
                    />
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- pieces ---------- */

function ResultRow({
  track,
  isCurrent,
  isQueued,
  onPlay,
  onQueue,
}: {
  track: SearchResult;
  isCurrent: boolean;
  isQueued: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl p-2.5 ring-1 transition ${
        isCurrent
          ? 'bg-ember/10 ring-ember/40'
          : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.07] hover:ring-white/20'
      }`}
    >
      <button
        onClick={onPlay}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        aria-label={`Play ${track.title}`}
      >
        {track.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-white/10">
            <Music2 className="h-5 w-5 text-cream/40" />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <Play className="h-5 w-5 fill-cream text-cream" />
        </span>
      </button>

      <button onClick={onPlay} className="min-w-0 flex-1 text-left">
        <p className="truncate text-cream">{track.title}</p>
        <p className="mt-1 truncate text-sm text-cream/50">{track.channel}</p>
      </button>

      {track.isLive ? (
        <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
          LIVE
        </span>
      ) : track.duration ? (
        <span className="shrink-0 text-xs tabular-nums text-cream/45">{track.duration}</span>
      ) : null}

      <button
        onClick={onQueue}
        disabled={isQueued || isCurrent}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          isQueued || isCurrent
            ? 'text-teal/70'
            : 'text-cream/50 hover:bg-white/10 hover:text-amberwarm'
        }`}
        aria-label={isQueued ? 'In queue' : 'Add to queue'}
        title={isQueued ? 'In queue' : 'Add to queue'}
      >
        {isQueued || isCurrent ? <Music2 className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ember/20 to-amberwarm/20 text-amberwarm ring-1 ring-white/10">
        {icon}
      </span>
      <p className="font-display text-lg text-cream">{title}</p>
      <p className="mt-1 text-sm text-cream/50">{subtitle}</p>
    </div>
  );
}
