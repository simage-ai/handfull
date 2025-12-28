import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  generateToken,
  sendFollowRequestEmail,
  sendFollowInviteEmail,
} from "@/lib/email";

const CreateFollowRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["FOLLOW", "INVITE"]),
});

// GET - List my follow requests (sent and received)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sent, received] = await Promise.all([
    // Requests I've sent
    prisma.followRequest.findMany({
      where: {
        requesterId: session.user.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        targetUser: {
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
    }),
    // Requests I've received (by email or user ID)
    prisma.followRequest.findMany({
      where: {
        OR: [
          { targetUserId: session.user.id },
          { targetEmail: session.user.email! },
        ],
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
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
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      sent,
      received,
    },
  });
}

// POST - Create a new follow request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateFollowRequestSchema.parse(body);

    // Can't send request to yourself
    if (validated.email.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot send a request to yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    // Check for existing relationship
    if (targetUser) {
      const existingFollow = await prisma.follow.findFirst({
        where:
          validated.type === "FOLLOW"
            ? { followerId: session.user.id, followingId: targetUser.id }
            : { followerId: targetUser.id, followingId: session.user.id },
      });

      if (existingFollow) {
        return NextResponse.json(
          {
            error:
              validated.type === "FOLLOW"
                ? "You are already following this user"
                : "This user is already following you",
          },
          { status: 400 }
        );
      }
    }

    // Check for pending request
    const existingRequest = await prisma.followRequest.findFirst({
      where: {
        requesterId: session.user.id,
        targetEmail: validated.email.toLowerCase(),
        type: validated.type,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A pending request already exists for this email" },
        { status: 400 }
      );
    }

    // Generate token and create request
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const followRequest = await prisma.followRequest.create({
      data: {
        requesterId: session.user.id,
        targetEmail: validated.email.toLowerCase(),
        targetUserId: targetUser?.id,
        token,
        type: validated.type,
        expiresAt,
      },
      include: {
        requester: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Get requester info
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true },
    });

    const requesterName = `${requester?.firstName} ${requester?.lastName}`.trim();
    const requesterEmail = requester?.email || "";

    // Send email based on type
    const emailResult =
      validated.type === "FOLLOW"
        ? await sendFollowRequestEmail({
            requesterName,
            requesterEmail,
            targetEmail: validated.email,
            token,
          })
        : await sendFollowInviteEmail({
            requesterName,
            requesterEmail,
            targetEmail: validated.email,
            token,
          });

    if (!emailResult.success) {
      // Still return success since the request was created
      console.error("Failed to send email:", emailResult.error);
    }

    revalidatePath("/settings");

    return NextResponse.json(
      {
        data: {
          id: followRequest.id,
          type: followRequest.type,
          targetEmail: followRequest.targetEmail,
          status: followRequest.status,
          expiresAt: followRequest.expiresAt,
        },
        message: `${validated.type === "FOLLOW" ? "Follow request" : "Invitation"} sent successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create follow request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
