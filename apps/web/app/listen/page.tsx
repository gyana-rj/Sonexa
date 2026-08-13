import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ListenClient } from "@/components/listen/listen-client";

export const metadata: Metadata = {
  title: "Listen — Sonexa",
  description: "Search for any track and play it instantly on Sonexa.",
};

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mood?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { q, mood } = await searchParams;

  // Signed-in-only space. Bounce guests to the sign-in flow, returning here after.
  if (!session?.user?.email) {
    const returnTo = `/listen${q ? `?q=${encodeURIComponent(q)}` : mood ? `?mood=${encodeURIComponent(mood)}` : ''}`;
    redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  return (
    <ListenClient
      userName={session.user.name ?? session.user.email}
      userImage={session.user.image ?? null}
      initialQuery={q?.trim() || undefined}
      initialMood={mood?.trim() || undefined}
    />
  );
}
