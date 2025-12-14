"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface MacroRadialChartProps {
  usedSlots: {
    proteins: number;
    fats: number;
    carbs: number;
    veggies: number;
    junk: number;
  };
  totalSlots: {
    proteins: number;
    fats: number;
    carbs: number;
    veggies: number;
    junk: number;
  };
}

// Explicit colors for each macro
const MACRO_COLORS = {
  proteins: "#ef4444", // red
  carbs: "#3b82f6", // blue
  fats: "#f59e0b", // amber
  veggies: "#22c55e", // green
  junk: "#a855f7", // purple
} as const;

// Lighter versions for background tracks
const MACRO_COLORS_LIGHT = {
  proteins: "#fee2e2", // red-100
  carbs: "#dbeafe", // blue-100
  fats: "#fef3c7", // amber-100
  veggies: "#dcfce7", // green-100
  junk: "#f3e8ff", // purple-100
} as const;

type MacroKey = "proteins" | "carbs" | "fats" | "veggies" | "junk";

interface ChartDataItem {
  name: string;
  key: MacroKey;
  value: number;
  used: number;
  total: number;
  fill: string;
  bgColor: string;
  isOver: boolean;
}

export function MacroRadialChart({
  usedSlots,
  totalSlots,
}: MacroRadialChartProps) {
  // Calculate percentages - allow values over 100% to show overflow
  // Cap at 200% so it doesn't wrap around more than once
  const getPercentage = (used: number, total: number) => {
    if (total <= 0) return 0;
    const pct = (used / total) * 100;
    return Math.min(pct, 200); // Cap at 200% to avoid full wrap
  };

  const chartData: ChartDataItem[] = [
    {
      name: "Proteins",
      key: "proteins",
      value: getPercentage(usedSlots.proteins, totalSlots.proteins),
      used: usedSlots.proteins,
      total: totalSlots.proteins,
      fill: MACRO_COLORS.proteins,
      bgColor: MACRO_COLORS_LIGHT.proteins,
      isOver: usedSlots.proteins > totalSlots.proteins,
    },
    {
      name: "Carbs",
      key: "carbs",
      value: getPercentage(usedSlots.carbs, totalSlots.carbs),
      used: usedSlots.carbs,
      total: totalSlots.carbs,
      fill: MACRO_COLORS.carbs,
      bgColor: MACRO_COLORS_LIGHT.carbs,
      isOver: usedSlots.carbs > totalSlots.carbs,
    },
    {
      name: "Fats",
      key: "fats",
      value: getPercentage(usedSlots.fats, totalSlots.fats),
      used: usedSlots.fats,
      total: totalSlots.fats,
      fill: MACRO_COLORS.fats,
      bgColor: MACRO_COLORS_LIGHT.fats,
      isOver: usedSlots.fats > totalSlots.fats,
    },
    {
      name: "Veggies",
      key: "veggies",
      value: getPercentage(usedSlots.veggies, totalSlots.veggies),
      used: usedSlots.veggies,
      total: totalSlots.veggies,
      fill: MACRO_COLORS.veggies,
      bgColor: MACRO_COLORS_LIGHT.veggies,
      isOver: usedSlots.veggies > totalSlots.veggies,
    },
    {
      name: "Junk",
      key: "junk",
      value: getPercentage(usedSlots.junk, totalSlots.junk),
      used: usedSlots.junk,
      total: totalSlots.junk,
      fill: MACRO_COLORS.junk,
      bgColor: MACRO_COLORS_LIGHT.junk,
      isOver: usedSlots.junk > totalSlots.junk,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[280px] w-[280px]">
        {/* Background chart (light colors at 100%) */}
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="100%"
              barSize={20}
              data={chartData.map((item) => ({ ...item, value: 100 }))}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={10}>
                {chartData.map((entry, index) => (
                  <Cell key={`bg-${index}`} fill={entry.bgColor} />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        {/* Foreground chart (actual progress) */}
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="100%"
              barSize={20}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 200]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar dataKey="value" cornerRadius={10}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RadialBar>
              <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataItem;
                  const remaining = Math.max(0, data.total - data.used);
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
                      <p className="font-medium" style={{ color: data.fill }}>
                        {data.name}
                      </p>
                      <p className="text-muted-foreground">
                        {data.isOver
                          ? `${data.used}/${data.total} (+${data.used - data.total} over!)`
                          : `${data.used}/${data.total} (${remaining} left)`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend with remaining amounts */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        {chartData.map((item) => {
          const remaining = Math.max(0, item.total - item.used);
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: MACRO_COLORS[item.key] }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
              <span
                className={cn("font-medium", item.isOver && "text-destructive")}
              >
                {item.isOver ? (
                  <span>+{item.used - item.total} over</span>
                ) : (
                  <span>{remaining} left</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
