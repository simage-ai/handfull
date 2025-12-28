import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeedContent } from "@/components/domain/feed/feed-content";

export default async function FeedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feed</h2>
        <p className="text-muted-foreground">
          See meals from people you&apos;re following.
        </p>
      </div>

      <FeedContent />
    </div>
  );
}
