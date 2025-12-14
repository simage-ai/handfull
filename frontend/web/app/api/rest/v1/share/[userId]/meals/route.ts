import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

/**
 * Convert a GCS path (gs://bucket/path) to a proxy API URL
 */
function gcsPathToProxyUrl(gcsPath: string): string | null {
  if (!gcsPath.startsWith("gs://")) return null;

  const withoutProtocol = gcsPath.replace("gs://", "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return null;

  const filePath = withoutProtocol.substring(slashIndex + 1);
  return `/api/rest/v1/images/${filePath}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);

  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10),
    50
  );
  const sortOrder = searchParams.get("sort") === "oldest" ? "asc" : "desc";

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch meals with cursor-based pagination
  const meals = await prisma.meal.findMany({
    where: { userId },
    orderBy: { dateTime: sortOrder },
    take: limit + 1, // Take one extra to determine if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor item itself
    }),
    include: { notes: true },
  });

  const hasMore = meals.length > limit;
  const items = hasMore ? meals.slice(0, -1) : meals;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  // Convert GCS paths to proxy URLs
  const mealsWithImageUrls = items.map((meal) => ({
    ...meal,
    imageUrl: meal.image ? gcsPathToProxyUrl(meal.image) : null,
  }));

  return NextResponse.json({
    data: mealsWithImageUrls,
    nextCursor,
    hasMore,
  });
}
