import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/server/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.warn("[AUTH] Sign-in denied: No email provided by provider.", { provider: account?.provider });
        return false;
      }

      try {
        const githubUsername = account?.provider === "github" ? (profile as any)?.login : null;

        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            ...(githubUsername ? { githubUsername } : {}),
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            ...(githubUsername ? { githubUsername } : {}),
          },
        });

        if (account?.provider === "github" && account.access_token) {
          await prisma.gitHubData.upsert({
            where: { userId: dbUser.id },
            update: { accessToken: account.access_token },
            create: {
              userId: dbUser.id,
              accessToken: account.access_token,
              repositories: [],
              signals: {},
            }
          });
          console.log("[AUTH] GitHub access token saved for user:", dbUser.id);
        }
      } catch (error) {
        console.error("[AUTH] Database sync error during sign-in:", error);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "github" && account.access_token) {
        token.accessToken = account.access_token;
        
        // Persist to GitHubData for background sync
        const email = user?.email || token.email;
        if (email) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { email } });
            if (dbUser) {
              await prisma.gitHubData.upsert({
                where: { userId: dbUser.id },
                update: { accessToken: account.access_token },
                create: {
                  userId: dbUser.id,
                  accessToken: account.access_token,
                  repositories: [],
                  signals: {},
                }
              });
              console.log("[AUTH] GitHub token persisted in JWT callback for:", dbUser.id);
            }
          } catch (e) {
            console.error("[AUTH] Failed to persist token in JWT:", e);
          }
        }
      }

      // If we don't have a database-style ID yet
      if (user || !token.id?.toString().startsWith('c')) {
        const email = user?.email || token.email;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: email as string }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.githubUsername = dbUser.githubUsername;
          }
        }
      }
      return token;
    }
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider === "github" && account.access_token && user.id) {
        await prisma.gitHubData.upsert({
          where: { userId: user.id },
          update: { accessToken: account.access_token },
          create: {
            userId: user.id,
            accessToken: account.access_token,
            repositories: [],
            signals: {},
          }
        });
        console.log("[AUTH] GitHub token saved via event (linkAccount) for:", user.id);
      }
    },
    async signIn({ user, account }) {
      if (account?.provider === "github" && account.access_token && user.id) {
        await prisma.gitHubData.upsert({
          where: { userId: user.id },
          update: { accessToken: account.access_token },
          create: {
            userId: user.id,
            accessToken: account.access_token,
            repositories: [],
            signals: {},
          }
        });
        console.log("[AUTH] GitHub token saved via event (signIn) for:", user.id);
      }
    }
  },
});
