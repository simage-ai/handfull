import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MealsContent } from "@/components/domain/meals/meals-content";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

async function getMeals(userId: string) {
  return prisma.meal.findMany({
    where: { userId },
    orderBy: { dateTime: "desc" },
    include: { notes: true },
    take: 100,
  });
}

export default async function MealsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const meals = await getMeals(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meals</h2>
          <p className="text-muted-foreground">
            View and manage your meal history.
          </p>
        </div>
        <Button asChild>
          <Link href="/add-meal">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Meal
          </Link>
        </Button>
      </div>

      <MealsContent meals={meals} />
    </div>
  );
}
