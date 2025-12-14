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

  // Verify workout plan belongs to user
  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!workoutPlan) {
    return NextResponse.json(
      { error: "Workout plan not found" },
      { status: 404 }
    );
  }

  // Set as active workout plan
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeWorkoutPlanId: id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");

  return NextResponse.json({ success: true, activeWorkoutPlanId: id });
}
