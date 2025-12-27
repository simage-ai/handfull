import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateWaterSchema = z.object({
  amount: z.number().min(0).optional(),
  unit: z.enum(["FLUID_OUNCES", "GLASSES", "CUPS", "LITERS", "MILLILITERS"]).optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional().nullable(),
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

  const water = await prisma.water.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!water) {
    return NextResponse.json({ error: "Water entry not found" }, { status: 404 });
  }

  return NextResponse.json({ data: water });
}

export async function PUT(
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
    const validated = UpdateWaterSchema.parse(body);

    // Check water entry exists and belongs to user
    const existing = await prisma.water.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Water entry not found" }, { status: 404 });
    }

    const water = await prisma.water.update({
      where: { id },
      data: {
        ...validated,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : undefined,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/water");

    return NextResponse.json({ data: water });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update water entry error:", error);
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

  const water = await prisma.water.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!water) {
    return NextResponse.json({ error: "Water entry not found" }, { status: 404 });
  }

  await prisma.water.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/water");

  return NextResponse.json({ success: true });
}
