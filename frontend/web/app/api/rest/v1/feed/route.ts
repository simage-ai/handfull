import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

// GET - Get combined feed of meals from all followed users
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const userIds = url.searchParams.get("userIds"); // comma-separated user IDs
  const timeRange = url.searchParams.get("timeRange"); // today, week, month, all

  // Get all users I'm following
  const following = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: {
      followingId: true,
      following: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  });

  const allFollowingIds = following.map((f) => f.followingId);
  const followedUsers = following.map((f) => f.following);

  if (allFollowingIds.length === 0) {
    return NextResponse.json({
      data: [],
      meta: {
        nextCursor: null,
        hasMore: false,
        totalFollowing: 0,
        followedUsers: [],
      },
    });
  }

  // Filter by specific users if provided
  let targetUserIds = allFollowingIds;
  if (userIds) {
    const requestedIds = userIds.split(",").filter(Boolean);
    // Only allow filtering to users we're actually following
    targetUserIds = requestedIds.filter((id) => allFollowingIds.includes(id));
    if (targetUserIds.length === 0) {
      targetUserIds = allFollowingIds;
    }
  }

  // Build date filter based on time range
  const now = new Date();
  let dateFilter: { gte?: Date; lt?: Date } | undefined;

  if (timeRange === "today") {
    dateFilter = { gte: startOfDay(now) };
  } else if (timeRange === "week") {
    dateFilter = { gte: startOfWeek(now, { weekStartsOn: 0 }) };
  } else if (timeRange === "month") {
    dateFilter = { gte: startOfMonth(now) };
  }

  // Build query for meals from followed users
  const whereClause: {
    userId: { in: string[] };
    dateTime?: { lt?: Date; gte?: Date };
  } = {
    userId: { in: targetUserIds },
  };

  // Apply date filters
  if (dateFilter || cursor) {
    whereClause.dateTime = {};
    if (dateFilter?.gte) {
      whereClause.dateTime.gte = dateFilter.gte;
    }
    if (cursor) {
      whereClause.dateTime.lt = new Date(cursor);
    }
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
      totalFollowing: allFollowingIds.length,
      followedUsers,
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
