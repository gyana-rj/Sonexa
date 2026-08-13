import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prismaClient } from "@repo/db/client";
import { authOptions } from "@/lib/auth";
import { makeCover, splitTitle, type Source } from "@/lib/music";
import { getPlayback } from "@/lib/playback-store";
import { deriveRoomView, type RoomStream } from "@/lib/room-state";
import Backdrop from "@/components/dashboard/backdrop";
import { ShareButton } from "@/components/room/share-button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ creatorId: string }>;
};

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "host";
  const words = local.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Host";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "SX";
}

async function loadCreator(creatorId: string) {
  const creator = await prismaClient.user.findUnique({
    where: { id: creatorId },
    select: { id: true, email: true, provider: true },
  });
  if (!creator) return null;

  const streams = await prismaClient.stream.findMany({
    where: { userId: creatorId },
    include: { _count: { select: { upvote: true } } },
  });

  const mapped = streams.map((s) => {
    const source: Source = s.type === "Spotify" ? "spotify" : "youtube";
    const raw = s.title || "Untitled track";
    const { title, artist } = splitTitle(raw);
    return {
      id: s.id,
      title: title || raw,
      artist: artist || (source === "spotify" ? "Spotify" : "YouTube"),
      source,
      cover: s.bigImg || s.smallImg || makeCover(s.id + raw),
      votes: s._count.upvote,
    };
  });

  const slim: RoomStream[] = mapped.map((m) => ({
    id: m.id,
    title: m.title,
    votes: m.votes,
    haveUpvoted: false,
  }));
  const view = deriveRoomView(slim, getPlayback(creatorId));
  const nowPlaying = view.nowPlaying
    ? (mapped.find((m) => m.id === view.nowPlaying!.id) ?? null)
    : null;
  const queue = mapped
    .filter((m) => m.id !== nowPlaying?.id)
    .sort((a, b) => b.votes - a.votes);

  return {
    creator,
    nowPlaying,
    queue,
    playing: view.playing,
    totalVotes: mapped.reduce((sum, m) => sum + m.votes, 0),
    trackCount: mapped.length,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorId } = await params;
  try {
    const creator = await prismaClient.user.findUnique({
      where: { id: creatorId },
      select: { email: true },
    });
    if (!creator) {
      return { title: "Host not found — Sonexa" };
    }
    const name = displayNameFromEmail(creator.email);
    return {
      title: `${name}'s room — Sonexa`,
      description: `See what ${name} is playing and join their listening room on Sonexa.`,
    };
  } catch {
    return { title: "Creator — Sonexa" };
  }
}

export default async function CreatorPage({ params }: PageProps) {
  const { creatorId } = await params;
  const data = await loadCreator(creatorId);
  if (!data) notFound();

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.email === data.creator.email;
  const name = displayNameFromEmail(data.creator.email);
  const providerLabel = data.creator.provider === "Github" ? "GitHub" : "Google";
  const statusLabel = data.nowPlaying
    ? data.playing
      ? "Live now"
      : "Paused"
    : "Idle";

  return (
    <div className="relative min-h-screen w-full bg-[#0b1020]">
      <Backdrop />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-28 pt-8 md:px-10">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90" aria-label="Sonexa home">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ffb86b] shadow-[0_8px_30px_rgba(255,138,61,0.45)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0b1020]" />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg tracking-tight text-cream">Sonexa</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-cream/40">Host profile</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton label="Share profile" />
            <Link
              href="/listen"
              className="hidden rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 backdrop-blur-xl transition hover:text-cream sm:block"
            >
              Search
            </Link>
          </div>
        </header>

        <section className="mt-16 lg:mt-20">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#ff8a3d] to-[#ffb86b] text-3xl font-medium text-[#0b1020] shadow-[0_20px_60px_rgba(255,138,61,0.35)]">
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cream/60">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${data.playing ? "bg-[#2ec4b6]" : "bg-cream/35"}`}
                  />
                  {statusLabel}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cream/50">
                  {providerLabel}
                </span>
                {isOwner && (
                  <span className="rounded-full bg-[#ff8a3d]/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ffbd8f]">
                    Your profile
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-4xl font-light tracking-tight text-cream md:text-6xl">
                {name}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-cream/50">
                {isOwner
                  ? "This is the public page people see before they join your room."
                  : "A shared listening room — vote on the queue or just drop in and listen."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={`/room/${creatorId}`}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-6 py-3.5 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition hover:brightness-105"
              >
                Join the room
              </Link>
              {isOwner && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-6 py-3.5 text-sm text-cream/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-cream"
                >
                  Open dashboard
                </Link>
              )}
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-3 sm:max-w-lg">
            <Stat label="Tracks" value={data.trackCount} />
            <Stat label="Votes" value={data.totalVotes} />
            <Stat label="Up next" value={data.queue.length} />
          </dl>
        </section>

        <section className="mt-16 lg:mt-24">
          <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Now Playing</p>
          {data.nowPlaying ? (
            <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.nowPlaying.cover}
                alt={`${data.nowPlaying.title} artwork`}
                className="aspect-square w-full max-w-[280px] rounded-[2rem] object-cover shadow-[0_40px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
              />
              <div className="min-w-0 text-center sm:pt-4 sm:text-left">
                <SourceBadge source={data.nowPlaying.source} />
                <h2 className="mt-4 font-display text-3xl font-light leading-tight text-cream md:text-5xl">
                  {data.nowPlaying.title}
                </h2>
                <p className="mt-3 text-lg text-cream/50">{data.nowPlaying.artist}</p>
                <p className="mt-6 text-sm tabular-nums text-cream/40">
                  {data.nowPlaying.votes} {data.nowPlaying.votes === 1 ? "vote" : "votes"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 max-w-md rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="font-display text-2xl font-light text-cream">Nothing playing yet</p>
              <p className="mt-2 text-sm text-cream/45">
                {isOwner
                  ? "Open your dashboard and paste a YouTube or Spotify link to start the room."
                  : "This host hasn’t queued a track. Join the room and add the first one."}
              </p>
            </div>
          )}
        </section>

        <section className="mx-auto mt-20 max-w-3xl">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">Up Next</p>
              <h2 className="mt-4 font-display text-4xl font-light text-cream">The queue</h2>
            </div>
            <span className="text-sm tabular-nums text-cream/40">{data.queue.length} songs</span>
          </div>

          <div className="mt-8 space-y-3">
            {data.queue.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-cream/40">
                The queue is empty.
              </div>
            ) : (
              data.queue.slice(0, 12).map((song, i) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 rounded-[1.5rem] bg-white/[0.04] p-3.5 backdrop-blur-xl md:p-4"
                >
                  <span className="w-5 text-center text-sm tabular-nums text-cream/25">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={song.cover} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-cream">{song.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="truncate text-sm text-cream/45">{song.artist}</p>
                      <SourceBadge source={song.source} className="hidden sm:inline-flex" />
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-cream/40">{song.votes}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              href={`/room/${creatorId}`}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-8 py-4 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition hover:brightness-105"
            >
              Listen live in the room
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.25rem] bg-white/[0.04] px-4 py-4 text-center ring-1 ring-white/10 backdrop-blur-xl">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-cream/40">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-light tabular-nums text-cream">{value}</dd>
    </div>
  );
}

function SourceBadge({ source, className = "" }: { source: Source; className?: string }) {
  const spotify = source === "spotify";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur ${className}`}
      style={{
        background: spotify ? "rgba(46,196,182,0.14)" : "rgba(255,138,61,0.16)",
        color: spotify ? "#7ff0e4" : "#ffbd8f",
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: spotify ? "#2ec4b6" : "#ff8a3d" }} />
      {spotify ? "Spotify" : "YouTube"}
    </span>
  );
}
