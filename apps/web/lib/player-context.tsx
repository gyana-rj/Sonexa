'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { songs as allSongs, type Song } from './data';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  progress: number; // 0-100
  currentTime: number; // seconds
  volume: number; // 0-100
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  liked: Set<string>;
  showQueue: boolean;
  showLyrics: boolean;
}

interface PlayerContextValue extends PlayerState {
  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (queue: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (percent: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  removeFromQueue: (index: number) => void;
  addToQueue: (song: Song) => void;
  setShowQueue: (v: boolean) => void;
  setShowLyrics: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated playback progress
  useEffect(() => {
    if (isPlaying && currentSong) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= currentSong.duration) {
            // Song ended
            return currentSong.duration;
          }
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentSong]);

  // Update progress percentage
  useEffect(() => {
    if (currentSong) {
      setProgress((currentTime / currentSong.duration) * 100);
    }
  }, [currentTime, currentSong]);

  // Auto-advance when song ends
  useEffect(() => {
    if (!currentSong) return;
    if (currentTime >= currentSong.duration && isPlaying) {
      if (repeat === 'one') {
        setCurrentTime(0);
        setProgress(0);
      } else {
        next();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, currentSong, isPlaying, repeat]);

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgress(0);
    if (newQueue) {
      const idx = newQueue.findIndex((s) => s.id === song.id);
      setQueue(newQueue);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
  }, []);

  const playQueue = useCallback((newQueue: Song[], startIndex = 0) => {
    setQueue(newQueue);
    setQueueIndex(startIndex);
    setCurrentSong(newQueue[startIndex]);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgress(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentSong && queue.length > 0) {
      setCurrentSong(queue[0]);
      setQueueIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((p) => !p);
  }, [currentSong, queue]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
      if (nextIdx === queueIndex && queue.length > 1) {
        nextIdx = (nextIdx + 1) % queue.length;
      }
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeat === 'all') {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }
    setQueueIndex(nextIdx);
    setCurrentSong(queue[nextIdx]);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgress(0);
  }, [queue, queueIndex, shuffle, repeat]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeat === 'all') {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }
    setQueueIndex(prevIdx);
    setCurrentSong(queue[prevIdx]);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgress(0);
  }, [queue, queueIndex, repeat, currentTime]);

  const seek = useCallback((percent: number) => {
    if (!currentSong) return;
    const newTime = (percent / 100) * currentSong.duration;
    setCurrentTime(newTime);
    setProgress(percent);
  }, [currentSong]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => !s);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, []);

  const isLiked = useCallback((songId: string) => liked.has(songId), [liked]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        next();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        prev();
      } else if (e.key === 'l' && currentSong) {
        toggleLike(currentSong.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, next, prev, toggleLike, currentSong]);

  const value: PlayerContextValue = {
    currentSong,
    isPlaying,
    queue,
    queueIndex,
    progress,
    currentTime,
    volume: muted ? 0 : volume,
    muted,
    shuffle,
    repeat,
    liked,
    showQueue,
    showLyrics,
    playSong,
    playQueue,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    isLiked,
    removeFromQueue,
    addToQueue,
    setShowQueue,
    setShowLyrics,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
