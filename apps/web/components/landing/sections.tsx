'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Mic2,
  AudioLines,
  ListMusic,
  Users,
  Headphones,
  Heart,
  Search,
  Bookmark,
  Disc3,
} from 'lucide-react';
import { Reveal, SectionHeading } from './reveal';
import {
  ChillArt,
  FocusArt,
  WorkoutArt,
  RomanceArt,
  PartyArt,
  TravelArt,
} from './mood-art';
import { moodPlaylists, trendingTracks } from '@/lib/landing-music';

const shell = 'relative w-full px-6 py-28 sm:px-10';

/* ------------------------------------------------------------------ */
/* SECTION 1 — Trending Music                                          */
/* ------------------------------------------------------------------ */

function AlbumCard({ a }: { a: (typeof trendingTracks)[number] }) {
  const href = `/listen?q=${encodeURIComponent(a.searchQuery)}`;

  return (
    <Link href={href} className="block shrink-0">
      <motion.div
        whileHover={{ y: -10 }}
        className="group w-56 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md transition-colors hover:border-white/20"
      >
        <div
          className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl"
          style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <div className="h-16 w-16 rounded-full border-4 border-black/30 bg-black/40">
              <div className="mx-auto mt-6 h-4 w-4 rounded-full bg-amber-200/70" />
            </div>
          </div>
          <motion.div
            initial={false}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
          >
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-xl"
            >
              <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
            </motion.span>
          </motion.div>
        </div>
        <p className="truncate text-white" style={{ fontFamily: 'Fraunces, serif' }}>
          {a.title}
        </p>
        <div className="flex items-center justify-between">
          <p className="truncate text-sm text-white/55">{a.artist}</p>
          <span className="shrink-0 text-xs text-amber-200/70">{a.plays}</span>
        </div>
      </motion.div>
    </Link>
  );
}

export function TrendingSection() {
  return (
    <section id="trending" className={shell}>
      <SectionHeading
        eyebrow="On repeat this week"
        title="Trending"
        accent="Music"
        subtitle="The albums and playlists lighting up the streets right now."
      />
      <Reveal>
        <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trendingTracks.map((a) => (
            <AlbumCard key={a.title} a={a} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 2 — Discover by Mood                                        */
/* ------------------------------------------------------------------ */

const moodArt = {
  Chill: ChillArt,
  Focus: FocusArt,
  Workout: WorkoutArt,
  Romance: RomanceArt,
  Party: PartyArt,
  Travel: TravelArt,
} as const;

export function MoodSection() {
  return (
    <section className={shell}>
      <SectionHeading
        eyebrow="However you feel"
        title="Discover by"
        accent="Mood"
        subtitle="Hand-illustrated worlds for every moment of your day."
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {moodPlaylists.map((m, i) => {
          const Art = moodArt[m.name as keyof typeof moodArt];
          const href = `/listen?mood=${encodeURIComponent(m.id)}`;
          return (
            <Reveal key={m.id} delay={i * 0.06}>
              <Link href={href} className="block">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative h-60 overflow-hidden rounded-3xl border border-white/10"
                >
                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Art />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3
                      className="text-3xl text-white"
                      style={{ fontFamily: 'Fraunces, serif', fontWeight: 600 }}
                    >
                      {m.name}
                    </h3>
                    <p className="text-sm text-white/70">{m.tag}</p>
                    <p className="mt-1 text-xs text-amber-200/60">
                      {m.tracks.length} tracks · tap to play playlist
                    </p>
                  </div>
                  <span className="absolute right-5 top-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </span>
                </motion.div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 3 — Music Journey Timeline                                  */
/* ------------------------------------------------------------------ */

const journey = [
  {
    icon: Search,
    title: "Discover",
    text: "Follow curated trails through moods, cities and decades to stumble on your next obsession.",
  },
  {
    icon: Bookmark,
    title: "Save",
    text: "Bookmark tracks, build living playlists, and let Sonexa remember every song that moved you.",
  },
  {
    icon: Heart,
    title: "Enjoy",
    text: "Lyrics in sync, offline everywhere, and studio-quality audio for the moments that matter.",
  },
];

export function TimelineSection() {
  return (
    <section className={shell}>
      <SectionHeading
        eyebrow="How it works"
        title="Your Music"
        accent="Journey"
        subtitle="From the first spark of discovery to the song stuck in your head."
      />
      <div className="relative mx-auto max-w-3xl">
        {/* track line */}
        <div className="absolute left-6 top-0 h-full w-0.5 -translate-x-1/2 bg-white/10 md:left-1/2" />
        <motion.div
          initial={{ height: "0%" }}
          whileInView={{ height: "100%" }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute left-6 top-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-300 to-red-600 md:left-1/2"
        />
        <div className="space-y-16">
          {journey.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.05}>
              <div
                className={`relative flex items-center gap-6 md:gap-0 ${
                  i % 2 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className={`flex-1 pl-16 md:pl-0 ${i % 2 ? "md:pl-12 md:text-left" : "md:pr-12 md:text-right"}`}>
                  <h3
                    className="text-2xl text-white"
                    style={{ fontFamily: "Fraunces, serif", fontWeight: 600 }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2 text-white/65">{step.text}</p>
                </div>
                {/* node */}
                <span className="absolute left-6 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-orange-400 to-red-600 shadow-lg md:left-1/2">
                  <step.icon className="h-5 w-5 text-white" />
                </span>
                <div className="hidden flex-1 md:block" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 5 — Premium Features                                        */
/* ------------------------------------------------------------------ */

const features = [
  { icon: Mic2, title: "Lyrics Sync", text: "Word-perfect lyrics that light up in time with the music." },
  { icon: AudioLines, title: "High Quality Audio", text: "Lossless, studio-grade sound the way the artist intended." },
  { icon: ListMusic, title: "Smart Playlists", text: "Playlists that reshape themselves around your mood and moment." },
  { icon: Disc3, title: "Endless Radio", text: "Infinite stations spun from any track, artist or feeling." },
];

export function FeaturesSection() {
  return (
    <section className={shell}>
      <SectionHeading
        eyebrow="Why Sonexa"
        title="Premium"
        accent="Features"
        subtitle="Everything you need to fall in love with listening again."
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <motion.div
              whileHover={{ y: -8 }}
              className="group h-full rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-md transition-colors hover:border-amber-300/30"
            >
              <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/20 to-red-600/20 text-amber-200 ring-1 ring-white/10 transition-transform group-hover:scale-110">
                <f.icon className="h-7 w-7" />
              </span>
              <h3 className="text-xl text-white" style={{ fontFamily: "Fraunces, serif" }}>
                {f.title}
              </h3>
              <p className="mt-2 text-white/60">{f.text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Device showcase — animated phone + laptop mockups                   */
/* ------------------------------------------------------------------ */

function MiniVisualizer({ bars = 16 }: { bars?: number }) {
  return (
    <div className="flex h-8 items-end justify-center gap-1">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 flex-1 rounded-full bg-white/50"
          animate={{ height: ["20%", `${30 + ((i * 41) % 70)}%`, "20%"] }}
          transition={{ duration: 1 + (i % 4) * 0.2, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

function PhoneMock({ accent, delay }: { accent: string; delay: number }) {
  return (
    <motion.div
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
      className="relative h-[380px] w-[190px] rounded-[2.2rem] border-4 border-white/15 bg-[#160f1f] p-3 shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-[1.6rem]" style={{ background: accent }}>
        <div className="flex items-center justify-between px-4 pt-4 text-white/80">
          <Disc3 className="h-5 w-5" />
          <span className="text-xs" style={{ fontFamily: "Fraunces, serif" }}>
            Sonexa
          </span>
        </div>
        <div className="mx-auto mt-6 h-28 w-28 rounded-2xl bg-black/25" />
        <div className="mt-4 space-y-2 px-5">
          <div className="h-3 w-24 rounded-full bg-white/40" />
          <div className="h-2.5 w-16 rounded-full bg-white/25" />
        </div>
        <div className="mt-5 px-5">
          <MiniVisualizer />
        </div>
      </div>
    </motion.div>
  );
}

function LaptopMock({ delay }: { delay: number }) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 7, delay, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-[420px] max-w-full"
    >
      {/* screen */}
      <div className="rounded-t-2xl border-4 border-white/15 bg-[#160f1f] p-2.5 shadow-2xl">
        <div
          className="h-[240px] w-full overflow-hidden rounded-lg"
          style={{ background: "linear-gradient(160deg,#2a1f4a,#7a2320)" }}
        >
          <div className="flex items-center justify-between px-5 pt-4 text-white/80">
            <span className="flex items-center gap-2 text-sm" style={{ fontFamily: "Fraunces, serif" }}>
              <Disc3 className="h-5 w-5" /> Sonexa
            </span>
            <div className="flex gap-3 text-xs text-white/50">
              <span>Radio</span>
            </div>
          </div>
          {/* album grid */}
          <div className="mt-5 grid grid-cols-4 gap-3 px-5">
            {["#c8613a", "#2f5d47", "#c0392b", "#e6913f"].map((c, i) => (
              <div key={i} className="aspect-square rounded-lg" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-5 px-8">
            <MiniVisualizer bars={28} />
          </div>
        </div>
      </div>
      {/* base */}
      <div className="mx-auto h-3 w-[110%] -translate-x-[4.5%] rounded-b-xl border-x-4 border-b-4 border-white/15 bg-[#1f1526]" />
      <div className="mx-auto h-1.5 w-24 rounded-b-lg bg-white/15" />
    </motion.div>
  );
}

export function DevicesSection() {
  return (
    <section className={`${shell} overflow-hidden`}>
      <SectionHeading
        eyebrow="Everywhere you go"
        title="On every"
        accent="device"
        subtitle="Phone, tablet or desktop — your golden hour follows you."
      />
      <Reveal>
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-center gap-8">
          <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-orange-500/20 blur-[130px]" />
          <div className="relative z-10 mt-10 hidden sm:block">
            <PhoneMock accent="linear-gradient(160deg,#2f5d47,#173a3a)" delay={0.6} />
          </div>
          <div className="relative z-20">
            <LaptopMock delay={0.3} />
          </div>
          <div className="relative z-10 mt-10 hidden sm:block">
            <PhoneMock accent="linear-gradient(160deg,#c8613a,#7a2320)" delay={0} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 9 — Footer                                                  */
/* ------------------------------------------------------------------ */

const footerCols = [
  { title: "Company", links: ["About", "Careers", "Press", "Blog"] },
  { title: "Discover", links: ["Trending", "Moods", "Artists", "Radio"] },
  { title: "Support", links: ["Help Centre", "Community", "Privacy", "Terms"] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 pt-16 pb-10 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600">
                <Disc3 className="h-5 w-5" />
              </span>
              <span className="text-xl tracking-wide" style={{ fontFamily: "Fraunces, serif" }}>
                Sonexa
              </span>
            </a>
            <p className="mt-4 max-w-xs text-white/55">
              Every song has a story. Discover the soundtrack of modern India.
            </p>
            <div className="mt-5 flex gap-3">
              {[Users, Heart, Headphones, Mic2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-white" style={{ fontFamily: "Fraunces, serif" }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-white/55 transition-colors hover:text-amber-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row">
          <p>© 2026 Sonexa Music. Crafted with warmth in India.</p>
          <p>Made for listeners, by listeners.</p>
        </div>
      </div>
    </footer>
  );
}
