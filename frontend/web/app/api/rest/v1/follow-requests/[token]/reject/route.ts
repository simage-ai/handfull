import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// POST - Reject a follow request
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
  });

  if (!followRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
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

  // Update request status
  await prisma.followRequest.update({
    where: { token },
    data: { status: "REJECTED", targetUserId: session.user.id },
  });

  revalidatePath("/settings");

  return NextResponse.json({ message: "Request rejected" });
}
