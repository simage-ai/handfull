import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { deleteMealImage } from "@/lib/gcs";

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
    });

    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...validated,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : undefined,
      },
      include: { notes: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/meals");

    return NextResponse.json({ data: meal });
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
