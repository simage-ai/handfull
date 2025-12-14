import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { MealGallery } from "@/components/domain/share/meal-gallery";
import { SharingDisabled } from "@/components/domain/share/sharing-disabled";
import { Metadata } from "next";

const PAGE_SIZE = 12;

interface SharePageProps {
  params: Promise<{ userId: string }>;
}

/**
 * Convert a GCS path (gs://bucket/path) to a proxy API URL
 */
function gcsPathToProxyUrl(gcsPath: string): string | null {
  if (!gcsPath.startsWith("gs://")) return null;

  // Extract the path after gs://bucket-name/
  const withoutProtocol = gcsPath.replace("gs://", "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return null;

  const filePath = withoutProtocol.substring(slashIndex + 1);
  return `/api/rest/v1/images/${filePath}`;
}

async function getUserMeals(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      sharingEnabled: true,
    },
  });

  if (!user) return null;

  // Get total count
  const totalCount = await prisma.meal.count({
    where: { userId },
  });

  // Get first page of meals
  const meals = await prisma.meal.findMany({
    where: { userId },
    orderBy: { dateTime: "desc" },
    include: { notes: true },
    take: PAGE_SIZE + 1, // Take one extra to determine if there are more
  });

  const hasMore = meals.length > PAGE_SIZE;
  const items = hasMore ? meals.slice(0, -1) : meals;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  // Convert GCS paths to proxy URLs
  const mealsWithImageUrls = items.map((meal) => ({
    ...meal,
    imageUrl: meal.image ? gcsPathToProxyUrl(meal.image) : null,
  }));

  return {
    ...user,
    meals: mealsWithImageUrls,
    hasMore,
    nextCursor,
    totalCount,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { userId } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  // Check if user exists and get their sharing settings
  const user = await getUserMeals(userId);

  if (!user) {
    notFound();
  }

  // Check access: either the user is viewing their own profile OR sharing is enabled
  const isOwnProfile = currentUserId === userId;
  const canAccess = isOwnProfile || user.sharingEnabled;

  if (!canAccess) {
    return <SharingDisabled />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {user.firstName} {user.lastName}&apos;s Meal Log
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isOwnProfile
              ? "Preview of your shared meal history"
              : "Viewing shared meal history"}
          </p>
          {isOwnProfile && !user.sharingEnabled && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Note: Sharing is currently disabled. Only you can see this page.
            </p>
          )}
        </div>

        <MealGallery
          userId={user.id}
          initialMeals={user.meals}
          initialHasMore={user.hasMore}
          initialCursor={user.nextCursor}
          totalCount={user.totalCount}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  if (!user) {
    return { title: "Not Found" };
  }

  return {
    title: `${user.firstName}'s Meal Log | HandFull`,
    description: `View ${user.firstName} ${user.lastName}'s meal tracking history`,
  };
}
