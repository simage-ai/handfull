import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, Home } from "lucide-react";

export function SharingDisabled() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <ShieldX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
          Meal History Not Available
        </h1>
        <p className="text-muted-foreground mb-8">
          This user either doesn&apos;t exist or has not enabled sharing of
          their meal history. If you believe this is an error, please contact
          the person who shared this link.
        </p>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
