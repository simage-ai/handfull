import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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

  const tag = await prisma.tag.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: {
        select: { journalEntries: true },
      },
    },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const transformedTag = {
    ...tag,
    usageCount: tag._count.journalEntries,
    _count: undefined,
  };

  return NextResponse.json({ data: transformedTag });
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
    const validated = UpdateTagSchema.parse(body);

    // Check tag exists and belongs to user
    const existing = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({
        where: {
          name: validated.name,
          userId: session.user.id,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A tag with this name already exists" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validated,
    });

    revalidatePath("/notes");

    return NextResponse.json({ data: tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update tag error:", error);
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

  const tag = await prisma.tag.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  revalidatePath("/notes");

  return NextResponse.json({ success: true });
}
