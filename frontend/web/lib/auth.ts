/**
 * Auth.js (NextAuth v5) configuration with Google OAuth
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const processName = (name: string | null | undefined) => {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Upsert user in database on sign in
      const { firstName, lastName } = processName(user.name);

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          firstName,
          lastName,
          image: user.image,
        },
        create: {
          email: user.email,
          firstName,
          lastName,
          image: user.image,
        },
      });

      return true;
    },

    async jwt({ token, profile }) {
      if (profile) {
        const { firstName, lastName } = processName(
          (profile as { name?: string }).name
        );
        token.firstName = firstName;
        token.lastName = lastName;
        token.fullName = (profile as { name?: string }).name || "";
      }

      // Fetch user ID from database
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
});
