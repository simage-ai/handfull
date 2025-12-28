import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get combined feed of meals from all followed users
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

  // Get all users I'm following
  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = following.map((f: { followingId: string }) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json({
      data: [],
      meta: {
        nextCursor: null,
        hasMore: false,
        totalFollowing: 0,
      },
    });
  }

  // Build query for meals from followed users
  const whereClause: {
    userId: { in: string[] };
    dateTime?: { lt: Date };
  } = {
    userId: { in: followingIds },
  };

  if (cursor) {
    whereClause.dateTime = { lt: new Date(cursor) };
  }

  const meals = await prisma.meal.findMany({
    where: whereClause,
    include: {
      notes: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
    orderBy: { dateTime: "desc" },
    take: limit + 1, // Get one extra to check if there are more
  });

  const hasMore = meals.length > limit;
  const feedMeals = hasMore ? meals.slice(0, limit) : meals;
  const nextCursor =
    hasMore && feedMeals.length > 0
      ? feedMeals[feedMeals.length - 1].dateTime.toISOString()
      : null;

  // Convert GCS paths to proxy URLs
  const mealsWithProxyUrls = feedMeals.map((meal: { image: string | null; [key: string]: unknown }) => ({
    ...meal,
    image: meal.image ? convertGcsToProxyUrl(meal.image) : null,
  }));

  return NextResponse.json({
    data: mealsWithProxyUrls,
    meta: {
      nextCursor,
      hasMore,
      totalFollowing: followingIds.length,
    },
  });
}

// Helper to convert GCS paths to proxy URLs
function convertGcsToProxyUrl(gcsPath: string): string {
  if (!gcsPath.startsWith("gs://")) {
    return gcsPath;
  }

  // Extract path after bucket name
  // gs://bucket-name/meals/userId/mealId/filename.jpg
  // → /api/rest/v1/images/meals/userId/mealId/filename.jpg
  const parts = gcsPath.replace("gs://", "").split("/");
  parts.shift(); // Remove bucket name
  return `/api/rest/v1/images/${parts.join("/")}`;
}
