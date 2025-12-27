import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateWaterPlanSchema = z.object({
  name: z.string().min(1).max(255),
  dailyTarget: z.number().min(0).default(64),
  unit: z.enum(["FLUID_OUNCES", "GLASSES", "CUPS", "LITERS", "MILLILITERS"]).default("FLUID_OUNCES"),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [waterPlans, user] = await Promise.all([
    prisma.waterPlan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeWaterPlanId: true },
    }),
  ]);

  return NextResponse.json({
    data: waterPlans,
    activeWaterPlanId: user?.activeWaterPlanId || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateWaterPlanSchema.parse(body);

    const waterPlan = await prisma.waterPlan.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        dailyTarget: validated.dailyTarget,
        unit: validated.unit,
      },
    });

    revalidatePath("/plans");
    revalidatePath("/water");
    revalidatePath("/dashboard");

    return NextResponse.json({ data: waterPlan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create water plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
