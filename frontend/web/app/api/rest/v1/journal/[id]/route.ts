import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateJournalEntrySchema = z.object({
  text: z.string().min(1).max(10000).optional(),
  dateTime: z.string().datetime().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
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

  const journalEntry = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!journalEntry) {
    return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
  }

  // Transform to flatten tags
  const transformedEntry = {
    ...journalEntry,
    tags: journalEntry.tags.map((t) => t.tag),
  };

  return NextResponse.json({ data: transformedEntry });
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
    const validated = UpdateJournalEntrySchema.parse(body);

    // Check entry exists and belongs to user
    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    // Verify all tag IDs belong to the user if provided
    if (validated.tagIds && validated.tagIds.length > 0) {
      const validTags = await prisma.tag.findMany({
        where: {
          id: { in: validated.tagIds },
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (validTags.length !== validated.tagIds.length) {
        return NextResponse.json(
          { error: "One or more tags not found" },
          { status: 400 }
        );
      }
    }

    // Update journal entry and tags in a transaction
    const journalEntry = await prisma.$transaction(async (tx) => {
      // Update the entry
      const updated = await tx.journalEntry.update({
        where: { id },
        data: {
          text: validated.text,
          dateTime: validated.dateTime ? new Date(validated.dateTime) : undefined,
        },
      });

      // If tagIds is provided, update the tags
      if (validated.tagIds !== undefined) {
        // Remove existing tags
        await tx.journalEntryTag.deleteMany({
          where: { journalEntryId: id },
        });

        // Add new tags
        if (validated.tagIds.length > 0) {
          await tx.journalEntryTag.createMany({
            data: validated.tagIds.map((tagId) => ({
              journalEntryId: id,
              tagId,
            })),
          });
        }
      }

      // Fetch with tags
      return tx.journalEntry.findUnique({
        where: { id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    // Transform to flatten tags
    const transformedEntry = {
      ...journalEntry,
      tags: journalEntry?.tags.map((t) => t.tag) || [],
    };

    revalidatePath("/dashboard");
    revalidatePath("/notes");

    return NextResponse.json({ data: transformedEntry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update journal entry error:", error);
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

  const journalEntry = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!journalEntry) {
    return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/notes");

  return NextResponse.json({ success: true });
}
