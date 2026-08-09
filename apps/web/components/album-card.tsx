'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/lib/player-context';
import { EqualizerBars } from './equalizer-bars';
import type { Album, Song } from '@/lib/data';
import { getAlbumSongs, getSong } from '@/lib/data';

interface AlbumCardProps {
  album: Album;
  className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
  const { currentSong, isPlaying, playQueue, togglePlay } = usePlayer();

  const albumSongs = getAlbumSongs(album.id);
  const isCurrentAlbum = currentSong?.albumId === album.id;
  const isThisPlaying = isCurrentAlbum && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentAlbum) {
      togglePlay();
    } else if (albumSongs.length > 0) {
      playQueue(albumSongs, 0);
    }
  };

  return (
    <Link href={`/album/${album.id}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'relative rounded-2xl p-3 transition-colors duration-300 hover:bg-white/[0.04]',
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl shadow-soft">
          <img
            src={album.cover}
            alt={album.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <motion.button
            onClick={handlePlay}
            initial={{ opacity: 0, y: 8 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-glow"
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
          >
            <AnimatePlayPause playing={isThisPlaying} />
          </motion.button>
          {isCurrentAlbum && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
              <EqualizerBars playing={isPlaying} className="text-highlight" color="#22C55E" />
            </div>
          )}
        </div>
        <div className="mt-3 px-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{album.title}</h3>
          <p className="truncate text-xs text-muted-foreground mt-0.5">{album.artistName}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function AnimatePlayPause({ playing }: { playing: boolean }) {
  return (
    <motion.div
      key={playing ? 'pause' : 'play'}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {playing ? <Pause size={18} className="fill-current" /> : <Play size={18} className="ml-0.5 fill-current" />}
    </motion.div>
  );
}

interface PlaylistCardProps {
  playlist: {
    id: string;
    title: string;
    description: string;
    cover: string;
    songIds: string[];
    color?: string;
  };
  className?: string;
}

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
  const { currentSong, isPlaying, playQueue, togglePlay } = usePlayer();

  const playlistSongs = playlist.songIds
    .map((id) => getSong(id))
    .filter(Boolean) as Song[];

  const isCurrent = currentSong && playlistSongs.some((s) => s.id === currentSong.id);
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else if (playlistSongs.length > 0) {
      playQueue(playlistSongs, 0);
    }
  };

  return (
    <Link href={`/playlist/${playlist.id}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'relative rounded-2xl p-3 transition-colors duration-300 hover:bg-white/[0.04]',
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl shadow-soft">
          <img
            src={playlist.cover}
            alt={playlist.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-0"
            style={{
              background: `linear-gradient(135deg, ${playlist.color || '#7C3AED'}66, transparent)`,
            }}
          />
          <motion.button
            onClick={handlePlay}
            initial={{ opacity: 0, y: 8 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-glow"
            aria-label={isThisPlaying ? 'Pause' : 'Play'}
          >
            <AnimatePlayPause playing={!!isThisPlaying} />
          </motion.button>
        </div>
        <div className="mt-3 px-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{playlist.title}</h3>
          <p className="truncate text-xs text-muted-foreground mt-0.5 line-clamp-2">{playlist.description}</p>
        </div>
      </motion.div>
    </Link>
  );
}


