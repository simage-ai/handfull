import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List users following me
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followers = await prisma.follow.findMany({
    where: { followingId: session.user.id },
    include: {
      follower: {
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
    data: followers.map((f: { id: string; follower: unknown; createdAt: Date }) => ({
      id: f.id,
      user: f.follower,
      followedAt: f.createdAt,
    })),
  });
}
