import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { DashboardContent } from "@/components/domain/dashboard/dashboard-content";
import { cookies } from "next/headers";

// Get start of day in user's timezone, converted to UTC for DB queries
function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedDate, timezone);
}

// Get end of day in user's timezone, converted to UTC for DB queries
function getEndOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, timezone);
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

// Day chart data - cumulative values throughout the day
interface DayChartData {
  time: string;
  timeValue: number;
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
  isMeal?: boolean;
}

// Period chart data - daily totals for week/month
interface PeriodChartData {
  date: string;
  dateShort: string;
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
}

async function getDashboardData(userId: string, timezone: string) {
  const now = new Date();
  const todayStart = getStartOfDayInTimezone(now, timezone);
  const todayEnd = getEndOfDayInTimezone(now, timezone);

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
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Get today's workouts
  const todayWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      dateTime: {
        gte: todayStart,
        lte: todayEnd,
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
    const sevenDaysAgo = subDays(now, 6);
    const sevenDaysAgoStart = getStartOfDayInTimezone(sevenDaysAgo, timezone);

    // Get all meals from the last 7 days
    const weeklyMeals = await prisma.meal.findMany({
      where: {
        userId,
        dateTime: {
          gte: sevenDaysAgoStart,
          lte: todayEnd,
        },
      },
    });

    // Group meals by day (in user's timezone)
    const mealsByDay = new Map<string, typeof weeklyMeals>();
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const zonedDate = toZonedTime(date, timezone);
      const dateKey = format(zonedDate, "yyyy-MM-dd");
      mealsByDay.set(dateKey, []);
    }

    for (const meal of weeklyMeals) {
      // Convert meal time to user's timezone before grouping
      const zonedMealTime = toZonedTime(meal.dateTime, timezone);
      const dateKey = format(zonedMealTime, "yyyy-MM-dd");
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
      const date = subDays(now, i);
      const zonedDate = toZonedTime(date, timezone);
      const dateKey = format(zonedDate, "yyyy-MM-dd");
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
        day: format(zonedDate, "EEEE"),
        dayShort: format(zonedDate, "EEE"),
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
    // Get first meal date in user's timezone
    const firstDateStart = getStartOfDayInTimezone(firstMeal.dateTime, timezone);

    // Get all meals from first entry to today
    const allMeals = await prisma.meal.findMany({
      where: {
        userId,
        dateTime: {
          gte: firstDateStart,
          lte: todayEnd,
        },
      },
    });

    // Build a map of dates from first meal to today
    const daysDiff = Math.round(
      (todayStart.getTime() - firstDateStart.getTime()) / (1000 * 60 * 60 * 24)
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

    // Initialize all dates with zero values (in user's timezone)
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(firstDateStart);
      date.setDate(date.getDate() + i);
      const zonedDate = toZonedTime(date, timezone);
      const dateKey = format(zonedDate, "yyyy-MM-dd");
      mealsByDate.set(dateKey, {
        proteins: 0,
        carbs: 0,
        fats: 0,
        veggies: 0,
        junk: 0,
      });
    }

    // Aggregate meals by date (in user's timezone)
    for (const meal of allMeals) {
      const zonedMealTime = toZonedTime(meal.dateTime, timezone);
      const dateKey = format(zonedMealTime, "yyyy-MM-dd");
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
    const zonedNow = toZonedTime(now, timezone);
    const todayKey = format(zonedNow, "yyyy-MM-dd");
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

  // Generate day chart data (cumulative throughout the day)
  const dayChartData: DayChartData[] = [];

  // Sort meals by time (ascending) for cumulative calculation
  const sortedTodayMeals = [...todayMeals].sort(
    (a, b) => a.dateTime.getTime() - b.dateTime.getTime()
  );

  // Start with zero at midnight
  dayChartData.push({
    time: "12am",
    timeValue: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    veggies: 0,
    junk: 0,
    isMeal: false,
  });

  // Add cumulative data points for each meal
  let cumulative = { proteins: 0, carbs: 0, fats: 0, veggies: 0, junk: 0 };
  for (const meal of sortedTodayMeals) {
    cumulative = {
      proteins: cumulative.proteins + meal.proteinsUsed,
      carbs: cumulative.carbs + meal.carbsUsed,
      fats: cumulative.fats + meal.fatsUsed,
      veggies: cumulative.veggies + meal.veggiesUsed,
      junk: cumulative.junk + meal.junkUsed,
    };

    const zonedMealTime = toZonedTime(meal.dateTime, timezone);
    const hours = zonedMealTime.getHours();
    const minutes = zonedMealTime.getMinutes();
    const timeValue = hours * 60 + minutes;

    dayChartData.push({
      time: format(zonedMealTime, "h:mm a"),
      timeValue,
      ...cumulative,
      isMeal: true,
    });
  }

  // Add current time if after last meal
  const zonedNow = toZonedTime(now, timezone);
  const nowTimeValue = zonedNow.getHours() * 60 + zonedNow.getMinutes();
  const lastDataPoint = dayChartData[dayChartData.length - 1];
  if (nowTimeValue > lastDataPoint.timeValue) {
    dayChartData.push({
      time: "Now",
      timeValue: nowTimeValue,
      ...cumulative,
      isMeal: false,
    });
  }

  // Generate week chart data (for the tabs - daily totals)
  const weekChartData: PeriodChartData[] = [];
  if (weeklyData) {
    for (let i = 0; i < weeklyData.data.length; i++) {
      const dayData = weeklyData.data[i];
      const date = subDays(now, 6 - i);
      const zonedDate = toZonedTime(date, timezone);
      weekChartData.push({
        date: format(zonedDate, "MMM d"),
        dateShort: i === weeklyData.data.length - 1 ? "Today" : format(zonedDate, "M/d"),
        proteins: dayData.proteins,
        carbs: dayData.carbs,
        fats: dayData.fats,
        veggies: dayData.veggies,
        junk: dayData.junk,
      });
    }
  }

  // Generate month chart data (last 30 days)
  const monthChartData: PeriodChartData[] = [];
  const thirtyDaysAgo = subDays(now, 29);
  const thirtyDaysAgoStart = getStartOfDayInTimezone(thirtyDaysAgo, timezone);

  // Get all meals from the last 30 days
  const monthlyMeals = await prisma.meal.findMany({
    where: {
      userId,
      dateTime: {
        gte: thirtyDaysAgoStart,
        lte: todayEnd,
      },
    },
  });

  // Group meals by day (in user's timezone)
  const monthMealsByDay = new Map<string, typeof monthlyMeals>();
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const zonedDate = toZonedTime(date, timezone);
    const dateKey = format(zonedDate, "yyyy-MM-dd");
    monthMealsByDay.set(dateKey, []);
  }

  for (const meal of monthlyMeals) {
    const zonedMealTime = toZonedTime(meal.dateTime, timezone);
    const dateKey = format(zonedMealTime, "yyyy-MM-dd");
    const existing = monthMealsByDay.get(dateKey) || [];
    existing.push(meal);
    monthMealsByDay.set(dateKey, existing);
  }

  // Build the monthly data array
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    const zonedDate = toZonedTime(date, timezone);
    const dateKey = format(zonedDate, "yyyy-MM-dd");
    const dayMeals = monthMealsByDay.get(dateKey) || [];

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

    monthChartData.push({
      date: format(zonedDate, "MMM d"),
      dateShort: i === 0 ? "Today" : format(zonedDate, "M/d"),
      ...dayTotals,
    });
  }

  return {
    user,
    usedSlots,
    todayMeals,
    todayWorkouts,
    weeklyData,
    historicalData,
    dayChartData,
    weekChartData,
    monthChartData,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Get user's timezone from cookie, default to UTC
  const cookieStore = await cookies();
  const timezone = cookieStore.get("timezone")?.value || "UTC";

  const {
    user,
    usedSlots,
    todayMeals,
    todayWorkouts,
    weeklyData,
    historicalData,
    dayChartData,
    weekChartData,
    monthChartData,
  } = await getDashboardData(session.user.id, timezone);

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
      dayChartData={dayChartData}
      weekChartData={weekChartData}
      monthChartData={monthChartData}
    />
  );
}
