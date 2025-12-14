"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface SharingSettingsProps {
  userId: string;
  initialSharingEnabled: boolean;
}

export function SharingSettings({
  userId,
  initialSharingEnabled,
}: SharingSettingsProps) {
  const router = useRouter();
  const [sharingEnabled, setSharingEnabled] = useState(initialSharingEnabled);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${userId}`
      : "";

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleToggleChange = async (enabled: boolean) => {
    if (enabled) {
      setShowEnableDialog(true);
    } else {
      await updateSharing(false);
    }
  };

  const updateSharing = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/rest/v1/users/me/sharing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharingEnabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sharing settings");
      }

      setSharingEnabled(enabled);
      toast.success(
        enabled
          ? "Sharing enabled! Your meal history is now visible."
          : "Sharing disabled. Your meal history is now private."
      );
      router.refresh();
    } catch {
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEnable = async () => {
    setShowEnableDialog(false);
    await updateSharing(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Share Your Meal Log</CardTitle>
          <CardDescription>
            Share your meal history with your trainer or nutritionist. They can
            view your meals but cannot make changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sharing-toggle" className="text-base">
                Enable Sharing
              </Label>
              <p className="text-sm text-muted-foreground">
                {sharingEnabled
                  ? "Your meal history is publicly accessible via the link below."
                  : "Your meal history is private and cannot be viewed by others."}
              </p>
            </div>
            <Switch
              id="sharing-toggle"
              checked={sharingEnabled}
              onCheckedChange={handleToggleChange}
              disabled={isLoading}
            />
          </div>

          {sharingEnabled && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-medium">Your Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button onClick={copyShareLink} variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view your meal history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Enable Public Sharing?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Anyone with your share link will be able to see your complete meal
              history, including photos, macros, and timestamps.
              <br />
              <br />
              Make sure you only share this link with people you trust, such as
              your trainer or nutritionist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEnable}>
              Enable Sharing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
