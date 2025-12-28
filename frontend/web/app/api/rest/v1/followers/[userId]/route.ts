import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// DELETE - Remove a follower
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: session.user.id,
      },
    },
  });

  if (!follow) {
    return NextResponse.json(
      { error: "This user is not following you" },
      { status: 404 }
    );
  }

  await prisma.follow.delete({
    where: { id: follow.id },
  });

  revalidatePath("/settings");

  return NextResponse.json({ message: "Follower removed" });
}
