import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Droplets } from "lucide-react";
import { WaterTable } from "@/components/domain/water/water-table";
import { WaterRadialChart } from "@/components/domain/water/water-radial-chart";
import { WaterChart } from "@/components/domain/water/water-chart";
import { toFluidOunces, WATER_UNIT_SHORT } from "@/lib/water";
import type { WaterUnit } from "@prisma/client";

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

async function getWaterData(userId: string, timezone: string) {
  const now = new Date();
  const todayStart = getStartOfDayInTimezone(now, timezone);
  const todayEnd = getEndOfDayInTimezone(now, timezone);

  // Get user with active water plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      activeWaterPlan: true,
    },
  });

  // Get today's water entries
  const todayWater = await prisma.water.findMany({
    where: {
      userId,
      dateTime: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Calculate today's total in fluid ounces
  const todayTotalFlOz = todayWater.reduce(
    (sum, entry) => sum + toFluidOunces(entry.amount, entry.unit),
    0
  );

  // Get all water entries for the table (last 30 days)
  const thirtyDaysAgo = subDays(now, 30);
  const thirtyDaysAgoStart = getStartOfDayInTimezone(thirtyDaysAgo, timezone);

  const allWaterEntries = await prisma.water.findMany({
    where: {
      userId,
      dateTime: {
        gte: thirtyDaysAgoStart,
        lte: todayEnd,
      },
    },
    orderBy: { dateTime: "desc" },
  });

  // Generate day chart data (individual entries throughout the day)
  const dayChartData = todayWater.map((entry) => {
    const zonedTime = toZonedTime(entry.dateTime, timezone);
    return {
      label: format(zonedTime, "h:mm a"),
      amount: toFluidOunces(entry.amount, entry.unit),
    };
  });

  // If no entries today, show placeholder
  if (dayChartData.length === 0) {
    dayChartData.push({ label: "No entries", amount: 0 });
  }

  // Generate week chart data (daily totals for last 7 days)
  const weekChartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(now, i);
    const dayStart = getStartOfDayInTimezone(date, timezone);
    const dayEnd = getEndOfDayInTimezone(date, timezone);
    const zonedDate = toZonedTime(date, timezone);

    const dayEntries = allWaterEntries.filter((entry) => {
      const entryTime = entry.dateTime.getTime();
      return entryTime >= dayStart.getTime() && entryTime <= dayEnd.getTime();
    });

    const dayTotal = dayEntries.reduce(
      (sum, entry) => sum + toFluidOunces(entry.amount, entry.unit),
      0
    );

    weekChartData.push({
      label: i === 0 ? "Today" : format(zonedDate, "EEE"),
      amount: Math.round(dayTotal * 10) / 10,
    });
  }

  return {
    user,
    waterPlan: user?.activeWaterPlan,
    todayTotalFlOz,
    todayWater,
    allWaterEntries,
    dayChartData,
    weekChartData,
  };
}

export default async function WaterPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Get user's timezone from cookie, default to UTC
  const cookieStore = await cookies();
  const timezone = cookieStore.get("timezone")?.value || "UTC";

  const {
    waterPlan,
    todayTotalFlOz,
    allWaterEntries,
    dayChartData,
    weekChartData,
  } = await getWaterData(session.user.id, timezone);

  const dailyTarget = waterPlan
    ? toFluidOunces(waterPlan.dailyTarget, waterPlan.unit)
    : 64; // Default to 64 fl oz if no plan

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Water Tracking</h2>
          <p className="text-muted-foreground">
            {waterPlan
              ? `Active Plan: ${waterPlan.name} (${waterPlan.dailyTarget} ${WATER_UNIT_SHORT[waterPlan.unit]}/day)`
              : "Track your daily hydration"}
          </p>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
          <Link href="/add-water">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Water
          </Link>
        </Button>
      </div>

      {/* Progress and Chart Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Progress */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-500" />
              Today&apos;s Progress
            </CardTitle>
            <CardDescription>
              {waterPlan
                ? `Goal: ${waterPlan.dailyTarget} ${WATER_UNIT_SHORT[waterPlan.unit]}`
                : "Set a water plan to track progress"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaterRadialChart consumed={todayTotalFlOz} target={dailyTarget} />
          </CardContent>
        </Card>

        {/* Water Chart */}
        <Card className="lg:col-span-2 overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle>Intake History</CardTitle>
            <CardDescription>Your water intake over time</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <WaterChart
              dayData={dayChartData}
              weekData={weekChartData}
              dailyTarget={dailyTarget}
            />
          </CardContent>
        </Card>
      </div>

      {/* Water Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Water Log</CardTitle>
          <CardDescription>
            Your water intake entries from the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WaterTable waterEntries={allWaterEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
