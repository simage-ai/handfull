"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealsTable } from "./meals-table";
import { MealDetailDialog } from "../share/meal-detail-dialog";
import { LazyImage } from "@/components/ui/lazy-image";
import { Table2, LayoutGrid, StickyNote, Loader2 } from "lucide-react";

const MACRO_COLORS = {
  proteins: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  carbs: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  fats: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  veggies: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  junk: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
} as const;

type MacroKey = keyof typeof MACRO_COLORS;

function formatMealCategory(category: string | null): string {
  if (!category) return "Meal";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

function gcsPathToProxyUrl(gcsPath: string | null): string | null {
  if (!gcsPath || !gcsPath.startsWith("gs://")) return null;
  const withoutProtocol = gcsPath.replace("gs://", "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return null;
  const filePath = withoutProtocol.substring(slashIndex + 1);
  return `/api/rest/v1/images/${filePath}`;
}

interface Note {
  id: string;
  text: string;
}

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  image: string | null;
  imageUrl?: string | null;
  mealCategory: string | null;
  dateTime: Date;
  notes: Note[];
}

interface MealWithImageUrl extends Meal {
  imageUrl: string | null;
}

interface MealsContentProps {
  meals: Meal[];
}

type ViewMode = "table" | "gallery";
type SortOrder = "newest" | "oldest";

const PAGE_SIZE = 12;

export function MealsContent({ meals: initialMeals }: MealsContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedMeal, setSelectedMeal] = useState<MealWithImageUrl | null>(null);

  // Gallery view state for infinite scroll
  const [galleryMeals, setGalleryMeals] = useState<Meal[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch more meals for gallery view
  const fetchMoreMeals = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortOrder,
        limit: String(PAGE_SIZE),
        ...(cursor && { cursor }),
      });

      const res = await fetch(`/api/rest/v1/meals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch meals");

      const data = await res.json();
      setGalleryMeals((prev) => [...prev, ...data.data]);
      setCursor(data.meta.nextCursor);
      setHasMore(data.meta.hasMore);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading, sortOrder]);

  // Handle sort change - reset and refetch
  const handleSortChange = useCallback(
    async (newSort: SortOrder) => {
      if (newSort === sortOrder) return;

      setSortOrder(newSort);
      setGalleryMeals([]);
      setCursor(null);
      setHasMore(true);
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          sort: newSort,
          limit: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/rest/v1/meals?${params}`);
        if (!res.ok) throw new Error("Failed to fetch meals");

        const data = await res.json();
        setGalleryMeals(data.data);
        setCursor(data.meta.nextCursor);
        setHasMore(data.meta.hasMore);
      } catch (error) {
        console.error("Error fetching meals:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [sortOrder]
  );

  // Initialize gallery when switching to gallery view
  useEffect(() => {
    if (viewMode === "gallery" && galleryMeals.length === 0 && !isLoading) {
      setIsLoading(true);
      const params = new URLSearchParams({
        sort: sortOrder,
        limit: String(PAGE_SIZE),
      });
      fetch(`/api/rest/v1/meals?${params}`)
        .then((res) => res.json())
        .then((data) => {
          setGalleryMeals(data.data);
          setCursor(data.meta.nextCursor);
          setHasMore(data.meta.hasMore);
        })
        .catch((error) => console.error("Error fetching meals:", error))
        .finally(() => setIsLoading(false));
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (viewMode !== "gallery") return;

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
  }, [fetchMoreMeals, hasMore, isLoading, viewMode]);

  const handleMealClick = (meal: Meal) => {
    const mealWithImageUrl: MealWithImageUrl = {
      ...meal,
      imageUrl: meal.imageUrl || gcsPathToProxyUrl(meal.image),
    };
    setSelectedMeal(mealWithImageUrl);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle and Sort Controls */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Gallery
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "gallery" && (
          <Select
            value={sortOrder}
            onValueChange={(v) => handleSortChange(v as SortOrder)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <MealsTable meals={initialMeals} onViewMeal={handleMealClick} />
      )}

      {/* Gallery View */}
      {viewMode === "gallery" && (
        <>
          {galleryMeals.length === 0 && !isLoading ? (
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
                {galleryMeals.map((meal) => {
                  const imageUrl = meal.imageUrl || gcsPathToProxyUrl(meal.image);
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
                      onClick={() => handleMealClick(meal)}
                    >
                      {imageUrl ? (
                        <LazyImage
                          src={imageUrl}
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
                          {meal.notes.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              <StickyNote className="h-3 w-3" />
                              {meal.notes.length}
                            </span>
                          )}
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
                {!hasMore && galleryMeals.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve reached the end
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      <MealDetailDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      />
    </div>
  );
}
