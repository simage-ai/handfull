import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateWaterPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  dailyTarget: z.number().min(0).optional(),
  unit: z.enum(["FLUID_OUNCES", "GLASSES", "CUPS", "LITERS", "MILLILITERS"]).optional(),
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

  const waterPlan = await prisma.waterPlan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!waterPlan) {
    return NextResponse.json({ error: "Water plan not found" }, { status: 404 });
  }

  return NextResponse.json({ data: waterPlan });
}

export async function PATCH(
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
    const validated = UpdateWaterPlanSchema.parse(body);

    // Check plan exists and belongs to user
    const existing = await prisma.waterPlan.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Water plan not found" }, { status: 404 });
    }

    const waterPlan = await prisma.waterPlan.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/plans");
    revalidatePath("/water");
    revalidatePath("/dashboard");

    return NextResponse.json({ data: waterPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update water plan error:", error);
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

  const waterPlan = await prisma.waterPlan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!waterPlan) {
    return NextResponse.json({ error: "Water plan not found" }, { status: 404 });
  }

  // If this is the active plan, clear it from the user
  await prisma.user.updateMany({
    where: { id: session.user.id, activeWaterPlanId: id },
    data: { activeWaterPlanId: null },
  });

  await prisma.waterPlan.delete({ where: { id } });

  revalidatePath("/plans");
  revalidatePath("/water");
  revalidatePath("/dashboard");

  return NextResponse.json({ success: true });
}
