"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  UserPlus,
  UserMinus,
  Clock,
  Check,
  X,
  Users,
  Send,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

interface FollowRequest {
  id: string;
  token: string;
  type: "FOLLOW" | "INVITE";
  status: string;
  targetEmail: string;
  expiresAt: string;
  createdAt: string;
  requester?: User;
  targetUser?: User | null;
}

interface FollowRelation {
  id: string;
  user: User;
  followedAt: string;
}

export function FollowSettings() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<"FOLLOW" | "INVITE">("FOLLOW");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Data states
  const [sentRequests, setSentRequests] = useState<FollowRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FollowRequest[]>([]);
  const [following, setFollowing] = useState<FollowRelation[]>([]);
  const [followers, setFollowers] = useState<FollowRelation[]>([]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [requestsRes, followingRes, followersRes] = await Promise.all([
        fetch("/api/rest/v1/follow-requests"),
        fetch("/api/rest/v1/following"),
        fetch("/api/rest/v1/followers"),
      ]);

      if (requestsRes.ok) {
        const { data } = await requestsRes.json();
        setSentRequests(data.sent || []);
        setReceivedRequests(data.received || []);
      }

      if (followingRes.ok) {
        const { data } = await followingRes.json();
        setFollowing(data || []);
      }

      if (followersRes.ok) {
        const { data } = await followersRes.json();
        setFollowers(data || []);
      }
    } catch (error) {
      console.error("Error fetching follow data:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/rest/v1/follow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: requestType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      toast.success(data.message);
      setEmail("");
      fetchData();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (token: string) => {
    try {
      const response = await fetch(`/api/rest/v1/follow-requests/${token}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel request");
      }

      toast.success("Request cancelled");
      fetchData();
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const handleAcceptRequest = async (token: string) => {
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
      fetchData();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept request"
      );
    }
  };

  const handleRejectRequest = async (token: string) => {
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
      fetchData();
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/rest/v1/following/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }

      toast.success("Unfollowed successfully");
      fetchData();
      router.refresh();
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    try {
      const response = await fetch(`/api/rest/v1/followers/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove follower");
      }

      toast.success("Follower removed");
      fetchData();
    } catch {
      toast.error("Failed to remove follower");
    }
  };

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Follow System
        </CardTitle>
        <CardDescription>
          Connect with trainers, nutritionists, or friends to share and view
          meal logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Send Request Form */}
        <form onSubmit={handleSendRequest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Send a Request</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Select
                value={requestType}
                onValueChange={(v) => setRequestType(v as "FOLLOW" | "INVITE")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOLLOW">
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Follow them
                    </span>
                  </SelectItem>
                  <SelectItem value="INVITE">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Invite to follow me
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading || !email.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {requestType === "FOLLOW"
                ? "Request to follow their meal log. They must approve."
                : "Invite them to follow your meal log."}
            </p>
          </div>
        </form>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Pending Received Requests */}
            {receivedRequests.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending Requests ({receivedRequests.length})
                  </Label>
                  <div className="space-y-2">
                    {receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={request.requester?.image || undefined}
                            />
                            <AvatarFallback>
                              {request.requester
                                ? getInitials(request.requester)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {request.requester?.firstName}{" "}
                              {request.requester?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.type === "FOLLOW"
                                ? "wants to follow you"
                                : "invited you to follow them"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptRequest(request.token)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectRequest(request.token)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Sent Requests ({sentRequests.length})
                  </Label>
                  <div className="space-y-2">
                    {sentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={request.targetUser?.image || undefined}
                            />
                            <AvatarFallback>
                              {request.targetUser
                                ? getInitials(request.targetUser)
                                : request.targetEmail[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {request.targetUser
                                ? `${request.targetUser.firstName} ${request.targetUser.lastName}`
                                : request.targetEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.type === "FOLLOW"
                                ? "Follow request"
                                : "Invitation"}{" "}
                              • Expires {formatDate(request.expiresAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelRequest(request.token)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Following */}
            {following.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Following ({following.length})
                  </Label>
                  <div className="space-y-2">
                    {following.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={rel.user.image || undefined} />
                            <AvatarFallback>
                              {getInitials(rel.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {rel.user.firstName} {rel.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Following since {formatDate(rel.followedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnfollow(rel.user.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Followers */}
            {followers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Followers ({followers.length})
                  </Label>
                  <div className="space-y-2">
                    {followers.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={rel.user.image || undefined} />
                            <AvatarFallback>
                              {getInitials(rel.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {rel.user.firstName} {rel.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Follower since {formatDate(rel.followedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFollower(rel.user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {following.length === 0 &&
              followers.length === 0 &&
              sentRequests.length === 0 &&
              receivedRequests.length === 0 && (
                <>
                  <Separator />
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No connections yet.</p>
                    <p className="text-xs">
                      Send a request above to get started.
                    </p>
                  </div>
                </>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
