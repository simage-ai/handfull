import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ExerciseCompletedSchema = z.object({
  exerciseId: z.string().uuid(),
  completed: z.number().int().min(0),
});

const CreateWorkoutSchema = z.object({
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  exercises: z.array(ExerciseCompletedSchema).min(1),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = searchParams.get("limit");

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      ...(startDate && endDate
        ? {
            dateTime: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { dateTime: "desc" },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json({ data: workouts });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateWorkoutSchema.parse(body);

    const workout = await prisma.workout.create({
      data: {
        dateTime: validated.dateTime
          ? new Date(validated.dateTime)
          : new Date(),
        notes: validated.notes,
        userId: session.user.id,
        exercises: {
          create: validated.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            completed: e.completed,
          })),
        },
      },
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

    return NextResponse.json({ data: workout }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create workout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
