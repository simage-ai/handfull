"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Scatter,
  ComposedChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const chartConfigDesktop = {
  proteins: {
    label: "Proteins",
    color: "hsl(0, 84%, 60%)",
  },
  carbs: {
    label: "Carbs",
    color: "hsl(217, 91%, 60%)",
  },
  fats: {
    label: "Fats",
    color: "hsl(43, 96%, 56%)",
  },
  veggies: {
    label: "Veggies",
    color: "hsl(142, 71%, 45%)",
  },
  junk: {
    label: "Junk",
    color: "hsl(271, 91%, 65%)",
  },
} satisfies ChartConfig;

const chartConfigMobile = {
  proteins: {
    label: "P",
    color: "hsl(0, 84%, 60%)",
  },
  carbs: {
    label: "C",
    color: "hsl(217, 91%, 60%)",
  },
  fats: {
    label: "F",
    color: "hsl(43, 96%, 56%)",
  },
  veggies: {
    label: "V",
    color: "hsl(142, 71%, 45%)",
  },
  junk: {
    label: "J",
    color: "hsl(271, 91%, 65%)",
  },
} satisfies ChartConfig;

// Data point for cumulative day view (each meal logged)
export interface DayDataPoint {
  time: string; // e.g., "8:30 AM"
  timeValue: number; // minutes since midnight for sorting
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
  isMeal?: boolean; // true for actual meal data points
}

// Data point for week/month view (daily totals)
export interface PeriodDataPoint {
  date: string; // e.g., "Dec 15"
  dateShort: string; // e.g., "12/15"
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
}

interface ProgressChartTabsProps {
  dayData: DayDataPoint[];
  weekData: PeriodDataPoint[];
  monthData: PeriodDataPoint[];
  planTargets?: {
    proteins: number;
    carbs: number;
    fats: number;
    veggies: number;
    junk: number;
  };
}

export function ProgressChartTabs({
  dayData,
  weekData,
  monthData,
  planTargets,
}: ProgressChartTabsProps) {
  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("day");
  const isMobile = useIsMobile();
  const chartConfig = isMobile ? chartConfigMobile : chartConfigDesktop;

  // Calculate max value for Y axis based on active tab
  const getMaxValue = (data: (DayDataPoint | PeriodDataPoint)[]) => {
    const maxData = Math.max(
      ...data.flatMap((d) => [d.proteins, d.carbs, d.fats, d.veggies, d.junk])
    );
    const maxTarget = planTargets
      ? Math.max(
          planTargets.proteins,
          planTargets.carbs,
          planTargets.fats,
          planTargets.veggies,
          planTargets.junk
        )
      : 0;
    return Math.ceil(Math.max(maxData, maxTarget) * 1.1) || 10;
  };

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "day" | "week" | "month")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4">
          <DayChart
            data={dayData}
            chartConfig={chartConfig}
            maxValue={getMaxValue(dayData)}
            planTargets={planTargets}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <PeriodChart
            data={weekData}
            chartConfig={chartConfig}
            maxValue={getMaxValue(weekData)}
          />
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          <PeriodChart
            data={monthData}
            chartConfig={chartConfig}
            maxValue={getMaxValue(monthData)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Day chart - cumulative with dots at meal times
function DayChart({
  data,
  chartConfig,
  maxValue,
  planTargets,
}: {
  data: DayDataPoint[];
  chartConfig: ChartConfig;
  maxValue: number;
  planTargets?: {
    proteins: number;
    carbs: number;
    fats: number;
    veggies: number;
    junk: number;
  };
}) {
  // Filter to only show meal points for dots
  const mealPoints = data.filter((d) => d.isMeal);

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[180px] sm:h-[250px] w-full min-w-0"
    >
      <ComposedChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillProteinsDay" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-proteins)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-proteins)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillCarbsDay" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-carbs)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-carbs)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillFatsDay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-fats)" stopOpacity={0.3} />
            <stop
              offset="95%"
              stopColor="var(--color-fats)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillVeggiesDay" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-veggies)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-veggies)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillJunkDay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-junk)" stopOpacity={0.3} />
            <stop
              offset="95%"
              stopColor="var(--color-junk)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, maxValue]}
          width={30}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />

        {/* Area charts for cumulative values */}
        <Area
          dataKey="proteins"
          type="stepAfter"
          stroke="var(--color-proteins)"
          strokeWidth={2}
          fill="url(#fillProteinsDay)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload?.isMeal) return <></>;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="var(--color-proteins)"
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        />
        <Area
          dataKey="carbs"
          type="stepAfter"
          stroke="var(--color-carbs)"
          strokeWidth={2}
          fill="url(#fillCarbsDay)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload?.isMeal) return <></>;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="var(--color-carbs)"
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        />
        <Area
          dataKey="fats"
          type="stepAfter"
          stroke="var(--color-fats)"
          strokeWidth={2}
          fill="url(#fillFatsDay)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload?.isMeal) return <></>;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="var(--color-fats)"
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        />
        <Area
          dataKey="veggies"
          type="stepAfter"
          stroke="var(--color-veggies)"
          strokeWidth={2}
          fill="url(#fillVeggiesDay)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload?.isMeal) return <></>;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="var(--color-veggies)"
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        />
        <Area
          dataKey="junk"
          type="stepAfter"
          stroke="var(--color-junk)"
          strokeWidth={2}
          fill="url(#fillJunkDay)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload?.isMeal) return <></>;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill="var(--color-junk)"
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

// Week/Month chart - daily totals without dots
function PeriodChart({
  data,
  chartConfig,
  maxValue,
}: {
  data: PeriodDataPoint[];
  chartConfig: ChartConfig;
  maxValue: number;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[180px] sm:h-[250px] w-full min-w-0"
    >
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillProteinsPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-proteins)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-proteins)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillCarbsPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-carbs)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-carbs)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillFatsPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-fats)" stopOpacity={0.3} />
            <stop
              offset="95%"
              stopColor="var(--color-fats)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillVeggiesPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-veggies)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-veggies)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillJunkPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-junk)" stopOpacity={0.3} />
            <stop
              offset="95%"
              stopColor="var(--color-junk)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="dateShort"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, maxValue]}
          width={30}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelKey="date" />}
          labelFormatter={(_, payload) => {
            if (payload && payload.length > 0) {
              return payload[0]?.payload?.date || "";
            }
            return "";
          }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="proteins"
          type="monotone"
          stroke="var(--color-proteins)"
          strokeWidth={2}
          fill="url(#fillProteinsPeriod)"
        />
        <Area
          dataKey="carbs"
          type="monotone"
          stroke="var(--color-carbs)"
          strokeWidth={2}
          fill="url(#fillCarbsPeriod)"
        />
        <Area
          dataKey="fats"
          type="monotone"
          stroke="var(--color-fats)"
          strokeWidth={2}
          fill="url(#fillFatsPeriod)"
        />
        <Area
          dataKey="veggies"
          type="monotone"
          stroke="var(--color-veggies)"
          strokeWidth={2}
          fill="url(#fillVeggiesPeriod)"
        />
        <Area
          dataKey="junk"
          type="monotone"
          stroke="var(--color-junk)"
          strokeWidth={2}
          fill="url(#fillJunkPeriod)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
