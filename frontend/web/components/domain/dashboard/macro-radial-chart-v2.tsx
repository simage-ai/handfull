"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";

interface MacroRadialChartV2Props {
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
  size?: number;
}

// Colors for each macro
const MACRO_COLORS = {
  proteins: "#ef4444", // red
  carbs: "#3b82f6", // blue
  fats: "#f59e0b", // amber
  veggies: "#22c55e", // green
  junk: "#a855f7", // purple
} as const;

// Lighter versions for background tracks (light mode)
const MACRO_COLORS_LIGHT = {
  proteins: "#fee2e2", // red-100
  carbs: "#dbeafe", // blue-100
  fats: "#fef3c7", // amber-100
  veggies: "#dcfce7", // green-100
  junk: "#f3e8ff", // purple-100
} as const;

// Darker versions for background tracks (dark mode)
const MACRO_COLORS_DARK = {
  proteins: "#450a0a", // red-950
  carbs: "#172554", // blue-950
  fats: "#451a03", // amber-950
  veggies: "#052e16", // green-950
  junk: "#3b0764", // purple-950
} as const;

type MacroKey = "proteins" | "carbs" | "fats" | "veggies" | "junk";

interface MacroData {
  key: MacroKey;
  name: string;
  used: number;
  total: number;
  percentage: number;
  color: string;
  bgColor: string;
  isOver: boolean;
}

export function MacroRadialChartV2({
  usedSlots,
  totalSlots,
  size = 280,
}: MacroRadialChartV2Props) {
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

  const bgColors = isDarkMode ? MACRO_COLORS_DARK : MACRO_COLORS_LIGHT;

  const macros: MacroData[] = [
    {
      key: "proteins",
      name: "Proteins",
      used: usedSlots.proteins,
      total: totalSlots.proteins,
      percentage:
        totalSlots.proteins > 0
          ? (usedSlots.proteins / totalSlots.proteins) * 100
          : usedSlots.proteins > 0 ? 200 : 0, // If total is 0 and used > 0, show as 200% (overflow)
      color: MACRO_COLORS.proteins,
      bgColor: bgColors.proteins,
      isOver: usedSlots.proteins > totalSlots.proteins,
    },
    {
      key: "carbs",
      name: "Carbs",
      used: usedSlots.carbs,
      total: totalSlots.carbs,
      percentage:
        totalSlots.carbs > 0
          ? (usedSlots.carbs / totalSlots.carbs) * 100
          : usedSlots.carbs > 0 ? 200 : 0,
      color: MACRO_COLORS.carbs,
      bgColor: bgColors.carbs,
      isOver: usedSlots.carbs > totalSlots.carbs,
    },
    {
      key: "fats",
      name: "Fats",
      used: usedSlots.fats,
      total: totalSlots.fats,
      percentage:
        totalSlots.fats > 0
          ? (usedSlots.fats / totalSlots.fats) * 100
          : usedSlots.fats > 0 ? 200 : 0,
      color: MACRO_COLORS.fats,
      bgColor: bgColors.fats,
      isOver: usedSlots.fats > totalSlots.fats,
    },
    {
      key: "veggies",
      name: "Veggies",
      used: usedSlots.veggies,
      total: totalSlots.veggies,
      percentage:
        totalSlots.veggies > 0
          ? (usedSlots.veggies / totalSlots.veggies) * 100
          : usedSlots.veggies > 0 ? 200 : 0,
      color: MACRO_COLORS.veggies,
      bgColor: bgColors.veggies,
      isOver: usedSlots.veggies > totalSlots.veggies,
    },
    {
      key: "junk",
      name: "Junk",
      used: usedSlots.junk,
      total: totalSlots.junk,
      percentage:
        totalSlots.junk > 0
          ? (usedSlots.junk / totalSlots.junk) * 100
          : usedSlots.junk > 0 ? 200 : 0,
      color: MACRO_COLORS.junk,
      bgColor: bgColors.junk,
      isOver: usedSlots.junk > totalSlots.junk,
    },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 10;
    const width = size;
    const height = size;
    const innerRadius = size * 0.15;
    const outerRadius = size / 2 - margin;
    const ringWidth = (outerRadius - innerRadius) / macros.length;
    const ringPadding = 2;

    const center = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create arc generator
    const createArc = (
      innerR: number,
      outerR: number,
      startAngle: number,
      endAngle: number
    ) => {
      return d3
        .arc()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius((outerR - innerR) / 2);
    };

    // Draw each ring
    macros.forEach((macro, index) => {
      const ringInnerRadius = innerRadius + index * ringWidth + ringPadding / 2;
      const ringOuterRadius =
        innerRadius + (index + 1) * ringWidth - ringPadding / 2;

      // Background arc (full circle representing 100%)
      const bgArc = createArc(
        ringInnerRadius,
        ringOuterRadius,
        0,
        2 * Math.PI
      );

      center
        .append("path")
        .attr("d", bgArc as unknown as string)
        .attr("fill", macro.bgColor);

      // Calculate the angle for progress
      // 100% = full circle (2 * PI)
      // Cap at 200% for display (can wrap around once)
      const cappedPercentage = Math.min(macro.percentage, 200);
      const progressAngle = (cappedPercentage / 100) * 2 * Math.PI;

      if (macro.percentage > 0) {
        if (macro.isOver) {
          // For overflow: animate one continuous ring from 0 through 100% and into overflow
          const totalAngle = progressAngle; // This is capped at 200% (4*PI max)
          const overflowPercentage = macro.percentage - 100;
          const overflowAngle = (overflowPercentage / 100) * 2 * Math.PI;

          // For the rounded end cap
          const endCapRadius = (ringOuterRadius - ringInnerRadius) / 2;
          const ringMidRadius = (ringInnerRadius + ringOuterRadius) / 2;

          // Use a less aggressive darkening so it's more subtle
          const darkerColor = d3.color(macro.color)?.darker(1.5)?.toString() || macro.color;

          // Base arc (animates from 0 to 100%)
          const baseArcGenerator = d3
            .arc()
            .innerRadius(ringInnerRadius)
            .outerRadius(ringOuterRadius)
            .startAngle(0)
            .cornerRadius((ringOuterRadius - ringInnerRadius) / 2);

          const basePath = center
            .append("path")
            .attr("fill", macro.color);

          // Create multiple small segments for the overflow to create gradient effect
          const numSegments = 20;
          const colorInterpolator = d3.interpolate(macro.color, darkerColor);

          // Create a group for overflow segments
          const overflowGroup = center.append("g");

          // Pre-create all segment paths
          const segments: d3.Selection<SVGPathElement, unknown, null, undefined>[] = [];
          for (let i = 0; i < numSegments; i++) {
            const segmentColor = colorInterpolator(i / (numSegments - 1));
            const segment = overflowGroup
              .append("path")
              .attr("fill", segmentColor)
              .attr("d", ""); // Start empty
            segments.push(segment);
          }

          // End cap circle for rounded end
          const endCap = center
            .append("circle")
            .attr("r", endCapRadius)
            .attr("fill", darkerColor)
            .attr("cx", 0)
            .attr("cy", -ringMidRadius)
            .attr("opacity", 0);

          // Animate everything continuously
          const duration = 1000;
          const fullCircle = 2 * Math.PI;

          basePath
            .transition()
            .duration(duration)
            .ease(d3.easeQuadOut)
            .attrTween("d", () => {
              const interpolate = d3.interpolate(0, totalAngle);
              return (t: number) => {
                const currentAngle = interpolate(t);
                const baseAngle = Math.min(currentAngle, fullCircle);
                return baseArcGenerator.endAngle(baseAngle)(null as unknown as d3.DefaultArcObject) as string;
              };
            });

          // Animate overflow segments
          const segmentAngle = overflowAngle / numSegments;

          // Use d3.timer for synchronized segment updates
          const startTime = Date.now();
          const timer = d3.timer(() => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(1, d3.easeQuadOut(elapsed / duration));
            const currentAngle = t * totalAngle;

            if (currentAngle > fullCircle) {
              const currentOverflow = currentAngle - fullCircle;

              // Update each segment
              segments.forEach((segment, i) => {
                const segStart = i * segmentAngle;
                const segEnd = (i + 1) * segmentAngle;

                if (currentOverflow > segStart) {
                  const visibleEnd = Math.min(currentOverflow, segEnd);
                  const arcGen = d3.arc()
                    .innerRadius(ringInnerRadius)
                    .outerRadius(ringOuterRadius)
                    .startAngle(segStart)
                    .endAngle(visibleEnd)
                    .cornerRadius(0);

                  segment.attr("d", arcGen(null as unknown as d3.DefaultArcObject) as string);
                }
              });

              // Update end cap position
              const endAngle = currentOverflow - Math.PI / 2;
              endCap
                .attr("opacity", 1)
                .attr("cx", ringMidRadius * Math.cos(endAngle))
                .attr("cy", ringMidRadius * Math.sin(endAngle));
            }

            if (elapsed >= duration) {
              timer.stop();
            }
          });
        } else {
          // Normal progress arc with animation
          const progressArcGenerator = d3
            .arc()
            .innerRadius(ringInnerRadius)
            .outerRadius(ringOuterRadius)
            .startAngle(0)
            .cornerRadius((ringOuterRadius - ringInnerRadius) / 2);

          const progressPath = center
            .append("path")
            .attr("fill", macro.color);

          // Animate from 0 to target angle
          progressPath
            .transition()
            .duration(1000)
            .ease(d3.easeQuadOut)
            .attrTween("d", () => {
              const interpolate = d3.interpolate(0, progressAngle);
              return (t: number) => {
                return progressArcGenerator.endAngle(interpolate(t))(null as unknown as d3.DefaultArcObject) as string;
              };
            });
        }
      }
    });
  }, [macros, size]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef} width={size} height={size} />

      {/* Legend with used/total */}
      <div className="grid grid-cols-5 gap-2 text-sm w-full max-w-[320px]">
        {macros.map((macro) => (
          <div key={macro.name} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-xs text-muted-foreground">{macro.name}</span>
            </div>
            <span
              className={cn(
                "font-semibold whitespace-nowrap",
                macro.isOver ? "text-destructive" : ""
              )}
            >
              {macro.used}/{macro.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
