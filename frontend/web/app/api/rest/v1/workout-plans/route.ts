import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ExerciseTargetSchema = z.object({
  exerciseId: z.string().uuid(),
  dailyTarget: z.number().int().min(0),
});

const CreateWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(255),
  exercises: z.array(ExerciseTargetSchema).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workoutPlans = await prisma.workoutPlan.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get active workout plan ID
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeWorkoutPlanId: true },
  });

  return NextResponse.json({
    data: workoutPlans,
    activeWorkoutPlanId: user?.activeWorkoutPlanId,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateWorkoutPlanSchema.parse(body);

    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        name: validated.name,
        userId: session.user.id,
        exercises: {
          create: validated.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            dailyTarget: e.dailyTarget,
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

    revalidatePath("/plans");

    return NextResponse.json({ data: workoutPlan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create workout plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
