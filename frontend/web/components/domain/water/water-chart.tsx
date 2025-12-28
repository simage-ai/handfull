"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WaterChartData {
  label: string;
  amount: number;
  target?: number;
}

interface WaterChartProps {
  dayData: WaterChartData[];
  weekData: WaterChartData[];
  dailyTarget?: number;
}

const chartConfig = {
  amount: {
    label: "Water (fl oz)",
    color: "#06b6d4",
  },
} satisfies ChartConfig;

export function WaterChart({ dayData, weekData, dailyTarget }: WaterChartProps) {
  const [period, setPeriod] = useState<"day" | "week">("day");

  const data = period === "day" ? dayData : weekData;
  const maxValue = Math.max(...data.map((d) => d.amount), dailyTarget || 0);

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "day" | "week")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>
      </Tabs>

      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              domain={[0, maxValue * 1.1]}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} fl oz`, "Water"]}
                />
              }
            />
            {dailyTarget && period === "week" && (
              <ReferenceLine
                y={dailyTarget}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: `Target: ${dailyTarget} fl oz`,
                  position: "right",
                  className: "text-xs fill-amber-500",
                }}
              />
            )}
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    dailyTarget && entry.amount >= dailyTarget
                      ? "#10b981" // Green when target met
                      : "#06b6d4" // Cyan default
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {dailyTarget && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-cyan-500" />
            <span className="text-muted-foreground">Below target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Target met</span>
          </div>
        </div>
      )}
    </div>
  );
}
