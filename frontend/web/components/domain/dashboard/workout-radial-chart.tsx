"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { ExerciseCategory } from "@prisma/client";

interface WorkoutRadialChartProps {
  completed: Record<ExerciseCategory, number>;
  targets: Record<ExerciseCategory, number>;
  size?: number;
}

type CategoryData = {
  key: ExerciseCategory;
  name: string;
  shortName: string;
  completed: number;
  target: number;
  percentage: number;
  color: string;
  bgColor: string;
  isOver: boolean;
};

// Light mode background colors
const CATEGORY_BG_COLORS_LIGHT: Record<ExerciseCategory, string> = {
  LOWER_BODY_GLUTES: "#fee2e2", // red-100
  UPPER_BODY_CORE: "#dbeafe", // blue-100
  FULL_BODY_CARDIO: "#dcfce7", // green-100
  STRETCHES: "#f3e8ff", // purple-100
};

// Dark mode background colors
const CATEGORY_BG_COLORS_DARK: Record<ExerciseCategory, string> = {
  LOWER_BODY_GLUTES: "#450a0a", // red-950
  UPPER_BODY_CORE: "#172554", // blue-950
  FULL_BODY_CARDIO: "#052e16", // green-950
  STRETCHES: "#3b0764", // purple-950
};

export function WorkoutRadialChart({
  completed,
  targets,
  size = 280,
}: WorkoutRadialChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const bgColors = isDarkMode ? CATEGORY_BG_COLORS_DARK : CATEGORY_BG_COLORS_LIGHT;

  const categories: CategoryData[] = [
    {
      key: "LOWER_BODY_GLUTES",
      name: EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.label,
      shortName: EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.shortLabel,
      completed: completed.LOWER_BODY_GLUTES,
      target: targets.LOWER_BODY_GLUTES,
      percentage:
        targets.LOWER_BODY_GLUTES > 0
          ? (completed.LOWER_BODY_GLUTES / targets.LOWER_BODY_GLUTES) * 100
          : 0,
      color: EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.colors.chartColor,
      bgColor: bgColors.LOWER_BODY_GLUTES,
      isOver: completed.LOWER_BODY_GLUTES > targets.LOWER_BODY_GLUTES,
    },
    {
      key: "UPPER_BODY_CORE",
      name: EXERCISE_CATEGORIES.UPPER_BODY_CORE.label,
      shortName: EXERCISE_CATEGORIES.UPPER_BODY_CORE.shortLabel,
      completed: completed.UPPER_BODY_CORE,
      target: targets.UPPER_BODY_CORE,
      percentage:
        targets.UPPER_BODY_CORE > 0
          ? (completed.UPPER_BODY_CORE / targets.UPPER_BODY_CORE) * 100
          : 0,
      color: EXERCISE_CATEGORIES.UPPER_BODY_CORE.colors.chartColor,
      bgColor: bgColors.UPPER_BODY_CORE,
      isOver: completed.UPPER_BODY_CORE > targets.UPPER_BODY_CORE,
    },
    {
      key: "FULL_BODY_CARDIO",
      name: EXERCISE_CATEGORIES.FULL_BODY_CARDIO.label,
      shortName: EXERCISE_CATEGORIES.FULL_BODY_CARDIO.shortLabel,
      completed: completed.FULL_BODY_CARDIO,
      target: targets.FULL_BODY_CARDIO,
      percentage:
        targets.FULL_BODY_CARDIO > 0
          ? (completed.FULL_BODY_CARDIO / targets.FULL_BODY_CARDIO) * 100
          : 0,
      color: EXERCISE_CATEGORIES.FULL_BODY_CARDIO.colors.chartColor,
      bgColor: bgColors.FULL_BODY_CARDIO,
      isOver: completed.FULL_BODY_CARDIO > targets.FULL_BODY_CARDIO,
    },
    {
      key: "STRETCHES",
      name: EXERCISE_CATEGORIES.STRETCHES.label,
      shortName: EXERCISE_CATEGORIES.STRETCHES.shortLabel,
      completed: completed.STRETCHES,
      target: targets.STRETCHES,
      percentage:
        targets.STRETCHES > 0
          ? (completed.STRETCHES / targets.STRETCHES) * 100
          : 0,
      color: EXERCISE_CATEGORIES.STRETCHES.colors.chartColor,
      bgColor: bgColors.STRETCHES,
      isOver: completed.STRETCHES > targets.STRETCHES,
    },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 10;
    const width = size;
    const height = size;
    const innerRadius = size * 0.2;
    const outerRadius = size / 2 - margin;
    const ringWidth = (outerRadius - innerRadius) / categories.length;
    const ringPadding = 4;

    const center = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw each ring (outer to inner: Lower, Upper, Cardio)
    categories.forEach((category, index) => {
      const ringInnerRadius =
        innerRadius + index * ringWidth + ringPadding / 2;
      const ringOuterRadius =
        innerRadius + (index + 1) * ringWidth - ringPadding / 2;

      // Background arc (full circle)
      const bgArc = d3
        .arc()
        .innerRadius(ringInnerRadius)
        .outerRadius(ringOuterRadius)
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .cornerRadius((ringOuterRadius - ringInnerRadius) / 2);

      center
        .append("path")
        .attr("d", bgArc(null as unknown as d3.DefaultArcObject) as string)
        .attr("fill", category.bgColor);

      // Progress arc
      const cappedPercentage = Math.min(category.percentage, 200);
      const progressAngle = (cappedPercentage / 100) * 2 * Math.PI;

      if (category.percentage > 0) {
        const progressArcGenerator = d3
          .arc()
          .innerRadius(ringInnerRadius)
          .outerRadius(ringOuterRadius)
          .startAngle(0)
          .cornerRadius((ringOuterRadius - ringInnerRadius) / 2);

        const progressPath = center.append("path").attr("fill", category.color);

        // Animate
        progressPath
          .transition()
          .duration(1000)
          .ease(d3.easeQuadOut)
          .attrTween("d", () => {
            const interpolate = d3.interpolate(0, progressAngle);
            return (t: number) => {
              return progressArcGenerator.endAngle(interpolate(t))(
                null as unknown as d3.DefaultArcObject
              ) as string;
            };
          });
      }
    });
  }, [categories, size]);

  // Check if there are any targets
  const hasTargets = Object.values(targets).some((t) => t > 0);

  if (!hasTargets) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex items-center justify-center rounded-full bg-muted"
          style={{ width: size, height: size }}
        >
          <p className="text-sm text-muted-foreground px-8">
            Create a workout plan to see your progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef} width={size} height={size} />

      {/* Legend */}
      <div className="grid grid-cols-4 gap-4 text-sm w-full max-w-[320px]">
        {categories.map((category) => (
          <div key={category.key} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-muted-foreground">{category.shortName}</span>
            </div>
            <span
              className={cn(
                "font-semibold whitespace-nowrap",
                category.isOver ? "text-destructive" : ""
              )}
            >
              {category.completed}/{category.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
