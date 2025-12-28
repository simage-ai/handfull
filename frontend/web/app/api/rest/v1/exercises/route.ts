import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PRE_DEFINED_EXERCISES } from "@/lib/exercises";
import { ExerciseCategory } from "@prisma/client";

const CreateExerciseSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.nativeEnum(ExerciseCategory),
  unit: z.string().min(1).max(50).default("reps"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get pre-defined exercises (userId is null)
  const preDefinedExercises = await prisma.exercise.findMany({
    where: { userId: null },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Get user's custom exercises
  const customExercises = await prisma.exercise.findMany({
    where: { userId: session.user.id, isCustom: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Sync missing pre-defined exercises
  const existingNames = new Set(preDefinedExercises.map((e) => e.name));
  const missingExercises = PRE_DEFINED_EXERCISES.filter(
    (e) => !existingNames.has(e.name)
  );

  if (missingExercises.length > 0) {
    const seededExercises = await prisma.$transaction(
      missingExercises.map((exercise) =>
        prisma.exercise.create({
          data: {
            name: exercise.name,
            category: exercise.category,
            unit: exercise.unit,
            isCustom: false,
            userId: null,
          },
        })
      )
    );

    return NextResponse.json({
      data: [...preDefinedExercises, ...seededExercises, ...customExercises],
    });
  }

  return NextResponse.json({
    data: [...preDefinedExercises, ...customExercises],
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateExerciseSchema.parse(body);

    // Check if exercise with same name already exists for this user
    const existing = await prisma.exercise.findFirst({
      where: {
        name: validated.name,
        OR: [{ userId: null }, { userId: session.user.id }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Exercise with this name already exists" },
        { status: 409 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        ...validated,
        isCustom: true,
        userId: session.user.id,
      },
    });

    revalidatePath("/plans");
    revalidatePath("/add-work");

    return NextResponse.json({ data: exercise }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create exercise error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
