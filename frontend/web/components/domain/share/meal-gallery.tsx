"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealDetailDialog } from "./meal-detail-dialog";
import { LazyImage } from "@/components/ui/lazy-image";
import { Loader2 } from "lucide-react";

// Macro colors matching the radial chart
const MACRO_COLORS = {
  proteins: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  carbs: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  fats: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  veggies: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  junk: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
} as const;

type MacroKey = keyof typeof MACRO_COLORS;

// Format meal category from "BREAKFAST" to "Breakfast"
function formatMealCategory(category: string | null): string {
  if (!category) return "Meal";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  image: string | null;
  imageUrl: string | null;
  mealCategory: string | null;
  dateTime: Date;
  notes: { id: string; text: string }[];
}

interface MealGalleryProps {
  userId: string;
  initialMeals: Meal[];
  initialHasMore: boolean;
  initialCursor: string | null;
  totalCount: number;
}

export function MealGallery({
  userId,
  initialMeals,
  initialHasMore,
  initialCursor,
  totalCount,
}: MealGalleryProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch more meals
  const fetchMoreMeals = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortOrder,
        ...(cursor && { cursor }),
      });

      const res = await fetch(`/api/rest/v1/share/${userId}/meals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch meals");

      const data = await res.json();
      setMeals((prev) => [...prev, ...data.data]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, cursor, hasMore, isLoading, sortOrder]);

  // Reset and refetch when sort order changes
  const handleSortChange = useCallback(
    async (newSort: "newest" | "oldest") => {
      if (newSort === sortOrder) return;

      setSortOrder(newSort);
      setMeals([]);
      setCursor(null);
      setHasMore(true);
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ sort: newSort });
        const res = await fetch(`/api/rest/v1/share/${userId}/meals?${params}`);
        if (!res.ok) throw new Error("Failed to fetch meals");

        const data = await res.json();
        setMeals(data.data);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error fetching meals:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, sortOrder]
  );

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchMoreMeals();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (currentRef && observerRef.current) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [fetchMoreMeals, hasMore, isLoading]);

  return (
    <>
      {/* Header bar with count and sort */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {totalCount} {totalCount === 1 ? "meal" : "meals"} logged
          </p>
          <Select
            value={sortOrder}
            onValueChange={(value) =>
              handleSortChange(value as "newest" | "oldest")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {meals.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-lg font-medium text-muted-foreground">
            No meals yet
          </p>
          <p className="text-sm text-muted-foreground">
            Meals will appear here once logged
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {meals.map((meal) => {
              const macros = (
                [
                  { key: "proteins" as const, value: meal.proteinsUsed, label: "P" },
                  { key: "carbs" as const, value: meal.carbsUsed, label: "C" },
                  { key: "fats" as const, value: meal.fatsUsed, label: "F" },
                  { key: "veggies" as const, value: meal.veggiesUsed, label: "V" },
                  { key: "junk" as const, value: meal.junkUsed, label: "J" },
                ] as { key: MacroKey; value: number; label: string }[]
              ).filter((m) => m.value > 0);

              return (
                <Card
                  key={meal.id}
                  className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => setSelectedMeal(meal)}
                >
                  {meal.imageUrl ? (
                    <LazyImage
                      src={meal.imageUrl}
                      alt={meal.mealCategory || "Meal"}
                      containerClassName="aspect-square bg-muted"
                      className="h-full w-full object-cover"
                      fallbackIcon={<span className="text-4xl opacity-50">🍽️</span>}
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-4xl opacity-50">🍽️</span>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {format(new Date(meal.dateTime), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meal.dateTime), "h:mm a")}
                        </p>
                      </div>
                      {meal.mealCategory && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {formatMealCategory(meal.mealCategory)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {macros.map(({ key, value, label }) => (
                        <span
                          key={key}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${MACRO_COLORS[key].bg} ${MACRO_COLORS[key].text} ${MACRO_COLORS[key].border}`}
                        >
                          {value}
                          {label}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load more trigger / loading indicator */}
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-8"
          >
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more meals...</span>
              </div>
            )}
            {!hasMore && meals.length > 0 && (
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached the end
              </p>
            )}
          </div>
        </>
      )}

      <MealDetailDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      />
    </>
  );
}
