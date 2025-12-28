import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// POST - Accept a follow request
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const followRequest = await prisma.followRequest.findUnique({
    where: { token },
    include: {
      requester: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!followRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Check if expired
  if (followRequest.expiresAt < new Date()) {
    await prisma.followRequest.update({
      where: { token },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "This request has expired" },
      { status: 410 }
    );
  }

  // Check if already processed
  if (followRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: `This request has already been ${followRequest.status.toLowerCase()}` },
      { status: 410 }
    );
  }

  // Verify the current user is the target
  const isTargetByEmail =
    followRequest.targetEmail.toLowerCase() ===
    session.user.email.toLowerCase();
  const isTargetById = followRequest.targetUserId === session.user.id;

  if (!isTargetByEmail && !isTargetById) {
    return NextResponse.json(
      { error: "This request is not intended for you" },
      { status: 403 }
    );
  }

  // Determine follower/following based on request type
  // FOLLOW: requester wants to follow target → requester is follower, target is following
  // INVITE: requester invites target to follow them → target is follower, requester is following
  const followerId =
    followRequest.type === "FOLLOW"
      ? followRequest.requesterId
      : session.user.id;
  const followingId =
    followRequest.type === "FOLLOW"
      ? session.user.id
      : followRequest.requesterId;

  // Check if follow relationship already exists
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existingFollow) {
    // Mark request as accepted even if relationship exists
    await prisma.followRequest.update({
      where: { token },
      data: { status: "ACCEPTED", targetUserId: session.user.id },
    });
    return NextResponse.json({
      message: "Follow relationship already exists",
      data: { followerId, followingId },
    });
  }

  // Create follow relationship and update request in transaction
  const [follow] = await prisma.$transaction([
    prisma.follow.create({
      data: { followerId, followingId },
    }),
    prisma.followRequest.update({
      where: { token },
      data: { status: "ACCEPTED", targetUserId: session.user.id },
    }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/feed");

  return NextResponse.json({
    message:
      followRequest.type === "FOLLOW"
        ? `${followRequest.requester.firstName} is now following you`
        : `You are now following ${followRequest.requester.firstName}`,
    data: {
      followId: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
    },
  });
}
