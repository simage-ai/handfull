import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ExerciseCompletedSchema = z.object({
  exerciseId: z.string().uuid(),
  completed: z.number().int().min(0),
});

const UpdateWorkoutSchema = z.object({
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z.array(ExerciseCompletedSchema).optional(),
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

  const workout = await prisma.workout.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  return NextResponse.json({ data: workout });
}

async function updateWorkout(
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
    const validated = UpdateWorkoutSchema.parse(body);

    // Check workout exists and belongs to user
    const existing = await prisma.workout.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Update workout fields
    await prisma.workout.update({
      where: { id },
      data: {
        ...(validated.dateTime && { dateTime: new Date(validated.dateTime) }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
    });

    // Update exercises if provided
    if (validated.exercises) {
      // Delete existing exercises
      await prisma.workoutExercise.deleteMany({
        where: { workoutId: id },
      });

      // Create new exercises
      await prisma.workoutExercise.createMany({
        data: validated.exercises.map((e) => ({
          workoutId: id,
          exerciseId: e.exerciseId,
          completed: e.completed,
        })),
      });
    }

    const workout = await prisma.workout.findUnique({
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
    revalidatePath("/workouts");

    return NextResponse.json({ data: workout });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = updateWorkout;
export const PATCH = updateWorkout;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workout = await prisma.workout.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  await prisma.workout.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/workouts");

  return NextResponse.json({ success: true });
}
