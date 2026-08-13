'use client';

/**
 * Shared helpers for keeping host + guest players on the same room clock.
 */

export type PlaybackSnapshot = {
  streamId: string | null;
  playing: boolean;
  positionSec?: number;
  updatedAt?: number;
};

/** Media position implied by a server playback snapshot. */
export function positionFromSnapshot(p: PlaybackSnapshot | null | undefined, now = Date.now()): number {
  if (!p?.streamId) return 0;
  const base = typeof p.positionSec === 'number' ? p.positionSec : 0;
  if (!p.playing) return Math.max(0, base);
  const updatedAt = typeof p.updatedAt === 'number' ? p.updatedAt : now;
  return Math.max(0, base + (now - updatedAt) / 1000);
}

/** Seek when local clock drifted from the room clock. */
export function shouldResync(localSec: number, targetSec: number, slack = 2.5): boolean {
  return Math.abs(localSec - targetSec) > slack;
}

export const CREATOR_SPACE_PREF_KEY = 'sonexa:creatorSpace';

export type CreatorSpacePref = 'listen' | 'creator' | null;

export function readCreatorSpacePref(): CreatorSpacePref {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(CREATOR_SPACE_PREF_KEY);
    if (v === 'listen' || v === 'creator') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeCreatorSpacePref(value: 'listen' | 'creator') {
  try {
    window.localStorage.setItem(CREATOR_SPACE_PREF_KEY, value);
  } catch {
    /* ignore */
  }
}
