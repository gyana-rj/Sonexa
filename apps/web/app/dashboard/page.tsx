'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import Backdrop from '@/components/dashboard/backdrop';
import { YouTubePlayer } from '@/components/dashboard/youtube-player';
import { ShareButton } from '@/components/room/share-button';
import { fmt, makeCover, parseUrl, splitTitle, type QueueItem, type Source } from '@/lib/music';
import { deriveRoomView, type RoomStream } from '@/lib/room-state';
import type { StreamPreview } from '@/app/api/streams/preview/route';

const DEFAULT_DURATION = 210; // fallback when a track's real length is unknown
const POLL_MS = 3000;

// Shape returned by GET /api/streams/my
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
    // Both YouTube and (resolved) Spotify tracks store an 11-char YouTube id in
    // extractedId — that's what actually plays. A 22-char legacy Spotify id won't.
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

export default function StreamBeatsPage() {
  const { data: sessionData, status } = useSession();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0); // 0–100, driven by the real player
  const [elapsed, setElapsed] = useState(0); // seconds played
  const [duration, setDuration] = useState(0); // real track length in seconds
  const [playing, setPlaying] = useState(false);
  // Real count of listeners currently live in the room (0 until first heartbeat).
  const [listeners, setListeners] = useState(0);
  // Shareable link to this creator's room, built from their own id.
  const [roomUrl, setRoomUrl] = useState<string | undefined>(undefined);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<StreamPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/streams/my');
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
      if (data.playback?.streamId) {
        setPlaying(Boolean(data.playback.playing));
      }
    } catch {
      setNowPlaying(null);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load once authenticated + keep polling so guest votes/skips sync in.
  useEffect(() => {
    if (status === 'authenticated') {
      load();
      const id = setInterval(load, POLL_MS);
      return () => clearInterval(id);
    }
    if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, load]);

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

  // Reset the progress readout whenever the track changes; the real player
  // (below) then reports actual elapsed time and duration as it plays.
  useEffect(() => {
    setProgress(0);
    setElapsed(0);
    setDuration(0);
  }, [nowPlaying?.id]);

  // Real presence: heartbeat to the server and read back how many listeners are live.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    const ping = async () => {
      try {
        const res = await fetch('/api/presence', { method: 'POST' });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (active) setListeners(data.count ?? 0);
      } catch {
        /* keep the last known count on a transient failure */
      }
    };
    ping();
    const id = setInterval(ping, 10_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [status]);

  // Resolve this creator's id once, to build their shareable room link.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) return;
        const data = (await res.json()) as { id: string };
        if (active && data.id) {
          setCreatorId(data.id);
          setRoomUrl(`${window.location.origin}/room/${data.id}`);
        }
      } catch {
        /* leave the share button in its loading state */
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

  async function advance() {
    if (!creatorId) return;
    try {
      await fetch('/api/streams/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, action: 'advance' }),
      });
    } finally {
      setProgress(0);
      setElapsed(0);
      setDuration(0);
      await load();
    }
  }

  async function togglePlay() {
    if (!creatorId || !nowPlaying) {
      setPlaying((p) => !p);
      return;
    }
    const next = !playing;
    setPlaying(next);
    try {
      await fetch('/api/streams/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          action: 'set',
          streamId: nowPlaying.id,
          playing: next,
        }),
      });
    } catch {
      /* next poll reconciles */
    }
  }

  async function addToQueue() {
    if (!preview || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input.trim() }),
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
    const up = !item.voted;
    // optimistic
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

  const dur = (nowPlaying?.duration || DEFAULT_DURATION);

  // ---- Auth gates ----
  if (status === 'loading') {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Backdrop />
        <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-cream/20 border-t-ember" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !sessionData?.user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <Backdrop />
        <div className="relative w-full max-w-md rounded-[1.75rem] bg-white/[0.045] p-10 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ffb86b] shadow-[0_8px_30px_rgba(255,138,61,0.45)]">
            <span className="h-3 w-3 rounded-full bg-[#0b1020]" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-light text-cream">The Listening Room</h1>
          <p className="mt-3 text-sm text-cream/50">
            Sign in to open your room — queue tracks and let the crowd vote on what plays next.
          </p>
          <button
            onClick={() => signIn()}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-4 py-4 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition hover:brightness-105"
          >
            Sign in to continue
          </button>
          <Link href="/listen" className="mt-4 inline-block text-xs text-cream/40 transition hover:text-cream/70">
            or just search &amp; listen →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0b1020]">
      <Backdrop />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-28 pt-8 md:px-10">
        {/* Masthead */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90" aria-label="Back to home">
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
              <span className="text-xs tabular-nums text-cream/60">
                {listeners.toLocaleString()} listening live
              </span>
            </div>
            <ShareButton url={roomUrl} label="Share room" />
            {creatorId && (
              <Link
                href={`/creator/${creatorId}`}
                className="hidden rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream sm:block"
              >
                Profile
              </Link>
            )}
            <Link
              href="/listen"
              className="hidden rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream sm:block"
            >
              Search
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* SECTION 1 — NOW PLAYING */}
        <section className="mt-16 lg:mt-24">
          <p className="text-center text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Now Playing</p>

          {nowPlaying ? (
            <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Album artwork */}
              <motion.div
                key={nowPlaying.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                className="group relative mx-auto aspect-square w-full max-w-[440px]"
              >
                <div className="absolute -inset-8 rounded-[3rem] bg-[#ff8a3d]/20 blur-3xl transition group-hover:bg-[#ff8a3d]/30" />
                <motion.img
                  src={nowPlaying.cover}
                  alt={`${nowPlaying.title} album artwork`}
                  whileHover={{ scale: 1.02, rotate: -0.6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
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

              {/* Track info + controls */}
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
                  <button className="text-cream/50 transition hover:text-cream" aria-label="Previous">
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
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-md text-center">
              <div className="mx-auto flex aspect-square w-40 items-center justify-center rounded-[2rem] bg-white/[0.04] ring-1 ring-white/10">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ec4b6] to-[#0b1020] ring-4 ring-[#0b1020]" />
              </div>
              <p className="mt-6 font-display text-2xl font-light text-cream">Nothing playing yet</p>
              <p className="mt-2 text-sm text-cream/45">Paste a YouTube or Spotify link below to start the room.</p>
            </div>
          )}

          {/* Real audio playback — an off-screen YouTube player driven by room state. */}
          <YouTubePlayer
            videoId={nowPlaying?.youtubeId ?? null}
            playing={playing}
            onProgress={(cur, d) => {
              setElapsed(cur);
              if (d > 0) {
                setDuration(d);
                setProgress((cur / d) * 100);
              }
            }}
            onEnded={advance}
            onPlayingChange={setPlaying}
          />
        </section>

        {/* SECTION 2 — SUBMIT A SONG */}
        <section className="mx-auto mt-28 max-w-2xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Submit a Song</p>
            <h2 className="mt-4 font-display text-4xl font-light text-cream">Add to the room</h2>
          </div>

          <Glass className="mt-10 p-7 md:p-8">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a YouTube or Spotify link…"
              className="w-full rounded-2xl bg-white/[0.06] px-5 py-4 text-sm text-cream placeholder:text-cream/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-[#ff8a3d]/60"
            />

            <div className="min-h-[96px]">
              <AnimatePresence mode="wait">
                {loadingPreview && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4"
                  >
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
                    <img
                      src={preview.thumbnail || makeCover(preview.title)}
                      alt={`${preview.title} artwork`}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg"
                    />
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
                  <motion.p
                    key="invalid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 px-1 text-sm text-cream/35"
                  >
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
                    Add to Queue
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Glass>
        </section>

        {/* SECTION 3 — UP NEXT */}
        <section className="mx-auto mt-28 max-w-3xl">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Up Next</p>
              <h2 className="mt-4 font-display text-4xl font-light text-cream">The queue</h2>
            </div>
            <motion.span
              key={queue.length}
              initial={{ scale: 1.35, color: '#ff8a3d' }}
              animate={{ scale: 1, color: 'rgba(248,244,236,0.4)' }}
              className="text-sm tabular-nums"
            >
              {queue.length} songs
            </motion.span>
          </div>

          <div className="mt-8 space-y-3">
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-[1.5rem] bg-white/[0.04] p-4">
                    <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </>
            )}

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
                  <img
                    src={song.cover}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover transition group-hover:scale-105"
                  />
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
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4l8 10h-5v6H9v-6H4z" fill={song.voted ? '#ff8a3d' : 'currentColor'} />
                    </svg>
                    <motion.span key={song.votes} initial={{ y: -7, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
                      {song.votes}
                    </motion.span>
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

function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[1.75rem] bg-white/[0.045] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function Icon({ path, fill = false }: { path: string; fill?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d={path} />
    </svg>
  );
}
