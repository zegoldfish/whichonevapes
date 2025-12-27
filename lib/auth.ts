import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GitHubProvider from "next-auth/providers/github";
import { isApprovedAdmin } from "@/lib/admins";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.login = (user as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).login = token.login;
      }
      return session;
    },
    async signIn({ user }) {
      // Check if GitHub user's email is approved admin via DynamoDB
      const email = user.email;
      if (!email) {
        throw new Error("GitHub email not found");
      }
      const approved = await isApprovedAdmin(email);
      if (!approved) {
        throw new Error("Email not authorized for admin access");
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get session in server components and API routes
export function auth() {
  return getServerSession(authOptions);
}
