import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutsTable } from "@/components/domain/workouts/workouts-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

async function getWorkouts(userId: string) {
  return prisma.workout.findMany({
    where: { userId },
    orderBy: { dateTime: "desc" },
    take: 100,
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });
}

export default async function WorkoutsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workouts = await getWorkouts(session.user.id);

  return (
    <div className="space-y-6">
      {/* Mobile header: stacked layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
          <Button asChild size="sm">
            <Link href="/add-work">
              <PlusCircle className="mr-2 h-4 w-4" />
              Log Workout
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          View and manage your workout history.
        </p>
      </div>

      {/* Desktop header: original horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
          <p className="text-muted-foreground">
            View and manage your workout history.
          </p>
        </div>
        <Button asChild>
          <Link href="/add-work">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Workout
          </Link>
        </Button>
      </div>

      <WorkoutsTable workouts={workouts} />
    </div>
  );
}
