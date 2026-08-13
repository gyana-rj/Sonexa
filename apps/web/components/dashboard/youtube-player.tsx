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
    onPlayingChange?: (playing: boolean) => void;
  }
>(function YouTubePlayer({ videoId, playing, onProgress, onEnded, onPlayingChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  const autoplayWatch = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Avoid SSR/client hydration mismatches — this player is browser-only.
  const [mounted, setMounted] = useState(false);

  // Keep the latest desired state in refs so async onReady / effects stay in sync.
  const videoIdRef = useRef(videoId);
  const playingRef = useRef(playing);
  videoIdRef.current = videoId;
  playingRef.current = playing;

  const cb = useRef({ onProgress, onEnded, onPlayingChange });
  cb.current = { onProgress, onEnded, onPlayingChange };

  useEffect(() => {
    setMounted(true);
  }, []);

  const watchAutoplay = () => {
    if (autoplayWatch.current) clearTimeout(autoplayWatch.current);
    autoplayWatch.current = setTimeout(() => {
      if (!playingRef.current) return;
      const cur = playerRef.current;
      if (!cur || typeof cur.getCurrentTime !== 'function') return;
      // Still no media clock → browser likely blocked unmuted autoplay.
      if ((cur.getCurrentTime() || 0) < 0.25 && (cur.getDuration() || 0) === 0) {
        cb.current.onPlayingChange?.(false);
      }
    }, 2000);
  };

  const loadAndPlay = (id: string) => {
    const p = playerRef.current;
    if (!p || !readyRef.current || !isValidVideoId(id)) return;
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
        width: '320',
        height: '180',
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
              if (autoplayWatch.current) clearTimeout(autoplayWatch.current);
              cb.current.onPlayingChange?.(true);
            }
            if (e.data === YT.PlayerState.PAUSED) cb.current.onPlayingChange?.(false);
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
    if (!readyRef.current || !playerRef.current) return;

    if (videoId !== prevVideoId.current) {
      prevVideoId.current = videoId;
      syncPlayback();
      return;
    }

    const p = playerRef.current;
    if (!isValidVideoId(videoId)) return;
    try {
      if (playing) p.playVideo();
      else p.pauseVideo();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playing]);

  if (!mounted) return null;

  // Keep a tiny player in the real viewport — browsers often refuse autoplay
  // for iframes parked at -9999px / opacity 0.
  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 z-[-1] h-px w-px overflow-hidden opacity-[0.01]"
      aria-hidden
    >
      <div ref={containerRef} />
    </div>
  );
});
