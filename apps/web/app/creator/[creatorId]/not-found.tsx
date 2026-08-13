import Link from "next/link";
import Backdrop from "@/components/dashboard/backdrop";

export default function CreatorNotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <Backdrop />
      <div className="relative w-full max-w-md rounded-[1.75rem] bg-white/[0.045] p-10 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-[#ffb86b]">404</p>
        <h1 className="mt-4 font-display text-3xl font-light text-cream">Host not found</h1>
        <p className="mt-3 text-sm text-cream/50">
          This profile doesn’t exist — the link may be old, or the host hasn’t signed in yet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff8a3d] to-[#ffb86b] px-4 py-4 text-sm font-medium text-[#0b1020] shadow-[0_14px_45px_rgba(255,138,61,0.38)] transition hover:brightness-105"
        >
          Back to Sonexa
        </Link>
      </div>
    </div>
  );
}
