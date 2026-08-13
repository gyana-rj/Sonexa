import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prismaClient } from "@repo/db/client";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  session: { strategy: "jwt" },
  // Route NextAuth's default sign-in and error screens to our own branded page.
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn(params) {
      // We need an email to identify the user.
      if (!params.user.email) {
        return false;
      }

      // Best-effort persistence: record the user, but never block sign-in if the
      // database happens to be unreachable. The core listening experience does not
      // depend on the DB, so a transient DB outage should not lock people out.
      try {
        await prismaClient.user.upsert({
          where: { email: params.user.email },
          update: {},
          create: {
            email: params.user.email,
            provider: params.account?.provider === "github" ? "Github" : "Google",
          },
        });
      } catch (e) {
        console.error("signIn: could not persist user (continuing anyway):", e);
      }

      return true;
    },
  },
};
