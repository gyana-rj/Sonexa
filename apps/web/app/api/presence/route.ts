import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// A listener is counted "live" for this long after their last heartbeat.
const TTL_MS = 30_000;

// In-memory presence: email -> last-seen timestamp. Real, live counts for a
// single server instance (resets on restart, which is honest — nobody's live
// across a restart). Swap for Redis if the app is ever scaled horizontally.
const seen = new Map<string, number>();

function activeCount(): number {
  const now = Date.now();
  for (const [key, ts] of seen) {
    if (now - ts > TTL_MS) seen.delete(key);
  }
  return seen.size;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (email) seen.set(email, Date.now());
  return NextResponse.json({ count: activeCount() });
}

export async function GET() {
  return NextResponse.json({ count: activeCount() });
}
