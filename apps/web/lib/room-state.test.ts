import { afterEach, describe, expect, it } from 'vitest';
import {
  advancePlayback,
  applyVote,
  deriveRoomView,
  viewsForClients,
  type RoomPlayback,
  type RoomStream,
} from './room-state';
import { clearPlaybackStore, getPlayback, setPlayback } from './playback-store';

function track(
  id: string,
  title: string,
  votes: number,
  haveUpvoted = false,
): RoomStream {
  return { id, title, votes, haveUpvoted };
}

describe('multi-user room sync', () => {
  afterEach(() => {
    clearPlaybackStore();
  });

  it('host and guest see the same now-playing from a shared playback pointer', () => {
    const streams = [
      track('a', 'Track A', 1),
      track('b', 'Track B', 5),
      track('c', 'Track C', 3),
    ];
    // Host started playing C even though B has more votes.
    const playback: RoomPlayback = { streamId: 'c', playing: true };

    const { host, guest } = viewsForClients(streams, playback);

    expect(host.nowPlaying?.id).toBe('c');
    expect(guest.nowPlaying?.id).toBe('c');
    expect(host.queue.map((t) => t.id)).toEqual(['b', 'a']);
    expect(guest.queue.map((t) => t.id)).toEqual(host.queue.map((t) => t.id));
    expect(host.playing).toBe(true);
    expect(guest.playing).toBe(true);
  });

  it('without a playback pointer, both clients pick the same highest-voted track', () => {
    const streams = [
      track('a', 'Track A', 2),
      track('b', 'Track B', 2), // tie on votes → stable by id
      track('c', 'Track C', 1),
    ];

    const { host, guest } = viewsForClients(streams, null);

    expect(host.nowPlaying?.id).toBe(guest.nowPlaying?.id);
    expect(host.nowPlaying?.id).toBe('a'); // 'a' < 'b' on tie
    expect(host.queue.map((t) => t.id)).toEqual(guest.queue.map((t) => t.id));
  });

  it('after host advances, both clients show the next track as now-playing', () => {
    const streams = [
      track('now', 'Now Playing', 10),
      track('next', 'Up Next', 4),
      track('later', 'Later', 1),
    ];
    let playback: RoomPlayback = { streamId: 'now', playing: true };

    // Host skips — pointer moves; finished track remains in the room list.
    playback = advancePlayback(streams, playback);
    setPlayback('room-1', playback);

    const serverPlayback = getPlayback('room-1');
    const { host, guest } = viewsForClients(streams, serverPlayback);

    expect(serverPlayback.streamId).toBe('next');
    expect(host.nowPlaying?.id).toBe('next');
    expect(guest.nowPlaying?.id).toBe('next');
    // Previous now-playing stays in the vote-sorted queue until removed.
    expect(host.queue.map((t) => t.id)).toEqual(['now', 'later']);
    expect(guest.queue.map((t) => t.id)).toEqual(host.queue.map((t) => t.id));
    expect(guest.playing).toBe(true);
  });

  it('guest upvote is visible to host after both refresh from the same server streams', () => {
    let streams = [
      track('now', 'Charka', 0, false),
      track('q1', 'Aaja Piya Tohe Pyar Doon', 0, false),
    ];
    const playback: RoomPlayback = { streamId: 'now', playing: true };

    // Guest upvotes the queued track.
    streams = applyVote(streams, 'q1', true);

    const { host, guest } = viewsForClients(streams, playback);

    expect(guest.queue[0]?.votes).toBe(1);
    expect(host.queue[0]?.votes).toBe(1);
    expect(host.queue[0]?.id).toBe('q1');
    // Now-playing stays shared — upvote on queue must not desync playback.
    expect(host.nowPlaying?.id).toBe('now');
    expect(guest.nowPlaying?.id).toBe('now');
  });

  it('does not let local-only nowPlaying diverge the way the old client logic did', () => {
    const streams = [
      track('song-1', 'Aaja Piya Tohe Pyar Doon', 1),
      track('song-2', 'Other', 0),
    ];

    // Old bug: host "played" song-1 locally; guest had no local pointer and
    // either showed nothing or treated song-1 as still in the queue.
    // Shared playback forces agreement.
    setPlayback('room-xyz', { streamId: 'song-1', playing: true });
    const playback = getPlayback('room-xyz');

    const hostLocalGuess = { streamId: 'song-1' as string | null }; // host UI state
    const guestLocalGuess = { streamId: null as string | null }; // guest had nothing

    // Broken local-only views (what the screenshots showed):
    const brokenHost = deriveRoomView(streams, {
      streamId: hostLocalGuess.streamId,
      playing: true,
    });
    const brokenGuestIfNullPlayback = deriveRoomView(streams, {
      streamId: guestLocalGuess.streamId,
      playing: false,
    });
    // Guest with null playback falls back to highest voted (= song-1), so they
    // SHOULD see it — unless their UI incorrectly kept an empty nowPlaying.
    // The real bug was sticking to a stale local ref. Shared store fixes it:
    const { host, guest } = viewsForClients(streams, playback);

    expect(brokenHost.nowPlaying?.id).toBe('song-1');
    expect(host.nowPlaying?.id).toBe(guest.nowPlaying?.id);
    expect(host.nowPlaying?.id).toBe('song-1');
    expect(guest.queue.some((t) => t.id === 'song-1')).toBe(false);
    // Sanity: without shared playback + empty local, fallback still agrees,
    // but shared playback is what keeps skip/play in lockstep.
    expect(brokenGuestIfNullPlayback.nowPlaying?.id).toBe('song-1');
  });

  it('playback store is per-room so two rooms do not clobber each other', () => {
    setPlayback('room-a', { streamId: 'a1', playing: true });
    setPlayback('room-b', { streamId: 'b1', playing: false });

    expect(getPlayback('room-a').streamId).toBe('a1');
    expect(getPlayback('room-b').streamId).toBe('b1');
    expect(getPlayback('room-b').playing).toBe(false);
  });

  it('shared play/pause + position keep host and guest clocks aligned', () => {
    setPlayback('room-sync', {
      streamId: 'now',
      playing: true,
      positionSec: 30,
    });
    const snap = getPlayback('room-sync');
    expect(snap.playing).toBe(true);
    expect(snap.positionSec).toBe(30);

    // Pause freezes the clock for every client reading the same snapshot.
    setPlayback('room-sync', {
      streamId: 'now',
      playing: false,
      positionSec: 42,
    });
    const paused = getPlayback('room-sync');
    expect(paused.playing).toBe(false);
    expect(paused.positionSec).toBe(42);

    const streams = [track('now', 'Charka', 1), track('q1', 'Next', 0)];
    const { host, guest } = viewsForClients(streams, paused);
    expect(host.playing).toBe(false);
    expect(guest.playing).toBe(false);
    expect(host.nowPlaying?.id).toBe(guest.nowPlaying?.id);
  });

  it('idempotent votes do not inflate counts when the same user syncs twice', () => {
    let streams = [track('q1', 'Song', 0, false)];
    streams = applyVote(streams, 'q1', true);
    streams = applyVote(streams, 'q1', true); // duplicate upvote
    expect(streams[0]?.votes).toBe(1);
    expect(streams[0]?.haveUpvoted).toBe(true);

    streams = applyVote(streams, 'q1', false);
    streams = applyVote(streams, 'q1', false);
    expect(streams[0]?.votes).toBe(0);
    expect(streams[0]?.haveUpvoted).toBe(false);
  });
});
