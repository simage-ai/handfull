"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FeedMealDialog } from "./feed-meal-dialog";
import { Loader2, Users, Settings, Calendar, Filter, X } from "lucide-react";
import Link from "next/link";

// Macro colors matching the radial chart
const MACRO_COLORS = {
  proteins: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
  carbs: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  fats: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  veggies: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  junk: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
} as const;

type MacroKey = keyof typeof MACRO_COLORS;

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

type TimeRange = (typeof TIME_RANGE_OPTIONS)[number]["value"];

function formatMealCategory(category: string | null): string {
  if (!category) return "Meal";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  image: string | null;
  mealCategory: string | null;
  dateTime: string;
  notes: { id: string; text: string }[];
  user: User;
}

export function FeedContent() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [totalFollowing, setTotalFollowing] = useState(0);
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Filters
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch meals with filters
  const fetchMeals = useCallback(
    async (reset = false, currentCursor?: string | null) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (!reset && currentCursor) {
          params.set("cursor", currentCursor);
        }
        if (filterUserId !== "all") {
          params.set("userIds", filterUserId);
        }
        if (timeRange !== "all") {
          params.set("timeRange", timeRange);
        }

        const res = await fetch(`/api/rest/v1/feed?${params}`);
        if (!res.ok) throw new Error("Failed to fetch feed");

        const data = await res.json();

        if (reset) {
          setMeals(data.data);
        } else {
          setMeals((prev) => [...prev, ...data.data]);
        }

        setCursor(data.meta.nextCursor);
        setHasMore(data.meta.hasMore);
        setTotalFollowing(data.meta.totalFollowing);
        if (data.meta.followedUsers) {
          setFollowedUsers(data.meta.followedUsers);
        }
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filterUserId, timeRange]
  );

  // Initial fetch and refetch when filters change
  useEffect(() => {
    setCursor(null);
    setMeals([]);
    fetchMeals(true, null);
  }, [filterUserId, timeRange, fetchMeals]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading && cursor) {
          fetchMeals(false, cursor);
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
  }, [fetchMeals, hasMore, isLoading, cursor]);

  const hasActiveFilters = filterUserId !== "all" || timeRange !== "all";

  const clearFilters = () => {
    setFilterUserId("all");
    setTimeRange("all");
  };

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  // Empty state - not following anyone
  if (!isLoading && totalFollowing === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground mb-2">
          No one to follow yet
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          Start following trainers, nutritionists, or friends to see their
          meals in your feed.
        </p>
        <Button asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </Link>
        </Button>
      </div>
    );
  }

  // Empty state - following but no meals
  if (!isLoading && meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-lg font-medium text-muted-foreground">
          No meals in your feed yet
        </p>
        <p className="text-sm text-muted-foreground">
          The people you follow haven&apos;t logged any meals
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header bar with count and filters */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Following {totalFollowing}{" "}
              {totalFollowing === 1 ? "person" : "people"}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* User filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filterUserId} onValueChange={setFilterUserId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  {followedUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        {user.firstName} {user.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time range filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading && meals.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !isLoading && meals.length === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Filter className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No meals match your filters
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Try adjusting your filters or selecting a different time range.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {meals.map((meal) => {
              const macros = (
                [
                  {
                    key: "proteins" as const,
                    value: meal.proteinsUsed,
                    label: "P",
                  },
                  { key: "carbs" as const, value: meal.carbsUsed, label: "C" },
                  { key: "fats" as const, value: meal.fatsUsed, label: "F" },
                  {
                    key: "veggies" as const,
                    value: meal.veggiesUsed,
                    label: "V",
                  },
                  { key: "junk" as const, value: meal.junkUsed, label: "J" },
                ] as { key: MacroKey; value: number; label: string }[]
              ).filter((m) => m.value > 0);

              return (
                <Card
                  key={meal.id}
                  className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => setSelectedMeal(meal)}
                >
                  {meal.image ? (
                    <div className="aspect-square overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meal.image}
                        alt={meal.mealCategory || "Meal"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-4xl opacity-50">🍽️</span>
                    </div>
                  )}
                  <CardContent className="p-4">
                    {/* User info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={meal.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(meal.user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {meal.user.firstName} {meal.user.lastName}
                      </span>
                    </div>

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

      <FeedMealDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      />
    </>
  );
}
