import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateUserCost } from "@/lib/usage-tracking";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const costEstimate = await calculateUserCost(session.user.id);
    return NextResponse.json({ data: costEstimate });
  } catch (error) {
    console.error("Error calculating user cost:", error);
    return NextResponse.json(
      { error: "Failed to calculate usage" },
      { status: 500 }
    );
  }
}
