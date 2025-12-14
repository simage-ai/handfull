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

// Default meal plan templates for new users
const DEFAULT_MEAL_PLANS = [
  {
    name: "Cut",
    proteinSlots: 4,
    carbSlots: 2,
    veggieSlots: 3,
    fatSlots: 1,
    junkSlots: 0,
  },
  {
    name: "Maintain",
    proteinSlots: 4,
    carbSlots: 3,
    veggieSlots: 3,
    fatSlots: 2,
    junkSlots: 1,
  },
  {
    name: "Bulk",
    proteinSlots: 5,
    carbSlots: 4,
    veggieSlots: 3,
    fatSlots: 2,
    junkSlots: 1,
  },
];

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

      const { firstName, lastName } = processName(user.name);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { email: user.email },
          data: {
            firstName,
            lastName,
            image: user.image,
          },
        });
      } else {
        // Create new user with default meal plans
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            firstName,
            lastName,
            image: user.image,
          },
        });

        // Create default meal plans for new user
        const createdPlans = await prisma.plan.createManyAndReturn({
          data: DEFAULT_MEAL_PLANS.map((plan) => ({
            ...plan,
            userId: newUser.id,
          })),
        });

        // Set "Cut" plan as active by default
        const cutPlan = createdPlans.find((p) => p.name === "Cut");
        if (cutPlan) {
          await prisma.user.update({
            where: { id: newUser.id },
            data: { activePlanId: cutPlan.id },
          });
        }
      }

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
