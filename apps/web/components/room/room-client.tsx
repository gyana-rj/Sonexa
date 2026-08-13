'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import Backdrop from '@/components/dashboard/backdrop';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/dashboard/youtube-player';
import { ShareButton } from '@/components/room/share-button';
import { fmt, makeCover, parseUrl, splitTitle, type QueueItem, type Source } from '@/lib/music';
import { deriveRoomView, type RoomStream } from '@/lib/room-state';
import { positionFromSnapshot, shouldResync, type PlaybackSnapshot } from '@/lib/room-sync';
import type { StreamPreview } from '@/app/api/streams/preview/route';

const DEFAULT_DURATION = 210;
const POLL_MS = 1500;

// Shape returned by GET /api/streams?creatorId=…
type ApiStream = {
  id: string;
  type: 'Youtube' | 'Spotify';
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  upvote: number;
  haveUpvoted: boolean;
};

function mapStream(s: ApiStream): QueueItem {
  const source: Source = s.type === 'Spotify' ? 'spotify' : 'youtube';
  const raw = s.title || 'Untitled track';
  const { title, artist } = splitTitle(raw);
  return {
    id: s.id,
    title: title || raw,
    artist: artist || (source === 'spotify' ? 'Spotify' : 'YouTube'),
    duration: 0,
    source,
    youtubeId: s.extractedId?.length === 11 ? s.extractedId : undefined,
    cover: s.bigImg || s.smallImg || makeCover(s.id + raw),
    votes: s.upvote ?? 0,
    voted: s.haveUpvoted ?? false,
  };
}

function SourceBadge({ source, className = '' }: { source: Source; className?: string }) {
  const spotify = source === 'spotify';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur ${className}`}
      style={{
        background: spotify ? 'rgba(46,196,182,0.14)' : 'rgba(255,138,61,0.16)',
        color: spotify ? '#7ff0e4' : '#ffbd8f',
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: spotify ? '#2ec4b6' : '#ff8a3d' }} />
      {spotify ? 'Spotify' : 'YouTube'}
    </span>
  );
}

function Icon({ path, fill = false }: { path: string; fill?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d={path} />
    </svg>
  );
}

export function RoomClient({ creatorId }: { creatorId: string }) {
  const { status } = useSession();
  const authed = status === 'authenticated';

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  /** Room intent from the server — never overwritten by local YouTube events. */
  const [playing, setPlaying] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [listeners, setListeners] = useState(0);

  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<StreamPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const playerRef = useRef<YouTubePlayerHandle>(null);
  const elapsedRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const localControlUntilRef = useRef(0);

  const applyPlayback = useCallback((playback: PlaybackSnapshot | null | undefined) => {
    if (!playback?.streamId) return;
    // Don't let a stale poll undo a click the user just made.
    if (Date.now() < localControlUntilRef.current) return;
    const nextPlaying = Boolean(playback.playing);
    setPlaying(nextPlaying);
    const target = positionFromSnapshot(playback);
    if (shouldResync(elapsedRef.current, target) || applyingRemoteRef.current) {
      playerRef.current?.seekTo(target);
      setElapsed(target);
      elapsedRef.current = target;
    }
    if (nextPlaying) {
      applyingRemoteRef.current = true;
      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 800);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/streams?creatorId=${encodeURIComponent(creatorId)}`);
      const data = res.ok
        ? await res.json()
        : { streams: [], playback: { streamId: null, playing: false } };
      const mapped: QueueItem[] = (data.streams ?? []).map(mapStream);

      const slim: RoomStream[] = mapped.map((m) => ({
        id: m.id,
        title: m.title,
        votes: m.votes,
        haveUpvoted: m.voted,
      }));
      const view = deriveRoomView(slim, data.playback ?? null);
      const np = view.nowPlaying
        ? (mapped.find((m) => m.id === view.nowPlaying!.id) ?? null)
        : null;

      setNowPlaying(np);
      setQueue(mapped.filter((m) => m.id !== np?.id).sort((a, b) => b.votes - a.votes));
      applyPlayback(data.playback ?? null);
    } catch {
      setNowPlaying(null);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [creatorId, applyPlayback]);

  // Initial load + periodic refresh so peers' votes, skips, and play/pause stay in sync.
  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Live preview as a link is pasted.
  useEffect(() => {
    const parsed = parseUrl(input);
    if (!parsed) {
      setPreview(null);
      setLoadingPreview(false);
      return;
    }
    setLoadingPreview(true);
    setPreview(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/streams/preview?url=${encodeURIComponent(input.trim())}`);
        const data = await res.json();
        setPreview(data.preview ?? null);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  // Real presence heartbeat (only when signed in — the endpoint keys by user).
  useEffect(() => {
    if (!authed) return;
    let active = true;
    const ping = async () => {
      try {
        const res = await fetch(`/api/presence?creatorId=${encodeURIComponent(creatorId)}`, {
          method: 'POST',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (active) setListeners(data.count ?? 0);
      } catch {
        /* keep last known count */
      }
    };
    ping();
    const id = setInterval(ping, 10_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [authed, creatorId]);

  // Anonymous guests can still read the room presence count.
  useEffect(() => {
    if (authed) return;
    let active = true;
    const ping = async () => {
      try {
        const res = await fetch(`/api/presence?creatorId=${encodeURIComponent(creatorId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (active) setListeners(data.count ?? 0);
      } catch {
        /* ignore */
      }
    };
    ping();
    const id = setInterval(ping, 10_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [authed, creatorId]);

  async function publishPlayback(next: {
    streamId: string;
    playing: boolean;
    positionSec: number;
  }) {
    try {
      await fetch('/api/streams/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          action: 'set',
          streamId: next.streamId,
          playing: next.playing,
          positionSec: next.positionSec,
        }),
      });
    } catch {
      /* next poll reconciles */
    }
  }

  async function advance() {
    try {
      await fetch('/api/streams/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, action: 'advance' }),
      });
    } finally {
      setElapsed(0);
      elapsedRef.current = 0;
      setDuration(0);
      setNeedsUnlock(false);
      await load();
    }
  }

  async function togglePlay() {
    if (!nowPlaying) return;
    const next = !playing;
    localControlUntilRef.current = Date.now() + 2000;
    setPlaying(next);
    setNeedsUnlock(false);
    if (next && nowPlaying.youtubeId) {
      playerRef.current?.play(nowPlaying.youtubeId);
      playerRef.current?.seekTo(elapsedRef.current);
    }
    await publishPlayback({
      streamId: nowPlaying.id,
      playing: next,
      positionSec: elapsedRef.current,
    });
  }

  function unlockAudio() {
    if (!nowPlaying?.youtubeId) return;
    localControlUntilRef.current = Date.now() + 2000;
    setNeedsUnlock(false);
    setPlaying(true);
    playerRef.current?.play(nowPlaying.youtubeId);
    playerRef.current?.seekTo(elapsedRef.current);
    void publishPlayback({
      streamId: nowPlaying.id,
      playing: true,
      positionSec: elapsedRef.current,
    });
  }

  async function addToQueue() {
    if (!preview || submitting) return;
    if (!authed) {
      signIn();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim(), creatorId }),
      });
      if (res.ok) {
        setJustAdded(true);
        setInput('');
        setPreview(null);
        await load();
        setTimeout(() => setJustAdded(false), 1800);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVote(item: QueueItem) {
    if (!authed) {
      signIn();
      return;
    }
    const up = !item.voted;
    setQueue((q) =>
      q
        .map((i) => (i.id === item.id ? { ...i, voted: up, votes: i.votes + (up ? 1 : -1) } : i))
        .sort((a, b) => b.votes - a.votes),
    );
    try {
      await fetch(`/api/streams/${up ? 'upvote' : 'downvote'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: item.id }),
      });
    } finally {
      load();
    }
  }

  const dur = nowPlaying?.duration || DEFAULT_DURATION;
  const progress = duration ? Math.min(100, (elapsed / duration) * 100) : 0;
  const showUnlock = Boolean(playing && needsUnlock && nowPlaying?.youtubeId);

  return (
    <div className="relative min-h-screen w-full bg-[#0b1020]">
      <Backdrop />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-28 pt-8 md:px-10">
        {/* Masthead */}
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90" aria-label="Sonexa home">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ffb86b] shadow-[0_8px_30px_rgba(255,138,61,0.45)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0b1020]" />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg tracking-tight text-cream">StreamBeats</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-cream/40">Listening Room</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ec4b6] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2ec4b6]" />
              </span>
              <span className="text-xs tabular-nums text-cream/60">{listeners.toLocaleString()} listening live</span>
            </div>
            <ShareButton />
            <Link
              href={`/creator/${creatorId}`}
              className="hidden rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream sm:block"
            >
              Host profile
            </Link>
            {!authed && (
              <button
                onClick={() => signIn()}
                className="rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* NOW PLAYING */}
        <section className="mt-16 lg:mt-24">
          <p className="text-center text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Now Playing</p>

          {nowPlaying ? (
            <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                key={nowPlaying.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                className="group relative mx-auto aspect-square w-full max-w-[440px]"
              >
                <div className="absolute -inset-8 rounded-[3rem] bg-[#ff8a3d]/20 blur-3xl transition group-hover:bg-[#ff8a3d]/30" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nowPlaying.cover}
                  alt={`${nowPlaying.title} album artwork`}
                  className="relative h-full w-full rounded-[2.25rem] object-cover shadow-[0_50px_140px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
                />
                <motion.div
                  animate={{ rotate: playing ? 360 : 0 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-6 -right-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0b1020]/80 ring-1 ring-white/10 backdrop-blur-xl"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2ec4b6] to-[#0b1020] ring-4 ring-[#0b1020]">
                    <div className="mx-auto mt-[30px] h-2 w-2 rounded-full bg-cream/60" />
                  </div>
                </motion.div>
              </motion.div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 lg:justify-start">
                  <SourceBadge source={nowPlaying.source} />
                  <span className="text-xs tabular-nums text-cream/40">
                    {listeners.toLocaleString()} {listeners === 1 ? 'listener' : 'listeners'}
                  </span>
                </div>
                <h1 className="mt-6 font-display text-5xl font-light leading-[0.95] tracking-tight text-cream md:text-6xl">
                  {nowPlaying.title}
                </h1>
                <p className="mt-3 text-lg text-cream/50">{nowPlaying.artist}</p>

                {/* Progress */}
                <div className="mt-10 w-full max-w-[460px] lg:mx-0">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] transition-[width] duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] tabular-nums text-cream/40">
                    <span>{fmt(elapsed)}</span>
                    <span>{fmt(duration || dur)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-8 flex items-center justify-center gap-8 lg:justify-start">
                  <button className="text-cream/50 transition hover:text-cream disabled:opacity-30" aria-label="Previous" disabled>
                    <Icon path="M6 5v14M20 5l-9 7 9 7z" />
                  </button>
                  <button
                    onClick={() => void togglePlay()}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-[#0b1020] shadow-[0_12px_40px_rgba(248,244,236,0.25)] transition hover:scale-105"
                    aria-label={playing ? 'Pause' : 'Play'}
                  >
                    {playing ? <Icon path="M7 5h4v14H7zM13 5h4v14h-4z" fill /> : <Icon path="M7 4l14 8-14 8z" fill />}
                  </button>
                  <button
                    onClick={() => void advance()}
                    className="text-cream/50 transition hover:text-cream"
                    aria-label="Skip to next"
                  >
                    <Icon path="M18 5v14M4 5l9 7-9 7z" />
                  </button>
                </div>

                {showUnlock && (
                  <button
                    type="button"
                    onClick={unlockAudio}
                    className="mt-6 w-full max-w-[460px] rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-4 py-3.5 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition hover:brightness-105 lg:mx-0"
                  >
                    Tap to join the music
                  </button>
                )}

                {!nowPlaying.youtubeId && (
                  <p className="mt-4 text-sm text-cream/45">
                    This track isn’t playable yet — try a YouTube link or re-add the Spotify track.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-md text-center">
              <div className="mx-auto flex aspect-square w-40 items-center justify-center rounded-[2rem] bg-white/[0.04] ring-1 ring-white/10">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ec4b6] to-[#0b1020] ring-4 ring-[#0b1020]" />
              </div>
              <p className="mt-6 font-display text-2xl font-light text-cream">
                {loading ? 'Loading the room…' : 'Nothing playing yet'}
              </p>
              <p className="mt-2 text-sm text-cream/45">
                {loading ? 'Fetching the queue.' : 'Be the first to add a track below.'}
              </p>
            </div>
          )}

          {/* Real audio playback */}
          <YouTubePlayer
            ref={playerRef}
            videoId={nowPlaying?.youtubeId ?? null}
            playing={playing}
            onProgress={(cur, d) => {
              elapsedRef.current = cur;
              setElapsed(cur);
              if (d > 0) setDuration(d);
              if (playing && cur > 0.3) setNeedsUnlock(false);
            }}
            onEnded={advance}
            onPlayingChange={(isPlaying) => {
              if (isPlaying) setNeedsUnlock(false);
            }}
            onAutoplayBlocked={() => {
              if (playing && elapsedRef.current < 0.3) setNeedsUnlock(true);
            }}
          />
        </section>

        {/* ADD TO THE ROOM */}
        <section className="mx-auto mt-28 max-w-2xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Add to the room</p>
            <h2 className="mt-4 font-display text-4xl font-light text-cream">Submit a song</h2>
            {!authed && (
              <p className="mt-3 text-sm text-cream/45">
                <button onClick={() => signIn()} className="text-[#ffbd8f] underline-offset-4 hover:underline">
                  Sign in
                </button>{' '}
                to add tracks and vote on what plays next.
              </p>
            )}
          </div>

          <div className="mt-10 rounded-[1.75rem] bg-white/[0.045] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl md:p-8">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a YouTube or Spotify link…"
              className="w-full rounded-2xl bg-white/[0.06] px-5 py-4 text-sm text-cream placeholder:text-cream/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#ff8a3d]/60"
            />

            <div className="min-h-[96px]">
              <AnimatePresence mode="wait">
                {loadingPreview && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
                    <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/10" />
                    </div>
                  </motion.div>
                )}

                {!loadingPreview && preview && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="mt-5 flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.thumbnail || makeCover(preview.title)} alt={`${preview.title} artwork`} className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-cream">{preview.title}</p>
                      {preview.artist && <p className="truncate text-sm text-cream/50">{preview.artist}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <SourceBadge source={preview.source} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {!loadingPreview && !preview && input.length > 0 && (
                  <motion.p key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 px-1 text-sm text-cream/35">
                    Paste a valid YouTube or Spotify track link to preview it.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={addToQueue}
              disabled={!preview || submitting}
              whileTap={{ scale: 0.97 }}
              className="relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-4 py-4 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <AnimatePresence mode="wait" initial={false}>
                {justAdded ? (
                  <motion.span key="added" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center gap-2">
                    ✓ Added to the queue
                  </motion.span>
                ) : submitting ? (
                  <motion.span key="adding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Adding…
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {authed ? 'Add to Queue' : 'Sign in to add'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </section>

        {/* UP NEXT */}
        <section className="mx-auto mt-28 max-w-3xl">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Up Next</p>
              <h2 className="mt-4 font-display text-4xl font-light text-cream">The queue</h2>
            </div>
            <span className="text-sm tabular-nums text-cream/40">
              {queue.length} {queue.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {!loading && queue.length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-cream/40">
                The queue is empty — paste a link above to add the first track.
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
                  className="group flex items-center gap-4 rounded-[1.5rem] bg-white/[0.04] p-3.5 backdrop-blur-xl transition hover:bg-white/[0.07] md:p-4"
                >
                  <span className="w-5 text-center text-sm tabular-nums text-cream/25">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={song.cover} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover transition group-hover:scale-105" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-cream">{song.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="truncate text-sm text-cream/45">{song.artist}</p>
                      <SourceBadge source={song.source} className="hidden sm:inline-flex" />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleVote(song)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                      song.voted
                        ? 'bg-[#ff8a3d]/20 text-[#ffbd8f] ring-1 ring-[#ff8a3d]/40'
                        : 'bg-white/5 text-cream/60 hover:bg-white/10'
                    }`}
                    aria-pressed={song.voted}
                    title={authed ? 'Upvote' : 'Sign in to upvote'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4l8 10h-5v6H9v-6H4z" fill={song.voted ? '#ff8a3d' : 'currentColor'} />
                    </svg>
                    <span className="tabular-nums">{song.votes}</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
