import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get follow request details by token
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const followRequest = await prisma.followRequest.findUnique({
    where: { token },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!followRequest) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  // Check if expired
  if (followRequest.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This request has expired", status: "EXPIRED" },
      { status: 410 }
    );
  }

  // Check if already processed
  if (followRequest.status !== "PENDING") {
    return NextResponse.json(
      {
        error: `This request has already been ${followRequest.status.toLowerCase()}`,
        status: followRequest.status,
      },
      { status: 410 }
    );
  }

  return NextResponse.json({
    data: {
      id: followRequest.id,
      type: followRequest.type,
      status: followRequest.status,
      targetEmail: followRequest.targetEmail,
      expiresAt: followRequest.expiresAt,
      createdAt: followRequest.createdAt,
      requester: followRequest.requester,
    },
  });
}

// DELETE - Cancel a follow request (by requester only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const followRequest = await prisma.followRequest.findUnique({
    where: { token },
  });

  if (!followRequest) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  // Only requester can cancel
  if (followRequest.requesterId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only cancel your own requests" },
      { status: 403 }
    );
  }

  await prisma.followRequest.delete({
    where: { token },
  });

  return NextResponse.json({ message: "Request cancelled" });
}
