import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { trackApiRequest } from "@/lib/usage-tracking";

const CreateMealSchema = z.object({
  proteinsUsed: z.number().min(0).default(0),
  fatsUsed: z.number().min(0).default(0),
  carbsUsed: z.number().min(0).default(0),
  veggiesUsed: z.number().min(0).default(0),
  junkUsed: z.number().min(0).default(0),
  image: z.string().optional(),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const skip = (page - 1) * limit;

  // Date filtering
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const where: { userId: string; dateTime?: { gte?: Date; lte?: Date } } = {
    userId: session.user.id,
  };
  if (startDate || endDate) {
    where.dateTime = {};
    if (startDate) where.dateTime.gte = new Date(startDate);
    if (endDate) where.dateTime.lte = new Date(endDate);
  }

  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      where,
      include: { notes: true },
      orderBy: { dateTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.meal.count({ where }),
  ]);

  // Track API usage (fire and forget)
  trackApiRequest(session.user.id);

  return NextResponse.json({
    data: meals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateMealSchema.parse(body);

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        proteinsUsed: validated.proteinsUsed,
        fatsUsed: validated.fatsUsed,
        carbsUsed: validated.carbsUsed,
        veggiesUsed: validated.veggiesUsed,
        junkUsed: validated.junkUsed,
        image: validated.image,
        mealCategory: validated.mealCategory,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : new Date(),
        notes: validated.notes?.length
          ? {
              create: validated.notes.map((text) => ({ text })),
            }
          : undefined,
      },
      include: { notes: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/meals");

    // Track API usage (fire and forget)
    trackApiRequest(session.user.id);

    return NextResponse.json({ data: meal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
