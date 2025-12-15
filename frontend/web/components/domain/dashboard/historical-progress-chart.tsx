"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
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

interface HistoricalDataPoint {
  date: string;
  dateShort: string;
  proteins: number;
  carbs: number;
  fats: number;
  veggies: number;
  junk: number;
}

interface HistoricalProgressChartProps {
  data: HistoricalDataPoint[];
  firstMealDate: Date;
}

export function HistoricalProgressChart({
  data,
  firstMealDate,
}: HistoricalProgressChartProps) {
  const isMobile = useIsMobile();
  const chartConfig = isMobile ? chartConfigMobile : chartConfigDesktop;

  // Calculate max value for Y axis
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.proteins, d.carbs, d.fats, d.veggies, d.junk])
  );
  const yAxisMax = Math.ceil(maxValue * 1.1) || 10;

  // Determine tick interval based on data length
  const tickInterval = data.length > 30 ? Math.floor(data.length / 10) : data.length > 14 ? 2 : 1;

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      <div className="text-xs text-muted-foreground text-center">
        Tracking since {firstMealDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        {" "}&bull;{" "}
        {data.length} days
      </div>
      <ChartContainer config={chartConfig} className="h-[200px] sm:h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillProteinsHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-proteins)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-proteins)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCarbsHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-carbs)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-carbs)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillFatsHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-fats)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-fats)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillVeggiesHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-veggies)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-veggies)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillJunkHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-junk)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-junk)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="dateShort"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, yAxisMax]}
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
              fill="url(#fillProteinsHist)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="carbs"
              type="monotone"
              stroke="var(--color-carbs)"
              strokeWidth={2}
              fill="url(#fillCarbsHist)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="fats"
              type="monotone"
              stroke="var(--color-fats)"
              strokeWidth={2}
              fill="url(#fillFatsHist)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="veggies"
              type="monotone"
              stroke="var(--color-veggies)"
              strokeWidth={2}
              fill="url(#fillVeggiesHist)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="junk"
              type="monotone"
              stroke="var(--color-junk)"
              strokeWidth={2}
              fill="url(#fillJunkHist)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
