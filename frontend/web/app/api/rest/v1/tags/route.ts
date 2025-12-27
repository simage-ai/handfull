import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { journalEntries: true },
      },
    },
  });

  // Transform to include usage count
  const transformedTags = tags.map((tag) => ({
    ...tag,
    usageCount: tag._count.journalEntries,
    _count: undefined,
  }));

  return NextResponse.json({ data: transformedTags });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateTagSchema.parse(body);

    // Check if tag with same name already exists for this user
    const existing = await prisma.tag.findFirst({
      where: {
        name: validated.name,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        color: validated.color,
      },
    });

    revalidatePath("/notes");

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
