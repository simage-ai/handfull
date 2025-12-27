"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { MacroRadialChartV2 } from "@/components/domain/dashboard/macro-radial-chart-v2";
import { WorkoutRadialChart } from "@/components/domain/dashboard/workout-radial-chart";
import { WeeklyProgressWidget } from "@/components/domain/dashboard/weekly-progress-widget";
import { HistoricalProgressChart } from "@/components/domain/dashboard/historical-progress-chart";
import { ProgressChartTabs, type DayDataPoint, type PeriodDataPoint } from "@/components/domain/dashboard/progress-chart-tabs";
import { UsageCostWidget } from "@/components/domain/dashboard/usage-cost-widget";
import { DashboardModeToggle } from "@/components/domain/dashboard/dashboard-mode-toggle";
import { AddEntryButton } from "@/components/domain/dashboard/add-entry-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { ExerciseCategory } from "@prisma/client";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import { cn } from "@/lib/utils";

// Macro colors matching the radial chart
const MACRO_COLORS = {
  proteins: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  carbs: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  fats: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  veggies: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  junk: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
} as const;

type MacroKey = keyof typeof MACRO_COLORS;

interface MealPlan {
  name: string;
  proteinSlots: number;
  fatSlots: number;
  carbSlots: number;
  veggieSlots: number;
  junkSlots: number;
}

interface WorkoutPlanExercise {
  exerciseId: string;
  dailyTarget: number;
  exercise: {
    id: string;
    name: string;
    category: ExerciseCategory;
    unit: string;
  };
}

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: WorkoutPlanExercise[];
}

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  mealCategory: string | null;
  dateTime: Date;
}

interface WorkoutExercise {
  exerciseId: string;
  completed: number;
  exercise: {
    id: string;
    name: string;
    category: ExerciseCategory;
    unit: string;
  };
}

interface Workout {
  id: string;
  dateTime: Date;
  notes: string | null;
  exercises: WorkoutExercise[];
}

interface WeeklyData {
  data: {
    day: string;
    dayShort: string;
    proteins: number;
    carbs: number;
    fats: number;
    veggies: number;
    junk: number;
  }[];
  summary: {
    proteins: { used: number; total: number };
    carbs: { used: number; total: number };
    fats: { used: number; total: number };
    veggies: { used: number; total: number };
    junk: { used: number; total: number };
  };
  hasFullWeek: boolean;
}

interface HistoricalData {
  data: {
    date: string;
    dateShort: string;
    proteins: number;
    carbs: number;
    fats: number;
    veggies: number;
    junk: number;
  }[];
  firstMealDate: Date | null;
}

interface DashboardContentProps {
  userName: string;
  mealPlan: MealPlan | null;
  workoutPlan: WorkoutPlan | null;
  usedSlots: {
    proteins: number;
    fats: number;
    carbs: number;
    veggies: number;
    junk: number;
  };
  todayMeals: Meal[];
  todayWorkouts: Workout[];
  weeklyData: WeeklyData | null;
  historicalData: HistoricalData | null;
  dayChartData: DayDataPoint[];
  weekChartData: PeriodDataPoint[];
  monthChartData: PeriodDataPoint[];
}

function formatMealCategory(category: string | null): string {
  if (!category) return "Meal";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function DashboardContent({
  userName,
  mealPlan,
  workoutPlan,
  usedSlots,
  todayMeals,
  todayWorkouts,
  weeklyData,
  historicalData,
  dayChartData,
  weekChartData,
  monthChartData,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"meals" | "workouts">("meals");

  // Read initial mode from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "workouts" || hash === "meals") {
      setMode(hash);
    }
  }, []);

  // Update hash when mode changes
  const handleModeChange = (newMode: "meals" | "workouts") => {
    setMode(newMode);
    window.history.replaceState(null, "", `#${newMode}`);
  };

  // Calculate workout progress for today
  const workoutProgress: Record<ExerciseCategory, number> = {
    LOWER_BODY_GLUTES: 0,
    UPPER_BODY_CORE: 0,
    FULL_BODY_CARDIO: 0,
  };

  todayWorkouts.forEach((workout) => {
    workout.exercises.forEach((we) => {
      workoutProgress[we.exercise.category] += we.completed;
    });
  });

  // Calculate workout targets from active plan
  const workoutTargets: Record<ExerciseCategory, number> = {
    LOWER_BODY_GLUTES: 0,
    UPPER_BODY_CORE: 0,
    FULL_BODY_CARDIO: 0,
  };

  if (workoutPlan) {
    workoutPlan.exercises.forEach((pe) => {
      workoutTargets[pe.exercise.category] += pe.dailyTarget;
    });
  }

  const hasNoPlan = mode === "meals" ? !mealPlan : !workoutPlan;

  return (
    <div className="space-y-6">
      {/* Mobile header (stacked, uses Add Entry dialog pattern) */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Home</h2>
          <AddEntryButton buttonSize="sm" />
        </div>
        <p className="text-muted-foreground">Welcome back, {userName}!</p>
        <DashboardModeToggle mode={mode} onModeChange={handleModeChange} />
      </div>

      {/* Desktop header */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Home</h2>
          <p className="text-muted-foreground">Welcome back, {userName}!</p>
        </div>
        <div className="flex items-center gap-4">
          <DashboardModeToggle mode={mode} onModeChange={handleModeChange} />
          <AddEntryButton />
        </div>
      </div>

      {hasNoPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>
              No Active {mode === "meals" ? "Meal" : "Workout"} Plan
            </CardTitle>
            <CardDescription>
              Create and activate a {mode === "meals" ? "nutrition" : "workout"}{" "}
              plan to start tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/plans">
                Create {mode === "meals" ? "Meal" : "Workout"} Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : mode === "meals" ? (
        // === MEALS VIEW ===
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Progress</CardTitle>
              <CardDescription>Active Plan: {mealPlan!.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <MacroRadialChartV2
                usedSlots={usedSlots}
                totalSlots={{
                  proteins: mealPlan!.proteinSlots,
                  fats: mealPlan!.fatSlots,
                  carbs: mealPlan!.carbSlots,
                  veggies: mealPlan!.veggieSlots,
                  junk: mealPlan!.junkSlots,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Meals</CardTitle>
              <CardDescription>{todayMeals.length} meals logged</CardDescription>
            </CardHeader>
            <CardContent>
              {todayMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No meals logged yet today.
                </p>
              ) : (
                <ul className="space-y-3">
                  {todayMeals.slice(0, 5).map((meal) => {
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
                      <li key={meal.id}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1 min-w-0">
                            <span className="text-sm font-medium shrink-0">
                              {formatMealCategory(meal.mealCategory)}
                            </span>
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
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(meal.dateTime), "h:mm a")}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <UsageCostWidget />

          {weeklyData && (
            <Card>
              <CardHeader>
                <CardTitle>This Week</CardTitle>
                <CardDescription>
                  Progress towards your weekly macro goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyProgressWidget summary={weeklyData.summary} />
              </CardContent>
            </Card>
          )}

          <Card className={cn("min-w-0 overflow-hidden", weeklyData ? "lg:col-span-2" : "col-span-full")}>
            <CardHeader>
              <CardTitle>Progress Chart</CardTitle>
              <CardDescription>
                Track your macro intake over time
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden">
              <ProgressChartTabs
                dayData={dayChartData}
                weekData={weekChartData}
                monthData={monthChartData}
                planTargets={mealPlan ? {
                  proteins: mealPlan.proteinSlots,
                  carbs: mealPlan.carbSlots,
                  fats: mealPlan.fatSlots,
                  veggies: mealPlan.veggieSlots,
                  junk: mealPlan.junkSlots,
                } : undefined}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        // === WORKOUTS VIEW ===
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Progress</CardTitle>
              <CardDescription>
                Active Plan: {workoutPlan!.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutRadialChart
                completed={workoutProgress}
                targets={workoutTargets}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Workouts</CardTitle>
              <CardDescription>
                {todayWorkouts.length} workout
                {todayWorkouts.length !== 1 ? "s" : ""} logged
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayWorkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No workouts logged yet today.
                </p>
              ) : (
                <ul className="space-y-3">
                  {todayWorkouts.slice(0, 5).map((workout) => (
                    <li key={workout.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1 min-w-0">
                          <span className="text-sm font-medium shrink-0">
                            Workout
                          </span>
                          {workout.exercises.slice(0, 3).map((we) => {
                            const config =
                              EXERCISE_CATEGORIES[we.exercise.category];
                            return (
                              <span
                                key={we.exerciseId}
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                                  config.colors.bg,
                                  config.colors.text,
                                  config.colors.border
                                )}
                              >
                                {we.completed}
                              </span>
                            );
                          })}
                          {workout.exercises.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{workout.exercises.length - 3} more
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(workout.dateTime), "h:mm a")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <UsageCostWidget />

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Workout Stats</CardTitle>
              <CardDescription>
                Summary of your workout activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  Object.entries(workoutTargets) as [ExerciseCategory, number][]
                ).map(([category, target]) => {
                  const completed = workoutProgress[category];
                  const config = EXERCISE_CATEGORIES[category];
                  const percentage = target > 0 ? (completed / target) * 100 : 0;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn("text-sm font-medium", config.colors.text)}
                        >
                          {config.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {completed}/{target}
                        </span>
                      </div>
                      <div className={cn("h-2 rounded-full", config.colors.bg)}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: config.colors.chartColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
