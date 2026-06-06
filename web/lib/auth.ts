import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/schemas/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            return null;
          }

          const result = await res.json();
          if (result.data && result.data.id) {
            return {
              id: result.data.id,
              email: result.data.email,
              name: result.data.name,
              image: result.data.image || null,
            };
          }
          return null;
        } catch (err) {
          logger.error({ err }, "Credentials auth error calling backend");
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              providerId: account.providerAccountId,
            }),
          });

          if (!res.ok) {
            return false;
          }

          const result = await res.json();
          if (result.data && result.data.id) {
            user.id = result.data.id;
            return true;
          }
          return false;
        } catch (err) {
          logger.error({ err, email: user.email }, "Google Sign-in backend sync error");
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (session.user.email) {
          try {
            const res = await fetch(`${BACKEND_URL}/api/auth/user-by-email?email=${session.user.email}`);
            if (res.ok) {
              const result = await res.json();
              if (result.data && result.data.id) {
                session.user.id = result.data.id;
              }
            }
          } catch (e) {
            logger.error({ e }, "Session callback fallback error");
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || "dev-secret-change-in-production",
  trustHost: true,
});
