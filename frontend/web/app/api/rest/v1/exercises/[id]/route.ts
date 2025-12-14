import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ExerciseCategory } from "@prisma/client";

const UpdateExerciseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.nativeEnum(ExerciseCategory).optional(),
  unit: z.string().min(1).max(50).optional(),
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

  const exercise = await prisma.exercise.findFirst({
    where: {
      id,
      OR: [{ userId: null }, { userId: session.user.id }],
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  return NextResponse.json({ data: exercise });
}

async function updateExercise(
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
    const validated = UpdateExerciseSchema.parse(body);

    // Only allow editing custom exercises owned by user
    const existing = await prisma.exercise.findFirst({
      where: { id, userId: session.user.id, isCustom: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Exercise not found or cannot be edited" },
        { status: 404 }
      );
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/plans");
    revalidatePath("/add-work");

    return NextResponse.json({ data: exercise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update exercise error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = updateExercise;
export const PATCH = updateExercise;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting custom exercises owned by user
  const exercise = await prisma.exercise.findFirst({
    where: { id, userId: session.user.id, isCustom: true },
  });

  if (!exercise) {
    return NextResponse.json(
      { error: "Exercise not found or cannot be deleted" },
      { status: 404 }
    );
  }

  await prisma.exercise.delete({ where: { id } });

  revalidatePath("/plans");
  revalidatePath("/add-work");

  return NextResponse.json({ success: true });
}
