import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignInClient } from "@/components/signin/signin-client";

export const metadata: Metadata = {
  title: "Sign in — Sonexa",
  description: "Sign in to Sonexa to search and play any track instantly.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { error, callbackUrl } = await searchParams;

  // Already signed in — send home so they see the Open app prompt.
  if (session?.user?.email) {
    redirect(callbackUrl ?? '/');
  }

  return <SignInClient error={error ?? null} callbackUrl={callbackUrl ?? '/'} />;
}
