import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List users I'm following
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    include: {
      following: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: following.map((f: { id: string; following: unknown; createdAt: Date }) => ({
      id: f.id,
      user: f.following,
      followedAt: f.createdAt,
    })),
  });
}
