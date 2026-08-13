'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

/**
 * Share the room link. On devices with the Web Share API it opens the native
 * share sheet (the user picks where it goes); otherwise it copies the link to
 * the clipboard. Pass `url` to share a specific room; defaults to the current page.
 */
export function ShareButton({ url, label = 'Share' }: { url?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const ready = url !== undefined ? Boolean(url) : true;

  async function onShare() {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (!shareUrl) return;

    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: 'Join my listening room', url: shareUrl });
        return;
      } catch {
        // user dismissed the sheet, or share failed — fall through to copy
      }
    }
    try {
      await nav?.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — nothing else we can safely do */
    }
  }

  return (
    <button
      onClick={onShare}
      disabled={!ready}
      className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-xs text-cream/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-cream disabled:opacity-40"
      aria-label="Share this room"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#2ec4b6]" /> Link copied
        </>
      ) : (
        <>
          {url === undefined ? <Share2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {label}
        </>
      )}
    </button>
  );
}
