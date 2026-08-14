import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the auth config — no providers, no Prisma/bcrypt import
// chain, because Next.js Middleware runs on the Edge runtime and can't load
// Node-only packages like `pg`. Kept separate from auth.ts, whose Credentials
// provider needs the database. See Build Spec v2 §06.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as "STUDENT" | "ADMIN";
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
