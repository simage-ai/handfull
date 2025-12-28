import type { WaterUnit } from "@prisma/client";

// Conversion rates to fluid ounces (base unit)
export const WATER_UNIT_TO_FL_OZ: Record<WaterUnit, number> = {
  FLUID_OUNCES: 1,
  GLASSES: 8, // 1 glass = 8 fl oz
  CUPS: 8, // 1 cup = 8 fl oz
  LITERS: 33.814, // 1 liter = ~33.814 fl oz
  MILLILITERS: 0.033814, // 1 ml = ~0.034 fl oz
};

// Display labels for each unit
export const WATER_UNIT_LABELS: Record<WaterUnit, string> = {
  FLUID_OUNCES: "Fluid Ounces",
  GLASSES: "Glasses (8 oz)",
  CUPS: "Cups",
  LITERS: "Liters",
  MILLILITERS: "Milliliters",
};

// Short labels for compact display
export const WATER_UNIT_SHORT: Record<WaterUnit, string> = {
  FLUID_OUNCES: "fl oz",
  GLASSES: "glasses",
  CUPS: "cups",
  LITERS: "L",
  MILLILITERS: "mL",
};

// Convert any water amount to fluid ounces
export function toFluidOunces(amount: number, unit: WaterUnit): number {
  return amount * WATER_UNIT_TO_FL_OZ[unit];
}

// Convert fluid ounces to any unit
export function fromFluidOunces(flOz: number, targetUnit: WaterUnit): number {
  return flOz / WATER_UNIT_TO_FL_OZ[targetUnit];
}

// Convert between any two units
export function convertWater(
  amount: number,
  fromUnit: WaterUnit,
  toUnit: WaterUnit
): number {
  const flOz = toFluidOunces(amount, fromUnit);
  return fromFluidOunces(flOz, toUnit);
}

// Format water amount with unit for display
export function formatWaterAmount(amount: number, unit: WaterUnit): string {
  const roundedAmount = Math.round(amount * 10) / 10;
  return `${roundedAmount} ${WATER_UNIT_SHORT[unit]}`;
}

// Water unit configuration for UI
export const WATER_CONFIG = {
  bg: "bg-cyan-500",
  bgLight: "bg-cyan-100 dark:bg-cyan-900/30",
  text: "text-cyan-700 dark:text-cyan-400",
  chartColor: "#06b6d4",
  border: "border-cyan-200 dark:border-cyan-800",
} as const;
