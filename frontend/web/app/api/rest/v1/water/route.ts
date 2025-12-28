import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { trackApiRequest } from "@/lib/usage-tracking";

const CreateWaterSchema = z.object({
  amount: z.coerce.number().min(0.1, "Amount must be greater than 0"),
  unit: z.enum(["FLUID_OUNCES", "GLASSES", "CUPS", "LITERS", "MILLILITERS"]).default("FLUID_OUNCES"),
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(500).nullable().optional(),
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

  const [waterEntries, total] = await Promise.all([
    prisma.water.findMany({
      where,
      orderBy: { dateTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.water.count({ where }),
  ]);

  // Track API usage (fire and forget)
  trackApiRequest(session.user.id);

  return NextResponse.json({
    data: waterEntries,
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
    const validated = CreateWaterSchema.parse(body);

    const water = await prisma.water.create({
      data: {
        userId: session.user.id,
        amount: validated.amount,
        unit: validated.unit,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : new Date(),
        notes: validated.notes,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/water");

    // Track API usage (fire and forget)
    trackApiRequest(session.user.id);

    return NextResponse.json({ data: water }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create water entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
