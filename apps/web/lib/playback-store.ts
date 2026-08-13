/**
 * In-memory per-room playback pointer.
 *
 * Survives Next.js hot-reload via globalThis (dev). One process is enough for
 * local multi-user testing; swap for Redis/DB if you scale horizontally.
 */

export type StoredPlayback = {
  streamId: string | null;
  playing: boolean;
  /** Media clock (seconds) frozen at `updatedAt`. */
  positionSec: number;
  updatedAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __sonexaPlaybackRooms?: Map<string, StoredPlayback>;
};

const rooms: Map<string, StoredPlayback> =
  globalStore.__sonexaPlaybackRooms ?? new Map<string, StoredPlayback>();
globalStore.__sonexaPlaybackRooms = rooms;

export function getPlayback(roomId: string): StoredPlayback {
  return (
    rooms.get(roomId) ?? {
      streamId: null,
      playing: false,
      positionSec: 0,
      updatedAt: 0,
    }
  );
}

/** Wall-clock media position for a stored playback snapshot. */
export function getPlaybackPosition(p: StoredPlayback, now = Date.now()): number {
  if (!p.streamId) return 0;
  if (!p.playing) return Math.max(0, p.positionSec);
  return Math.max(0, p.positionSec + (now - p.updatedAt) / 1000);
}

export function setPlayback(
  roomId: string,
  next: {
    streamId: string | null;
    playing: boolean;
    positionSec?: number;
  },
): StoredPlayback {
  const prev = getPlayback(roomId);
  const positionSec =
    typeof next.positionSec === 'number' && Number.isFinite(next.positionSec)
      ? Math.max(0, next.positionSec)
      : next.streamId === prev.streamId
        ? getPlaybackPosition(prev)
        : 0;

  const stored: StoredPlayback = {
    streamId: next.streamId,
    playing: next.playing,
    positionSec,
    updatedAt: Date.now(),
  };
  rooms.set(roomId, stored);
  return stored;
}

/** Clear playback for a room (e.g. after wiping the queue). */
export function clearPlayback(roomId: string): void {
  rooms.delete(roomId);
}

/** Test helper — wipe all rooms between cases. */
export function clearPlaybackStore(): void {
  rooms.clear();
}
