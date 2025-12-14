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

  // Verify plan belongs to user
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Set as active plan
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activePlanId: id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");

  return NextResponse.json({ success: true, activePlanId: id });
}
