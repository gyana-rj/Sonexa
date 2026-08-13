/**
 * In-memory per-room playback pointer.
 *
 * One process / Docker container is enough for local multi-user testing.
 * Swap for Redis (or a DB column) if you scale horizontally.
 */

export type StoredPlayback = {
  streamId: string | null;
  playing: boolean;
  updatedAt: number;
};

const rooms = new Map<string, StoredPlayback>();

export function getPlayback(roomId: string): StoredPlayback {
  return (
    rooms.get(roomId) ?? {
      streamId: null,
      playing: false,
      updatedAt: 0,
    }
  );
}

export function setPlayback(
  roomId: string,
  next: { streamId: string | null; playing: boolean },
): StoredPlayback {
  const stored: StoredPlayback = {
    streamId: next.streamId,
    playing: next.playing,
    updatedAt: Date.now(),
  };
  rooms.set(roomId, stored);
  return stored;
}

/** Test helper — wipe all rooms between cases. */
export function clearPlaybackStore(): void {
  rooms.clear();
}
