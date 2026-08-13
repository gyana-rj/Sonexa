'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/* Minimal typing for the YouTube IFrame API surface we use. */
type YTPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

/** Imperative handle for driving the player from a parent (e.g. seek/restart). */
export type YouTubePlayerHandle = {
  seekTo: (seconds: number) => void;
  /** Start playback under a user gesture when possible. */
  play: (videoId?: string) => void;
};

type YTNamespace = {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function isValidVideoId(id: string | null | undefined): id is string {
  return typeof id === 'string' && YT_ID_RE.test(id);
}

let apiPromise: Promise<void> | null = null;

/** Load the YouTube IFrame API script once, resolving when it's ready. */
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const finish = () => {
      if (window.YT?.Player) resolve();
    };

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      finish();
    };

    // Script may already be on the page from a prior mount / HMR.
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // If the API finished loading before we hooked the callback, poll once.
    const poll = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(poll);
        finish();
      }
    }, 50);
  });

  return apiPromise;
}

/**
 * Real audio playback for the room. Renders a tiny in-viewport YouTube player
 * (off-screen / display:none iframes are often blocked by browsers) and drives
 * it from React state with correct ready/play sequencing.
 */
export const YouTubePlayer = forwardRef<
  YouTubePlayerHandle,
  {
    videoId: string | null;
    playing: boolean;
    onProgress?: (current: number, duration: number) => void;
    onEnded?: () => void;
    /** Fires when the iframe reports PLAYING / PAUSED. Do not treat as room authority. */
    onPlayingChange?: (playing: boolean) => void;
    /** Browser blocked unmuted autoplay — parent should show a tap-to-listen gate. */
    onAutoplayBlocked?: () => void;
  }
>(function YouTubePlayer(
  { videoId, playing, onProgress, onEnded, onPlayingChange, onAutoplayBlocked },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  const autoplayWatch = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True once YouTube reports PLAYING for the current videoId. */
  const everPlayedRef = useRef(false);
  // Avoid SSR/client hydration mismatches — this player is browser-only.
  const [mounted, setMounted] = useState(false);

  // Keep the latest desired state in refs so async onReady / effects stay in sync.
  const videoIdRef = useRef(videoId);
  const playingRef = useRef(playing);
  videoIdRef.current = videoId;
  playingRef.current = playing;

  const cb = useRef({ onProgress, onEnded, onPlayingChange, onAutoplayBlocked });
  cb.current = { onProgress, onEnded, onPlayingChange, onAutoplayBlocked };

  useEffect(() => {
    setMounted(true);
  }, []);

  const watchAutoplay = () => {
    if (autoplayWatch.current) clearTimeout(autoplayWatch.current);
    autoplayWatch.current = setTimeout(() => {
      if (!playingRef.current || everPlayedRef.current) return;
      const cur = playerRef.current;
      if (!cur || typeof cur.getCurrentTime !== 'function') return;
      // Only treat as blocked when media never actually started.
      const t = cur.getCurrentTime() || 0;
      const d = typeof cur.getDuration === 'function' ? cur.getDuration() || 0 : 0;
      if (t < 0.2 && d === 0) {
        cb.current.onAutoplayBlocked?.();
      }
    }, 2000);
  };

  const loadAndPlay = (id: string) => {
    const p = playerRef.current;
    if (!p || !readyRef.current || !isValidVideoId(id)) return;
    if (activeIdRef.current !== id) everPlayedRef.current = false;
    activeIdRef.current = id;
    p.loadVideoById(id);
    watchAutoplay();
  };

  const cue = (id: string) => {
    const p = playerRef.current;
    if (!p || !readyRef.current || !isValidVideoId(id)) return;
    activeIdRef.current = id;
    p.cueVideoById(id);
  };

  /** Apply the current videoId + playing intent to a ready player. */
  const syncPlayback = () => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;

    const id = videoIdRef.current;
    if (!isValidVideoId(id)) {
      activeIdRef.current = null;
      try {
        p.pauseVideo();
      } catch {
        /* ignore */
      }
      return;
    }

    if (playingRef.current) {
      // Skip if this id was already started via the imperative play() path.
      if (activeIdRef.current === id) {
        try {
          p.playVideo();
        } catch {
          /* ignore */
        }
        return;
      }
      loadAndPlay(id);
    } else if (activeIdRef.current !== id) {
      cue(id);
    } else {
      try {
        p.pauseVideo();
      } catch {
        /* ignore */
      }
    }
  };

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const p = playerRef.current;
      if (p && readyRef.current && typeof p.seekTo === 'function') {
        p.seekTo(Math.max(0, seconds), true);
      }
    },
    play: (id?: string) => {
      const video = id ?? videoIdRef.current;
      if (id) videoIdRef.current = id;
      playingRef.current = true;
      if (!isValidVideoId(video)) return;
      if (!playerRef.current || !readyRef.current) return;
      // Same video: resume without reloading (reload was resetting playback to 0
      // and racing autoplay checks). New id: load then play.
      if (activeIdRef.current === video && everPlayedRef.current) {
        try {
          playerRef.current.playVideo();
        } catch {
          /* ignore */
        }
        watchAutoplay();
        return;
      }
      loadAndPlay(video);
    },
  }));

  // Create the player once. YT.Player replaces its target node with an iframe,
  // so we mount into a fresh child inside a stable container.
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let host: HTMLDivElement | null = null;

    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;

      host = document.createElement('div');
      containerRef.current.appendChild(host);

      // Never pass videoId: undefined / "" — YouTube throws "Invalid video id".
      const initialId = videoIdRef.current;
      const opts: {
        width: string;
        height: string;
        videoId?: string;
        playerVars: Record<string, string | number>;
        events: Record<string, (e?: { data: number }) => void>;
      } = {
        width: '160',
        height: '90',
        playerVars: {
          autoplay: 0,
          controls: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            readyRef.current = true;
            // Re-apply whatever the UI asked for while the API was booting.
            syncPlayback();
          },
          onStateChange: (e?: { data: number }) => {
            if (!e) return;
            const YT = window.YT!;
            if (e.data === YT.PlayerState.ENDED) cb.current.onEnded?.();
            if (e.data === YT.PlayerState.PLAYING) {
              everPlayedRef.current = true;
              if (autoplayWatch.current) clearTimeout(autoplayWatch.current);
              cb.current.onPlayingChange?.(true);
            }
            // Ignore PAUSED while we still intend to play — buffering / brief
            // YouTube blips must not look like a user pause to parents.
            if (e.data === YT.PlayerState.PAUSED && !playingRef.current) {
              cb.current.onPlayingChange?.(false);
            }
          },
        },
      };
      if (isValidVideoId(initialId)) {
        opts.videoId = initialId;
      }

      playerRef.current = new window.YT.Player(host, opts);

      poll = setInterval(() => {
        const p = playerRef.current;
        if (p && readyRef.current && typeof p.getCurrentTime === 'function') {
          cb.current.onProgress?.(p.getCurrentTime() || 0, p.getDuration() || 0);
        }
      }, 500);
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      if (autoplayWatch.current) clearTimeout(autoplayWatch.current);
      try {
        playerRef.current?.destroy();
      } catch {
        /* player may already be gone */
      }
      playerRef.current = null;
      readyRef.current = false;
      activeIdRef.current = null;
      host?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Track changes: reload when the id changes; play/pause when only intent flips.
  const prevVideoId = useRef<string | null>(null);

  useEffect(() => {
    if (videoId !== prevVideoId.current) {
      everPlayedRef.current = false;
      prevVideoId.current = videoId;
      if (!readyRef.current || !playerRef.current) return;
      syncPlayback();
      return;
    }

    if (!readyRef.current || !playerRef.current) return;
    const p = playerRef.current;
    if (!isValidVideoId(videoId)) return;
    try {
      if (playing) {
        p.playVideo();
        watchAutoplay();
      } else {
        p.pauseVideo();
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playing]);

  // If the browser quietly pauses a "background-looking" embed, nudge play while
  // the parent still wants audio.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!playingRef.current || !readyRef.current || !playerRef.current) return;
      try {
        playerRef.current.playVideo();
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [playing]);

  if (!mounted) return null;

  // Must stay visibly in the viewport — browsers pause near-invisible /
  // off-screen unmuted media after a few seconds.
  return (
    <div
      className="fixed bottom-3 left-3 z-30 overflow-hidden rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/15"
      style={{ width: 160, height: 90 }}
      aria-hidden
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
});
