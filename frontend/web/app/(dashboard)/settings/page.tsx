import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SharingSettings } from "@/components/domain/settings/sharing-settings";
import { FollowSettings } from "@/components/domain/settings/follow-settings";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      sharingEnabled: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <SharingSettings
          userId={user.id}
          initialSharingEnabled={user.sharingEnabled}
        />

        <FollowSettings />
      </div>
    </div>
  );
}
