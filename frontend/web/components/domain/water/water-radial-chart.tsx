"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface WaterRadialChartProps {
  consumed: number; // in fluid ounces
  target: number; // in fluid ounces
}

const chartConfig = {
  water: {
    label: "Water",
    color: "#06b6d4",
  },
} satisfies ChartConfig;

export function WaterRadialChart({ consumed, target }: WaterRadialChartProps) {
  const percentage = target > 0 ? (consumed / target) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const isOverTarget = percentage > 100;

  const chartData = [
    {
      name: "water",
      value: displayPercentage,
      fill: isOverTarget ? "#10b981" : "#06b6d4", // Green if over target
    },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={90 - displayPercentage * 3.6}
        innerRadius={80}
        outerRadius={110}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className={`fill-foreground text-4xl font-bold ${
                        isOverTarget ? "fill-emerald-500" : ""
                      }`}
                    >
                      {Math.round(percentage)}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground text-sm"
                    >
                      {Math.round(consumed)}/{target} fl oz
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
