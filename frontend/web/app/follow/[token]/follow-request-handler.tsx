"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, UserPlus, UserCheck, X } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

interface FollowRequestHandlerProps {
  token: string;
  type: "FOLLOW" | "INVITE";
  requester: User;
}

export function FollowRequestHandler({
  token,
  type,
  requester,
}: FollowRequestHandlerProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(
        `/api/rest/v1/follow-requests/${token}/accept`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept request");
      }

      toast.success(data.message);
      setIsDone(true);
      // Redirect to feed after a short delay
      setTimeout(() => {
        router.push("/feed");
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept request"
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(
        `/api/rest/v1/follow-requests/${token}/reject`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      toast.success("Request rejected");
      setIsDone(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setIsRejecting(false);
    }
  };

  const getInitials = () => {
    return `${requester.firstName?.[0] || ""}${requester.lastName?.[0] || ""}`.toUpperCase();
  };

  const requesterName = `${requester.firstName} ${requester.lastName}`.trim();

  if (isDone) {
    return (
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-muted-foreground">Redirecting...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full mx-4">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={requester.image || undefined} />
            <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">
          {type === "FOLLOW" ? "Follow Request" : "Follow Invitation"}
        </CardTitle>
        <CardDescription className="text-base">
          {type === "FOLLOW" ? (
            <>
              <strong>{requesterName}</strong> wants to follow your meal log.
              <br />
              <span className="text-sm">
                If you accept, they&apos;ll see your meals in their feed.
              </span>
            </>
          ) : (
            <>
              <strong>{requesterName}</strong> invited you to follow their meal
              log.
              <br />
              <span className="text-sm">
                If you accept, you&apos;ll see their meals in your feed.
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          {type === "FOLLOW" ? (
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          ) : (
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="text-sm">
            <p className="font-medium">{requesterName}</p>
            <p className="text-muted-foreground">{requester.email}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Decline
        </Button>
        <Button
          className="flex-1"
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
