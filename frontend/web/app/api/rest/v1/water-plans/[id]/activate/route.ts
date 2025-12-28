import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the plan exists and belongs to the user
  const waterPlan = await prisma.waterPlan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!waterPlan) {
    return NextResponse.json({ error: "Water plan not found" }, { status: 404 });
  }

  // Set as active plan
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeWaterPlanId: id },
  });

  revalidatePath("/plans");
  revalidatePath("/water");
  revalidatePath("/dashboard");

  return NextResponse.json({ success: true });
}
