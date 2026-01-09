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
  image: z.string().nullable().optional(),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).nullable().optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.array(z.string()).optional(),
});

/**
 * Convert a GCS path (gs://bucket/path) to a proxy API URL
 */
function gcsPathToProxyUrl(gcsPath: string): string | null {
  if (!gcsPath.startsWith("gs://")) return null;

  const withoutProtocol = gcsPath.replace("gs://", "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return null;

  const filePath = withoutProtocol.substring(slashIndex + 1);
  return `/api/rest/v1/images/${filePath}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const sortOrder = url.searchParams.get("sort") === "oldest" ? "asc" : "desc";

  // Support both page-based and cursor-based pagination
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const skip = cursor ? undefined : (page - 1) * limit;

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

  // Cursor-based pagination
  if (cursor) {
    const meals = await prisma.meal.findMany({
      where,
      include: { notes: true },
      orderBy: { dateTime: sortOrder },
      take: limit + 1,
      cursor: { id: cursor },
      skip: 1,
    });

    const hasMore = meals.length > limit;
    const items = hasMore ? meals.slice(0, -1) : meals;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    const mealsWithImageUrls = items.map((meal) => ({
      ...meal,
      imageUrl: meal.image ? gcsPathToProxyUrl(meal.image) : null,
    }));

    const total = await prisma.meal.count({ where });

    trackApiRequest(session.user.id);

    return NextResponse.json({
      data: mealsWithImageUrls,
      meta: {
        total,
        hasMore,
        nextCursor,
      },
    });
  }

  // Page-based pagination (backward compatible)
  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      where,
      include: { notes: true },
      orderBy: { dateTime: sortOrder },
      skip,
      take: limit,
    }),
    prisma.meal.count({ where }),
  ]);

  const mealsWithImageUrls = meals.map((meal) => ({
    ...meal,
    imageUrl: meal.image ? gcsPathToProxyUrl(meal.image) : null,
  }));

  // Track API usage (fire and forget)
  trackApiRequest(session.user.id);

  return NextResponse.json({
    data: mealsWithImageUrls,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      nextCursor: meals.length > 0 ? meals[meals.length - 1]?.id : null,
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
        image: validated.image ?? undefined,
        mealCategory: validated.mealCategory ?? undefined,
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
