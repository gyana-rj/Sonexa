/**
 * Shared room snapshot helpers.
 *
 * Now-playing must come from a server-owned playback pointer — never from each
 * client's local memory — otherwise hosts and guests diverge after skip/play.
 */

export type RoomStream = {
  id: string;
  title: string;
  votes: number;
  haveUpvoted: boolean;
};

export type RoomPlayback = {
  /** Stream currently designated as now-playing for the room. */
  streamId: string | null;
  playing: boolean;
};

export type RoomView = {
  nowPlaying: RoomStream | null;
  queue: RoomStream[];
  playing: boolean;
};

/** Sort by votes desc, stable on equal votes by id. */
export function sortByVotes(streams: RoomStream[]): RoomStream[] {
  return [...streams].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Derive the same now-playing + queue for every client given one server snapshot.
 *
 * Rules:
 * 1. If playback.streamId points at a known stream → that is now-playing.
 * 2. Else fall back to the highest-voted stream (deterministic across clients).
 * 3. Queue is everything else, still vote-sorted.
 */
export function deriveRoomView(
  streams: RoomStream[],
  playback: RoomPlayback | null | undefined,
): RoomView {
  const sorted = sortByVotes(streams);
  if (sorted.length === 0) {
    return { nowPlaying: null, queue: [], playing: false };
  }

  const fromPlayback = playback?.streamId
    ? sorted.find((s) => s.id === playback.streamId)
    : undefined;

  const nowPlaying = fromPlayback ?? sorted[0]!;
  const queue = sorted.filter((s) => s.id !== nowPlaying.id);

  return {
    nowPlaying,
    queue,
    playing: Boolean(playback?.playing && fromPlayback),
  };
}

/** Apply an upvote/downvote as the server would after a successful write. */
export function applyVote(
  streams: RoomStream[],
  streamId: string,
  up: boolean,
): RoomStream[] {
  return streams.map((s) => {
    if (s.id !== streamId) return s;
    // Idempotent: don't double-count if already in the desired state.
    if (up && s.haveUpvoted) return s;
    if (!up && !s.haveUpvoted) return s;
    return {
      ...s,
      haveUpvoted: up,
      votes: Math.max(0, s.votes + (up ? 1 : -1)),
    };
  });
}

/** Advance to the next queued track (highest votes among remaining). */
export function advancePlayback(
  streams: RoomStream[],
  playback: RoomPlayback,
): RoomPlayback {
  const view = deriveRoomView(streams, playback);
  const next = view.queue[0];
  if (!next) {
    return { streamId: null, playing: false };
  }
  return { streamId: next.id, playing: true };
}

/**
 * Two clients that only render from the same server snapshot must agree.
 * Used by multi-user sync tests.
 */
export function viewsForClients(
  streams: RoomStream[],
  playback: RoomPlayback | null,
): { host: RoomView; guest: RoomView } {
  return {
    host: deriveRoomView(streams, playback),
    guest: deriveRoomView(streams, playback),
  };
}
