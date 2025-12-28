import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { trackApiRequest } from "@/lib/usage-tracking";

const CreateJournalEntrySchema = z.object({
  text: z.string().min(1).max(10000),
  dateTime: z.string().datetime().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const skip = (page - 1) * limit;

  // Date filtering
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  // Tag filtering
  const tagId = url.searchParams.get("tagId");

  // Text search
  const search = url.searchParams.get("search");

  interface WhereClause {
    userId: string;
    dateTime?: { gte?: Date; lte?: Date };
    tags?: { some: { tagId: string } };
    text?: { contains: string; mode: "insensitive" };
  }

  const where: WhereClause = {
    userId: session.user.id,
  };

  if (startDate || endDate) {
    where.dateTime = {};
    if (startDate) where.dateTime.gte = new Date(startDate);
    if (endDate) where.dateTime.lte = new Date(endDate);
  }

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  if (search) {
    where.text = { contains: search, mode: "insensitive" };
  }

  const [journalEntries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { dateTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  // Transform to flatten tags
  const transformedEntries = journalEntries.map((entry) => ({
    ...entry,
    tags: entry.tags.map((t) => t.tag),
  }));

  // Track API usage (fire and forget)
  trackApiRequest(session.user.id);

  return NextResponse.json({
    data: transformedEntries,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateJournalEntrySchema.parse(body);

    // Verify all tag IDs belong to the user
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

    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        text: validated.text,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : new Date(),
        tags: validated.tagIds?.length
          ? {
              create: validated.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Transform to flatten tags
    const transformedEntry = {
      ...journalEntry,
      tags: journalEntry.tags.map((t) => t.tag),
    };

    revalidatePath("/dashboard");
    revalidatePath("/notes");

    // Track API usage (fire and forget)
    trackApiRequest(session.user.id);

    return NextResponse.json({ data: transformedEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create journal entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
