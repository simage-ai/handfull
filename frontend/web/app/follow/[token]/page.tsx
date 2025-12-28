import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FollowRequestHandler } from "./follow-request-handler";

interface FollowPageProps {
  params: Promise<{ token: string }>;
}

export default async function FollowPage({ params }: FollowPageProps) {
  const { token } = await params;
  const session = await auth();

  // Fetch the request to display info
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
    },
  });

  // Request not found
  if (!followRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h1 className="text-2xl font-bold mb-2">Request Not Found</h1>
          <p className="text-muted-foreground">
            This follow request doesn&apos;t exist or may have been cancelled.
          </p>
        </div>
      </div>
    );
  }

  // Request expired
  if (followRequest.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <div className="mb-4 text-6xl">⏰</div>
          <h1 className="text-2xl font-bold mb-2">Request Expired</h1>
          <p className="text-muted-foreground">
            This follow request has expired. Please ask{" "}
            {followRequest.requester.firstName} to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // Request already processed
  if (followRequest.status !== "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <div className="mb-4 text-6xl">
            {followRequest.status === "ACCEPTED" ? "✅" : "❌"}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Request Already {followRequest.status.toLowerCase()}
          </h1>
          <p className="text-muted-foreground">
            This follow request has already been{" "}
            {followRequest.status.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to sign in with callback
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/follow/${token}`);
    redirect(`/signin?callbackUrl=${callbackUrl}`);
  }

  // Check if the current user is the target
  const isTargetByEmail =
    followRequest.targetEmail.toLowerCase() ===
    session.user.email?.toLowerCase();
  const isTargetById = followRequest.targetUserId === session.user.id;

  if (!isTargetByEmail && !isTargetById) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 text-center">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Wrong Account</h1>
          <p className="text-muted-foreground mb-4">
            This request was sent to{" "}
            <strong>{followRequest.targetEmail}</strong>, but you&apos;re
            signed in as <strong>{session.user.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign in with the correct account to respond to this request.
          </p>
        </div>
      </div>
    );
  }

  // Show the request handler
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <FollowRequestHandler
        token={token}
        type={followRequest.type}
        requester={followRequest.requester}
      />
    </div>
  );
}
