import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prismaClient } from "@repo/db/client";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  callbacks: {
    async signIn(params) {
      if (!params.user.email) {
        return false;
      }
      try {
        await prismaClient.user.upsert({
          where: { email: params.user.email },
          update: {},
          create: {
            email: params.user.email,
            provider: params.account?.provider === "github" ? "Github" : "Google"
          }
        });
        return true;
      } catch (e) {
        console.error("signIn callback failed:", e);
        return false;
      }
    }
  }
})

export { handler as GET, handler as POST }
