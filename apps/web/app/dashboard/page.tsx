'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Radio,
  Users,
  ListMusic,
  Vote,
  Music2,
  Play,
  Pause,
  SkipForward,
  Plus,
  Link2,
  ThumbsUp,
  ThumbsDown,
  Crown,
  Clock,
  Headphones,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Youtube,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Disc3,
  Activity,
  Share2,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { GET } from '../api/streams/route';
//import LiteYoutubeEmbed from "react-lite-youtube-embed"
//import 'react-lite-youtube-embed/dist/LiteYoutubeEmbed.css'


// Types

type Song = {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  channel: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  addedBy: string;
  addedByAvatar: string;
  votes: number;
};

type Creator = {
  name: string;
  handle: string;
  avatar: string;
  listeners: number;
  isLive: boolean;
  streamTitle: string;
};

type Stats = {
  totalQueued: number;
  totalVotes: number;
  activeUsers: number;
  playedToday: number;
};


// Helpers

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Mock Data

const CREATOR: Creator = {
  name: 'Nova Stream',
  handle: '@novastream',
  avatar:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces',
  listeners: 12483,
  isLive: true,
  streamTitle: 'Friday Night Live — Coding & Beats',
};

const CURRENT_SONG: Song = {
  id: 'current',
  videoId: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  artist: 'Rick Astley',
  channel: 'Rick Astley',
  duration: '3:33',
  durationSeconds: 213,
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  addedBy: 'Nova Stream',
  addedByAvatar:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces',
  votes: 0,
};

const INITIAL_QUEUE: Song[] = [
  {
    id: 'q1',
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    channel: 'Luis Fonsi',
    duration: '4:42',
    durationSeconds: 282,
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    addedBy: 'beatmaster99',
    addedByAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc99de31e?w=80&h=80&fit=crop&crop=faces',
    votes: 847,
  },
  {
    id: 'q2',
    videoId: '9bZkp7q19f0',
    title: 'Gangnam Style',
    artist: 'PSY',
    channel: 'officialpsy',
    duration: '4:13',
    durationSeconds: 253,
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    addedBy: 'kpop_fan_42',
    addedByAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
    votes: 623,
  },
  {
    id: 'q3',
    videoId: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    channel: 'Mark Ronson',
    duration: '4:31',
    durationSeconds: 271,
    thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg',
    addedBy: 'funk_lover',
    addedByAvatar:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=faces',
    votes: 512,
  },
  {
    id: 'q4',
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    channel: 'Queen Official',
    duration: '5:55',
    durationSeconds: 355,
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    addedBy: 'queen_fan',
    addedByAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces',
    votes: 489,
  },
  {
    id: 'q5',
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    channel: 'Ed Sheeran',
    duration: '3:54',
    durationSeconds: 234,
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    addedBy: 'ed_sheeran_fan',
    addedByAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
    votes: 356,
  },
  {
    id: 'q6',
    videoId: 'RgKAFK5djSk',
    title: 'See You Again',
    artist: 'Wiz Khalifa ft. Charlie Puth',
    channel: 'Wiz Khalifa',
    duration: '3:58',
    durationSeconds: 238,
    thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg',
    addedBy: 'fast_fan',
    addedByAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a5da3b5?w=80&h=80&fit=crop&crop=faces',
    votes: 287,
  },
  {
    id: 'q7',
    videoId: 'CevxZvSJLk8',
    title: 'Roar',
    artist: 'Katy Perry',
    channel: 'Katy Perry',
    duration: '3:43',
    durationSeconds: 223,
    thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg',
    addedBy: 'katycat',
    addedByAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=faces',
    votes: 201,
  },
  {
    id: 'q8',
    videoId: 'YQHsXMglC9A',
    title: 'Hello',
    artist: 'Adele',
    channel: 'Adele',
    duration: '4:55',
    durationSeconds: 295,
    thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg',
    addedBy: 'adele_lover',
    addedByAvatar:
      'https://images.unsplash.com/photo-1554151228-1041e6d7bed1?w=80&h=80&fit=crop&crop=faces',
    votes: 178,
  },
  {
    id: 'q9',
    videoId: '60ItHLz5WEA',
    title: 'Faded',
    artist: 'Alan Walker',
    channel: 'Alan Walker',
    duration: '3:32',
    durationSeconds: 212,
    thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg',
    addedBy: 'walker_fan',
    addedByAvatar:
      'https://images.unsplash.com/photo-1527980965255-d3b4e3038f78?w=80&h=80&fit=crop&crop=faces',
    votes: 134,
  },
  {
    id: 'q10',
    videoId: '2vjPBrBUkM4',
    title: 'Believer',
    artist: 'Imagine Dragons',
    channel: 'ImagineDragons',
    duration: '3:24',
    durationSeconds: 204,
    thumbnail: 'https://img.youtube.com/vi/2vjPBrBUkM4/hqdefault.jpg',
    addedBy: 'dragon_master',
    addedByAvatar:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=faces',
    votes: 89,
  },
];

// Sub-components

function EqualizerBars({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-[2px] h-3', className)}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="equalizer-bar w-[2px] h-full bg-primary rounded-full"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 pulse-ring" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-[11px] font-bold tracking-wider text-red-400">LIVE</span>
    </div>
  );
}

function CreatorCard({ creator, queueLength }: { creator: Creator; queueLength: number }) {
  return (
    <Card className="glass gradient-border rounded-2xl border-white/5 p-5 overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-primary/40">
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm text-foreground truncate">{creator.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{creator.handle}</p>
          </div>
        </div>

        <div className="mt-4">
          <LiveBadge />
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {creator.streamTitle}
        </p>

        <Separator className="my-4 bg-white/5" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Headphones className="h-4 w-4" />
              <span className="text-xs">Listeners</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {creator.listeners.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListMusic className="h-4 w-4" />
              <span className="text-xs">In Queue</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{queueLength}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Stream Time</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">2:14:08</span>
          </div>
        </div>

        <Button className="w-full mt-4 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 transition-all">
          <Heart className="h-3.5 w-3.5 mr-1.5" />
          Follow
        </Button>
      </div>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="glass rounded-2xl border-white/5 p-4 hover:border-white/10 transition-all group">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold tabular-nums">{value}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function NowPlaying({ song, isPlaying, progress }: { song: Song; isPlaying: boolean; progress: number }) {
  const elapsed = (progress / 100) * song.durationSeconds;

  return (
    <Card className="glass-strong gradient-border rounded-2xl border-white/5 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Disc3 className={cn('h-4 w-4 text-primary', isPlaying && 'animate-spin')} style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Now Playing</p>
              <div className="flex items-center gap-2">
                {isPlaying ? <EqualizerBars /> : <Pause className="h-3 w-3 text-muted-foreground" />}
                <span className="text-xs text-primary font-medium">{isPlaying ? 'Playing' : 'Paused'}</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/5 border-white/10 text-muted-foreground">
            <Youtube className="h-3 w-3 mr-1 text-red-500" />
            YouTube
          </Badge>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* YouTube Player */}
          <div className="flex-1 min-w-0">
            <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${song.videoId}?autoplay=0&modestbranding=1&rel=0`}
                title={song.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Song Info */}
          <div className="lg:w-64 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                <img src={song.thumbnail} alt={song.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">{song.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{song.channel}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>{formatTime(elapsed)}</span>
                <span>{song.duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/5">
                <SkipForward className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/5">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AddSong({
  url,
  setUrl,
  preview,
  onPreview,
  onSubmit,
  submitting,
  justAdded,
}: {
  url: string;
  setUrl: (v: string) => void;
  preview: Song | null;
  onPreview: () => void;
  onSubmit: () => void;
  submitting: boolean;
  justAdded: boolean;
}) {
  return (
    <Card className="glass rounded-2xl border-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Plus className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Add a Song</h3>
          <p className="text-xs text-muted-foreground">Paste a YouTube link to add to the queue</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="pl-9 rounded-xl bg-white/5 border-white/10 placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
          />
        </div>
        <Button
          onClick={onPreview}
          variant="secondary"
          className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
          disabled={!url.trim()}
        >
          Preview
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex gap-3">
                <div className="relative h-20 w-32 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                  <img src={preview.thumbnail} alt={preview.title} className="h-full w-full object-cover" />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-medium tabular-nums">
                    {preview.duration}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-sm leading-tight line-clamp-2">{preview.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{preview.channel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span>Valid video detected</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={onSubmit}
                disabled={submitting}
                className="w-full mt-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding to queue...
                  </>
                ) : justAdded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Added to queue!
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit to Queue
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function QueueItem({
  song,
  position,
  isTop,
  voteState,
  onUpvote,
  onDownvote,
  index,
}: {
  song: Song;
  position: number;
  isTop: boolean;
  voteState: 'up' | 'down' | null;
  onUpvote: () => void;
  onDownvote: () => void;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card
        className={cn(
          'rounded-2xl border p-3 transition-all relative overflow-hidden',
          isTop
            ? 'glass-strong border-primary/30 gradient-border'
            : 'glass border-white/5 hover:border-white/10'
        )}
      >
        {isTop && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
        )}

        <div className="flex items-center gap-3">
          {/* Position */}
          <div className="flex flex-col items-center justify-center w-6 shrink-0">
            {isTop ? (
              <Crown className="h-4 w-4 text-primary" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground tabular-nums">{position}</span>
            )}
          </div>

          {/* Thumbnail */}
          <div className="relative h-14 w-20 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
            <img src={song.thumbnail} alt={song.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/80 text-[9px] font-medium tabular-nums">
              {song.duration}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={song.addedByAvatar} alt={song.addedBy} />
                <AvatarFallback className="text-[8px]">{song.addedBy.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground truncate">{song.addedBy}</span>
            </div>
          </div>

          {/* Voting */}
          <div className="relative shrink-0">
            <AnimatePresence>
              {voteState === 'up' && (
                <motion.span
                  key={`float-up-${song.id}-${song.votes}`}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], y: -22, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-primary z-10"
                >
                  +1
                </motion.span>
              )}
              {voteState === 'down' && (
                <motion.span
                  key={`float-down-${song.id}-${song.votes}`}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], y: 22, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 z-10"
                >
                  -1
                </motion.span>
              )}
            </AnimatePresence>

            <div
              className={cn(
                'flex flex-col items-center rounded-xl border transition-colors overflow-hidden',
                voteState === 'up'
                  ? 'bg-primary/10 border-primary/30'
                  : voteState === 'down'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/[0.03] border-white/5'
              )}
            >
              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.12 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                onClick={onUpvote}
                aria-label="Upvote"
                className={cn(
                  'flex h-7 w-9 items-center justify-center transition-colors',
                  voteState === 'up'
                    ? 'text-primary'
                    : 'text-muted-foreground/70 hover:text-primary hover:bg-primary/10'
                )}
              >
                <ChevronUp
                  className={cn(
                    'h-4 w-4 transition-transform',
                    voteState === 'up' && 'drop-shadow-[0_0_4px_rgba(29,185,84,0.6)]'
                  )}
                />
              </motion.button>

              <div
                className={cn(
                  'w-full h-px',
                  voteState === 'up'
                    ? 'bg-primary/20'
                    : voteState === 'down'
                      ? 'bg-red-500/20'
                      : 'bg-white/5'
                )}
              />

              <motion.span
                key={song.votes}
                initial={{ scale: 1.4, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                className={cn(
                  'text-xs font-bold tabular-nums py-0.5 leading-none',
                  voteState === 'up'
                    ? 'text-primary'
                    : voteState === 'down'
                      ? 'text-red-400'
                      : isTop
                        ? 'text-primary'
                        : 'text-foreground'
                )}
              >
                {song.votes}
              </motion.span>

              <div
                className={cn(
                  'w-full h-px',
                  voteState === 'up'
                    ? 'bg-primary/20'
                    : voteState === 'down'
                      ? 'bg-red-500/20'
                      : 'bg-white/5'
                )}
              />

              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.12 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                onClick={onDownvote}
                aria-label="Downvote"
                className={cn(
                  'flex h-7 w-9 items-center justify-center transition-colors',
                  voteState === 'down'
                    ? 'text-red-400'
                    : 'text-muted-foreground/70 hover:text-red-400 hover:bg-red-500/10'
                )}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    voteState === 'down' && 'drop-shadow-[0_0_4px_rgba(248,113,113,0.6)]'
                  )}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function QueueList({
  queue,
  voteStates,
  onUpvote,
  onDownvote,
}: {
  queue: Song[];
  voteStates: Record<string, 'up' | 'down' | null>;
  onUpvote: (id: string) => void;
  onDownvote: (id: string) => void;
}) {
  return (
    <Card className="glass rounded-2xl border-white/5 flex flex-col h-full max-h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <ListMusic className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Up Next</h3>
              <p className="text-xs text-muted-foreground">{queue.length} songs queued</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/5 border-white/10">
            <TrendingUp className="h-3 w-3 mr-1 text-primary" />
            Sorted by votes
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <LayoutGroup>
          <motion.div layout className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {queue.map((song, index) => (
                <QueueItem
                  key={song.id}
                  song={song}
                  position={index + 1}
                  isTop={index === 0}
                  voteState={voteStates[song.id] ?? null}
                  onUpvote={() => onUpvote(song.id)}
                  onDownvote={() => onDownvote(song.id)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">The queue is empty</p>
            <p className="text-xs text-muted-foreground/70">Add a song to get started</p>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <Card className="glass rounded-2xl border-white/5 p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-14 w-20 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-white/5" />
              <div className="h-2 w-1/2 rounded bg-white/5" />
            </div>
            <div className="h-8 w-8 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// Main Page

export default function StreamBeatsPage() {
  const [queue, setQueue] = useState<Song[]>(INITIAL_QUEUE);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<Song | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35);
  const [voteStates, setVoteStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const REFRESH_INTERVALE_MS = 10 * 100;


  async function refreshStreams(){
    const res = await axios.get(`/api/streams/my`, {
      withCredentials: true
    });
    console.log(res);
  }

  useEffect(() => {
    refreshStreams();
    
    const interval = setInterval(() => {

    }, REFRESH_INTERVALE_MS)
  }, [])

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 0;
        return Math.min(100, p + 0.15);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulate live listener count fluctuation
  const [listeners, setListeners] = useState(CREATOR.listeners);
  useEffect(() => {
    const interval = setInterval(() => {
      setListeners((l) => l + Math.floor(Math.random() * 21) - 10);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const sortedQueue = useMemo(
    () => [...queue].sort((a, b) => b.votes - a.votes),
    [queue]
  );

  const stats: Stats = useMemo(
    () => ({
      totalQueued: queue.length,
      totalVotes: queue.reduce((sum, s) => sum + Math.abs(s.votes), 0),
      activeUsers: listeners,
      playedToday: 23,
    }),
    [queue, listeners]
  );

  const handlePreview = useCallback(() => {
    const id = extractYouTubeId(url);
    if (!id) {
      setPreview(null);
      return;
    }
    setPreview({
      id: `preview-${id}`,
      videoId: id,
      title: 'YouTube Video',
      artist: 'Unknown Artist',
      channel: 'YouTube Channel',
      duration: '--:--',
      durationSeconds: 0,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      addedBy: 'You',
      addedByAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces',
      votes: 0,
    });
  }, [url]);

  // Auto-detect on URL change
  useEffect(() => {
    const id = extractYouTubeId(url);
    if (id) {
      setPreview({
        id: `preview-${id}`,
        videoId: id,
        title: 'YouTube Video',
        artist: 'Unknown Artist',
        channel: 'YouTube Channel',
        duration: '--:--',
        durationSeconds: 0,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        addedBy: 'You',
        addedByAvatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces',
        votes: 0,
      });
    } else {
      setPreview(null);
      setJustAdded(false);
    }
  }, [url]);

  const handleSubmit = useCallback(async () => {

    const res = await fetch("/api/streams/", {
      body: JSON.stringify({
        creatorId: "",
        url: inputLink
      })
    })
    if (!preview) return;
    setSubmitting(true);
    setTimeout(() => {
      const newSong: Song = {
        ...preview,
        id: `user-${Date.now()}`,
        title: preview.title === 'YouTube Video' ? 'Your Submitted Song' : preview.title,
        artist: preview.artist === 'Unknown Artist' ? 'Various Artists' : preview.artist,
        channel: preview.channel === 'YouTube Channel' ? 'Submitted by viewer' : preview.channel,
        duration: '3:45',
        durationSeconds: 225,
        votes: 1,
      };
      setQueue((q) => [...q, newSong]);
      setVoteStates((v) => ({ ...v, [newSong.id]: 'up' }));
      setSubmitting(false);
      setJustAdded(true);
      setUrl('');
      setPreview(null);
      setTimeout(() => setJustAdded(false), 2000);
    }, 1200);
  }, [preview]);

  const handleUpvote = useCallback((id: string) => {
    setQueue((q) =>
      q.map((s) => {
        if (s.id !== id) return s;
        const currentState = voteStates[id];
        let newVotes = s.votes;
        if (currentState === 'up') {
          newVotes = s.votes - 1;
        } else if (currentState === 'down') {
          newVotes = s.votes + 2;
        } else {
          newVotes = s.votes + 1;
        }
        return { ...s, votes: newVotes };
      })
    );

    fetch(`/api/streams/${handleUpvote ? "upvote" : "downvote"}`, {
      method: "POST",
      body: JSON.stringify({
        streamId: id
      })
    })
    setVoteStates((v) => ({
      ...v,
      [id]: voteStates[id] === 'up' ? null : 'up',
    }));
  }, [voteStates]);

  const handleDownvote = useCallback((id: string) => {
    setQueue((q) =>
      q.map((s) => {
        if (s.id !== id) return s;
        const currentState = voteStates[id];
        let newVotes = s.votes;
        if (currentState === 'down') {
          newVotes = s.votes + 1;
        } else if (currentState === 'up') {
          newVotes = s.votes - 2;
        } else {
          newVotes = s.votes - 1;
        }
        return { ...s, votes: newVotes };
      })
    );
    setVoteStates((v) => ({
      ...v,
      [id]: voteStates[id] === 'down' ? null : 'down',
    }));
  }, [voteStates]);

  const creatorWithLive = { ...CREATOR, listeners };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">StreamBeats</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Live Song Voting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LiveBadge />
            <Separator orientation="vertical" className="h-5 bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="tabular-nums font-medium text-foreground">{listeners.toLocaleString()}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_380px] gap-5">
          {/* Left Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-[4.5rem] lg:self-start">
            <CreatorCard creator={creatorWithLive} queueLength={queue.length} />

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <StatCard
                icon={ListMusic}
                label="Songs Queued"
                value={stats.totalQueued.toString()}
                color="bg-primary/15 text-primary"
                delay={0.1}
              />
              <StatCard
                icon={Vote}
                label="Votes Cast"
                value={stats.totalVotes.toLocaleString()}
                color="bg-blue-500/15 text-blue-400"
                delay={0.15}
              />
              <StatCard
                icon={Users}
                label="Active Users"
                value={stats.activeUsers.toLocaleString()}
                color="bg-purple-500/15 text-purple-400"
                delay={0.2}
              />
              <StatCard
                icon={Music2}
                label="Played Today"
                value={stats.playedToday.toString()}
                color="bg-orange-500/15 text-orange-400"
                delay={0.25}
              />
            </div>
          </aside>

          {/* Center Content */}
          <section className="space-y-5 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NowPlaying song={CURRENT_SONG} isPlaying={isPlaying} progress={progress} />
            </motion.div>

            <AddSong
              url={url}
              setUrl={setUrl}
              preview={preview}
              onPreview={handlePreview}
              onSubmit={handleSubmit}
              submitting={submitting}
              justAdded={justAdded}
            />

            {/* Mobile queue */}
            <div className="lg:hidden">
              {loading ? (
                <QueueSkeleton />
              ) : (
                <QueueList
                  queue={sortedQueue}
                  voteStates={voteStates}
                  onUpvote={handleUpvote}
                  onDownvote={handleDownvote}
                />
              )}
            </div>
          </section>

          {/* Right Sidebar - Desktop Queue */}
          <aside className="hidden lg:block lg:sticky lg:top-[4.5rem] lg:self-start lg:h-[calc(100vh-6rem)]">
            {loading ? (
              <QueueSkeleton />
            ) : (
              <QueueList
                queue={sortedQueue}
                voteStates={voteStates}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
