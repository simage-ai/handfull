import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { deleteMealImage } from "@/lib/gcs";

const NoteSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
});

const UpdateMealSchema = z.object({
  proteinsUsed: z.number().min(0).optional(),
  fatsUsed: z.number().min(0).optional(),
  carbsUsed: z.number().min(0).optional(),
  veggiesUsed: z.number().min(0).optional(),
  junkUsed: z.number().min(0).optional(),
  image: z.string().optional().nullable(),
  mealCategory: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"])
    .optional()
    .nullable(),
  dateTime: z.string().datetime().optional(),
  notes: z.array(NoteSchema).optional(),
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

  const meal = await prisma.meal.findFirst({
    where: { id, userId: session.user.id },
    include: { notes: true },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  return NextResponse.json({ data: meal });
}

export async function PUT(
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
    const validated = UpdateMealSchema.parse(body);

    // Check meal exists and belongs to user
    const existing = await prisma.meal.findFirst({
      where: { id, userId: session.user.id },
      include: { notes: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    // Handle notes separately from meal data
    const { notes: notesData, ...mealData } = validated;

    // Update meal
    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...mealData,
        dateTime: mealData.dateTime ? new Date(mealData.dateTime) : undefined,
      },
      include: { notes: true },
    });

    // Handle notes if provided
    if (notesData !== undefined) {
      const existingNoteIds = existing.notes.map((n) => n.id);
      const incomingNoteIds = notesData.filter((n) => n.id).map((n) => n.id as string);

      // Delete notes that are no longer present
      const notesToDelete = existingNoteIds.filter((id) => !incomingNoteIds.includes(id));
      if (notesToDelete.length > 0) {
        await prisma.note.deleteMany({
          where: { id: { in: notesToDelete } },
        });
      }

      // Update existing notes and create new ones
      for (const note of notesData) {
        if (note.id) {
          // Update existing
          await prisma.note.update({
            where: { id: note.id },
            data: { text: note.text },
          });
        } else {
          // Create new
          await prisma.note.create({
            data: { text: note.text, mealId: id },
          });
        }
      }
    }

    // Refetch meal with updated notes
    const updatedMeal = await prisma.meal.findUnique({
      where: { id },
      include: { notes: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/meals");

    return NextResponse.json({ data: updatedMeal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const meal = await prisma.meal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  // Delete image from GCS if exists
  if (meal.image) {
    await deleteMealImage(meal.image);
  }

  await prisma.meal.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/meals");

  return NextResponse.json({ success: true });
}
