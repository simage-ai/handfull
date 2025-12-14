import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreatePlanSchema = z.object({
  name: z.string().min(1).max(255),
  proteinSlots: z.number().int().min(0).default(0),
  fatSlots: z.number().int().min(0).default(0),
  carbSlots: z.number().int().min(0).default(0),
  veggieSlots: z.number().int().min(0).default(0),
  junkSlots: z.number().int().min(0).default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Get active plan ID
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activePlanId: true },
  });

  return NextResponse.json({
    data: plans,
    activePlanId: user?.activePlanId,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreatePlanSchema.parse(body);

    const plan = await prisma.plan.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    revalidatePath("/plans");

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
