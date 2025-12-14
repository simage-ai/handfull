import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ExerciseTargetSchema = z.object({
  exerciseId: z.string().uuid(),
  dailyTarget: z.number().int().min(0),
});

const UpdateWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  exercises: z.array(ExerciseTargetSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });

  if (!workoutPlan) {
    return NextResponse.json(
      { error: "Workout plan not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: workoutPlan });
}

async function updateWorkoutPlan(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = UpdateWorkoutPlanSchema.parse(body);

    // Check plan exists and belongs to user
    const existing = await prisma.workoutPlan.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workout plan not found" },
        { status: 404 }
      );
    }

    // Update plan name if provided
    if (validated.name) {
      await prisma.workoutPlan.update({
        where: { id },
        data: { name: validated.name },
      });
    }

    // Update exercises if provided
    if (validated.exercises) {
      // Delete existing exercises
      await prisma.workoutPlanExercise.deleteMany({
        where: { workoutPlanId: id },
      });

      // Create new exercises
      await prisma.workoutPlanExercise.createMany({
        data: validated.exercises.map((e) => ({
          workoutPlanId: id,
          exerciseId: e.exerciseId,
          dailyTarget: e.dailyTarget,
        })),
      });
    }

    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/plans");

    return NextResponse.json({ data: workoutPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update workout plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = updateWorkoutPlan;
export const PATCH = updateWorkoutPlan;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!workoutPlan) {
    return NextResponse.json(
      { error: "Workout plan not found" },
      { status: 404 }
    );
  }

  // If this is the active plan, clear it
  await prisma.user.updateMany({
    where: { activeWorkoutPlanId: id },
    data: { activeWorkoutPlanId: null },
  });

  await prisma.workoutPlan.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/plans");

  return NextResponse.json({ success: true });
}
