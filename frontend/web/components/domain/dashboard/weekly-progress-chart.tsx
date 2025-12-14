"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Macro colors matching the radial chart
const chartConfig = {
  proteins: {
    label: "Proteins",
    color: "hsl(0, 84%, 60%)", // red-500
  },
  carbs: {
    label: "Carbs",
    color: "hsl(217, 91%, 60%)", // blue-500
  },
  fats: {
    label: "Fats",
    color: "hsl(43, 96%, 56%)", // amber-500
  },
  veggies: {
    label: "Veggies",
    color: "hsl(142, 71%, 45%)", // green-500
  },
  junk: {
    label: "Junk",
    color: "hsl(271, 91%, 65%)", // purple-500
  },
} satisfies ChartConfig;

interface WeeklyDataPoint {
  day: string;
  dayShort: string;
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
}

interface WeeklySummary {
  proteins: { used: number; total: number };
  carbs: { used: number; total: number };
  fats: { used: number; total: number };
  veggies: { used: number; total: number };
  junk: { used: number; total: number };
}

interface WeeklyProgressChartProps {
  data: WeeklyDataPoint[];
  summary: WeeklySummary;
}

export function WeeklyProgressChart({
  data,
  summary,
}: WeeklyProgressChartProps) {
  // Calculate max value for Y axis
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.proteins, d.carbs, d.fats, d.veggies, d.junk])
  );
  const yAxisMax = Math.ceil(maxValue * 1.1); // 10% padding

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillProteins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-proteins)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-proteins)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillCarbs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-carbs)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-carbs)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillFats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-fats)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-fats)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillVeggies" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-veggies)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-veggies)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillJunk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-junk)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-junk)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="dayShort"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, yAxisMax]}
            width={30}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelKey="day" />}
            labelFormatter={(_, payload) => {
              if (payload && payload.length > 0) {
                return payload[0]?.payload?.day || "";
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
            fill="url(#fillProteins)"
            dot={{ fill: "var(--color-proteins)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            dataKey="carbs"
            type="monotone"
            stroke="var(--color-carbs)"
            strokeWidth={2}
            fill="url(#fillCarbs)"
            dot={{ fill: "var(--color-carbs)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            dataKey="fats"
            type="monotone"
            stroke="var(--color-fats)"
            strokeWidth={2}
            fill="url(#fillFats)"
            dot={{ fill: "var(--color-fats)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            dataKey="veggies"
            type="monotone"
            stroke="var(--color-veggies)"
            strokeWidth={2}
            fill="url(#fillVeggies)"
            dot={{ fill: "var(--color-veggies)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            dataKey="junk"
            type="monotone"
            stroke="var(--color-junk)"
            strokeWidth={2}
            fill="url(#fillJunk)"
            dot={{ fill: "var(--color-junk)", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ChartContainer>

      {/* Weekly Summary */}
      <div className="grid grid-cols-5 gap-2 pt-2 border-t">
        {(
          Object.entries(summary) as [keyof WeeklySummary, { used: number; total: number }][]
        ).map(([key, { used, total }]) => {
          const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
          const config = chartConfig[key];

          return (
            <div key={key} className="text-center">
              <div
                className="text-xs font-medium"
                style={{ color: config.color }}
              >
                {config.label}
              </div>
              <div className="text-lg font-bold">
                {used}/{total}
              </div>
              <div className="text-xs text-muted-foreground">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
