/**
 * Per-room presence heartbeats (in-memory, HMR-safe via globalThis).
 */

const TTL_MS = 30_000;

const globalStore = globalThis as typeof globalThis & {
  __sonexaPresence?: Map<string, number>;
};

const seen: Map<string, number> =
  globalStore.__sonexaPresence ?? new Map<string, number>();
globalStore.__sonexaPresence = seen;

function roomKey(roomId: string, email: string) {
  return `${roomId}::${email}`;
}

export function touchPresence(roomId: string, email: string): number {
  seen.set(roomKey(roomId, email), Date.now());
  return activeCount(roomId);
}

export function activeCount(roomId: string): number {
  const now = Date.now();
  const prefix = `${roomId}::`;
  let count = 0;
  for (const [key, ts] of seen) {
    if (now - ts > TTL_MS) {
      seen.delete(key);
      continue;
    }
    if (key.startsWith(prefix)) count += 1;
  }
  return count;
}
