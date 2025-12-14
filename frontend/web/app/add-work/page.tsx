import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkoutForm } from "@/components/domain/workouts/workout-form";

async function getActiveWorkoutPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeWorkoutPlanId: true },
  });

  if (!user?.activeWorkoutPlanId) return null;

  return prisma.workoutPlan.findUnique({
    where: { id: user.activeWorkoutPlanId },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });
}

export default async function AddWorkPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const activeWorkoutPlan = await getActiveWorkoutPlan(session.user.id);

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Log Workout</h1>
          <p className="text-muted-foreground">
            {activeWorkoutPlan
              ? `Logging against: ${activeWorkoutPlan.name}`
              : "Create a workout plan first to start logging."}
          </p>
        </div>
        <WorkoutForm activeWorkoutPlan={activeWorkoutPlan} />
      </div>
    </div>
  );
}
