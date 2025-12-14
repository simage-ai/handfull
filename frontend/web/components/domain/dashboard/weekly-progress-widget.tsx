"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Beef, Droplets, Wheat, Salad, Cookie } from "lucide-react";

interface WeeklySummary {
  proteins: { used: number; total: number };
  carbs: { used: number; total: number };
  fats: { used: number; total: number };
  veggies: { used: number; total: number };
  junk: { used: number; total: number };
}

interface WeeklyProgressWidgetProps {
  summary: WeeklySummary;
}

const MACRO_CONFIG = {
  proteins: {
    label: "Proteins",
    icon: Beef,
    color: "bg-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  carbs: {
    label: "Carbs",
    icon: Wheat,
    color: "bg-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  fats: {
    label: "Fats",
    icon: Droplets,
    color: "bg-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  veggies: {
    label: "Veggies",
    icon: Salad,
    color: "bg-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  junk: {
    label: "Junk",
    icon: Cookie,
    color: "bg-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
} as const;

export function WeeklyProgressWidget({ summary }: WeeklyProgressWidgetProps) {
  const macros = Object.entries(summary) as [
    keyof typeof MACRO_CONFIG,
    { used: number; total: number }
  ][];

  return (
    <div className="space-y-4">
      {macros.map(([key, { used, total }]) => {
        const config = MACRO_CONFIG[key];
        const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
        const isOver = used > total;
        const Icon = config.icon;

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", config.textColor)} />
                </div>
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-bold",
                    isOver ? "text-red-500" : config.textColor
                  )}
                >
                  {used}
                </span>
                <span className="text-sm text-muted-foreground">/ {total}</span>
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    isOver
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : percentage >= 80
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress
                value={Math.min(100, percentage)}
                className="h-2"
                style={
                  {
                    "--progress-background": isOver
                      ? "hsl(0, 84%, 60%)"
                      : `var(--${key}-color, hsl(217, 91%, 60%))`,
                  } as React.CSSProperties
                }
              />
              {isOver && (
                <div
                  className="absolute top-0 right-0 h-2 bg-red-300 dark:bg-red-700 rounded-r-full animate-pulse"
                  style={{ width: `${Math.min(20, ((used - total) / total) * 100)}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
