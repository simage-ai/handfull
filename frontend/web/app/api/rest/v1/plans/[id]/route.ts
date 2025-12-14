import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  proteinSlots: z.number().int().min(0).optional(),
  fatSlots: z.number().int().min(0).optional(),
  carbSlots: z.number().int().min(0).optional(),
  veggieSlots: z.number().int().min(0).optional(),
  junkSlots: z.number().int().min(0).optional(),
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

  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({ data: plan });
}

async function updatePlan(
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
    const validated = UpdatePlanSchema.parse(body);

    // Check plan exists and belongs to user
    const existing = await prisma.plan.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/dashboard");
    revalidatePath("/plans");

    return NextResponse.json({ data: plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PUT = updatePlan;
export const PATCH = updatePlan;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // If this is the active plan, clear it
  await prisma.user.updateMany({
    where: { activePlanId: id },
    data: { activePlanId: null },
  });

  await prisma.plan.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/plans");

  return NextResponse.json({ success: true });
}
