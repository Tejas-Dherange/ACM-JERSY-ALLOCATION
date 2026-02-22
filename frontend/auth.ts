import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/emailWhitelist";

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if email is in the whitelist
      if (!isEmailAllowed(user.email)) {
        console.log(`[Auth] Sign-in denied for email: ${user.email}`);
        return false; // Deny sign-in
      }
      return true; // Allow sign-in
    },
    async jwt({ token, user }) {
      // Add user ID to JWT token on sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session from JWT token
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt", // Use JWT for middleware compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
  }
}
