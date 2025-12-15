import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format, subDays, parseISO } from "date-fns";
import { DashboardContent } from "@/components/domain/dashboard/dashboard-content";

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

async function getDashboardData(userId: string) {
  const today = new Date();

  // Get user with active plan and active workout plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      activePlan: true,
      activeWorkoutPlan: {
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      },
    },
  });

  // Get today's meals
  const todayMeals = await prisma.meal.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Get today's workouts
  const todayWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Calculate used slots
  const usedSlots = todayMeals.reduce(
    (acc, meal) => ({
      proteins: acc.proteins + meal.proteinsUsed,
      fats: acc.fats + meal.fatsUsed,
      carbs: acc.carbs + meal.carbsUsed,
      veggies: acc.veggies + meal.veggiesUsed,
      junk: acc.junk + meal.junkUsed,
    }),
    { proteins: 0, fats: 0, carbs: 0, veggies: 0, junk: 0 }
  );

  // Get weekly data (last 7 days)
  let weeklyData: WeeklyData | null = null;

  if (user?.activePlan) {
    const plan = user.activePlan;
    const sevenDaysAgo = subDays(today, 6);

    // Get all meals from the last 7 days
    const weeklyMeals = await prisma.meal.findMany({
      where: {
        userId,
        dateTime: {
          gte: startOfDay(sevenDaysAgo),
          lte: endOfDay(today),
        },
      },
    });

    // Group meals by day
    const mealsByDay = new Map<string, typeof weeklyMeals>();
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      mealsByDay.set(dateKey, []);
    }

    for (const meal of weeklyMeals) {
      const dateKey = format(meal.dateTime, "yyyy-MM-dd");
      const existing = mealsByDay.get(dateKey) || [];
      existing.push(meal);
      mealsByDay.set(dateKey, existing);
    }

    // Check if we have meals for all 7 consecutive days
    const daysWithMeals = Array.from(mealsByDay.values()).filter(
      (meals) => meals.length > 0
    ).length;
    const hasFullWeek = daysWithMeals === 7;

    // Build the weekly data array
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      const dayMeals = mealsByDay.get(dateKey) || [];

      const dayTotals = dayMeals.reduce(
        (acc, meal) => ({
          proteins: acc.proteins + meal.proteinsUsed,
          carbs: acc.carbs + meal.carbsUsed,
          fats: acc.fats + meal.fatsUsed,
          veggies: acc.veggies + meal.veggiesUsed,
          junk: acc.junk + meal.junkUsed,
        }),
        { proteins: 0, carbs: 0, fats: 0, veggies: 0, junk: 0 }
      );

      data.push({
        day: format(date, "EEEE"),
        dayShort: format(date, "EEE"),
        ...dayTotals,
      });
    }

    // Calculate weekly totals
    const weeklyUsed = data.reduce(
      (acc, day) => ({
        proteins: acc.proteins + day.proteins,
        carbs: acc.carbs + day.carbs,
        fats: acc.fats + day.fats,
        veggies: acc.veggies + day.veggies,
        junk: acc.junk + day.junk,
      }),
      { proteins: 0, carbs: 0, fats: 0, veggies: 0, junk: 0 }
    );

    const weeklyTotal = {
      proteins: plan.proteinSlots * 7,
      carbs: plan.carbSlots * 7,
      fats: plan.fatSlots * 7,
      veggies: plan.veggieSlots * 7,
      junk: plan.junkSlots * 7,
    };

    weeklyData = {
      data,
      summary: {
        proteins: { used: weeklyUsed.proteins, total: weeklyTotal.proteins },
        carbs: { used: weeklyUsed.carbs, total: weeklyTotal.carbs },
        fats: { used: weeklyUsed.fats, total: weeklyTotal.fats },
        veggies: { used: weeklyUsed.veggies, total: weeklyTotal.veggies },
        junk: { used: weeklyUsed.junk, total: weeklyTotal.junk },
      },
      hasFullWeek,
    };
  }

  // Get historical data (from first meal to today)
  let historicalData: HistoricalData | null = null;

  // Find user's first meal
  const firstMeal = await prisma.meal.findFirst({
    where: { userId },
    orderBy: { dateTime: "asc" },
    select: { dateTime: true },
  });

  if (firstMeal) {
    const firstDate = startOfDay(firstMeal.dateTime);
    const todayEnd = endOfDay(today);

    // Get all meals from first entry to today
    const allMeals = await prisma.meal.findMany({
      where: {
        userId,
        dateTime: {
          gte: firstDate,
          lte: todayEnd,
        },
      },
    });

    // Build a map of dates from first meal to today
    // Use startOfDay for both to get accurate day count (avoids off-by-one from endOfDay)
    const todayStart = startOfDay(today);
    const daysDiff = Math.round(
      (todayStart.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const mealsByDate = new Map<
      string,
      {
        proteins: number;
        carbs: number;
        fats: number;
        veggies: number;
        junk: number;
      }
    >();

    // Initialize all dates with zero values
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(firstDate);
      date.setDate(date.getDate() + i);
      const dateKey = format(date, "yyyy-MM-dd");
      mealsByDate.set(dateKey, {
        proteins: 0,
        carbs: 0,
        fats: 0,
        veggies: 0,
        junk: 0,
      });
    }

    // Aggregate meals by date
    for (const meal of allMeals) {
      const dateKey = format(meal.dateTime, "yyyy-MM-dd");
      const existing = mealsByDate.get(dateKey) || {
        proteins: 0,
        carbs: 0,
        fats: 0,
        veggies: 0,
        junk: 0,
      };
      mealsByDate.set(dateKey, {
        proteins: existing.proteins + meal.proteinsUsed,
        carbs: existing.carbs + meal.carbsUsed,
        fats: existing.fats + meal.fatsUsed,
        veggies: existing.veggies + meal.veggiesUsed,
        junk: existing.junk + meal.junkUsed,
      });
    }

    // Convert to array sorted by date
    // Use parseISO to avoid timezone issues (new Date("2024-12-14") is UTC, parseISO is local)
    const todayKey = format(today, "yyyy-MM-dd");
    const data = Array.from(mealsByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, totals]) => ({
        date: format(parseISO(dateKey), "MMM d"),
        dateShort: dateKey === todayKey ? "Today" : format(parseISO(dateKey), "M/d"),
        ...totals,
      }));

    historicalData = {
      data,
      firstMealDate: firstMeal.dateTime,
    };
  }

  return {
    user,
    usedSlots,
    todayMeals,
    todayWorkouts,
    weeklyData,
    historicalData,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const {
    user,
    usedSlots,
    todayMeals,
    todayWorkouts,
    weeklyData,
    historicalData,
  } = await getDashboardData(session.user.id);

  const mealPlan = user?.activePlan
    ? {
        name: user.activePlan.name,
        proteinSlots: user.activePlan.proteinSlots,
        fatSlots: user.activePlan.fatSlots,
        carbSlots: user.activePlan.carbSlots,
        veggieSlots: user.activePlan.veggieSlots,
        junkSlots: user.activePlan.junkSlots,
      }
    : null;

  const workoutPlan = user?.activeWorkoutPlan
    ? {
        id: user.activeWorkoutPlan.id,
        name: user.activeWorkoutPlan.name,
        exercises: user.activeWorkoutPlan.exercises.map((pe) => ({
          exerciseId: pe.exerciseId,
          dailyTarget: pe.dailyTarget,
          exercise: {
            id: pe.exercise.id,
            name: pe.exercise.name,
            category: pe.exercise.category,
            unit: pe.exercise.unit,
          },
        })),
      }
    : null;

  return (
    <DashboardContent
      userName={session.user.firstName || session.user.name || ""}
      mealPlan={mealPlan}
      workoutPlan={workoutPlan}
      usedSlots={usedSlots}
      todayMeals={todayMeals}
      todayWorkouts={todayWorkouts.map((w) => ({
        id: w.id,
        dateTime: w.dateTime,
        notes: w.notes,
        exercises: w.exercises.map((we) => ({
          exerciseId: we.exerciseId,
          completed: we.completed,
          exercise: {
            id: we.exercise.id,
            name: we.exercise.name,
            category: we.exercise.category,
            unit: we.exercise.unit,
          },
        })),
      }))}
      weeklyData={weeklyData}
      historicalData={historicalData}
    />
  );
}
