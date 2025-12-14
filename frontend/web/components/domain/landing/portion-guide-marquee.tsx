"use client";

import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { Beef, Droplets, Wheat, Salad, Cookie } from "lucide-react";

const portionGuides = [
  {
    name: "Protein",
    icon: Beef,
    portion: "1 Palm = 1 Portion",
    amount: "~6oz / 170g",
    examples: ["Chicken breast", "Lean ground beef", "Fish", "Turkey", "Pork"],
    alternatives: ["1.5 cups Greek yogurt", "6 egg whites"],
    colors: {
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
    },
  },
  {
    name: "Fats",
    icon: Droplets,
    portion: "1 Thumb = 1 Portion",
    amount: "~1-2 Tbsp",
    examples: ["Peanut butter", "Olive oil", "Butter", "Coffee creamer"],
    alternatives: ["½ avocado", "¼ cup nuts"],
    colors: {
      border: "border-yellow-200 dark:border-yellow-900",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-600 dark:text-yellow-400",
    },
  },
  {
    name: "Carbs",
    icon: Wheat,
    portion: "1 Fist = 1 Portion",
    amount: "~1 cup cooked",
    examples: ["Rice", "Pasta", "Quinoa", "Beans", "Oatmeal"],
    alternatives: ["1.5 cups potatoes", "3 slices bread"],
    colors: {
      border: "border-orange-200 dark:border-orange-900",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-600 dark:text-orange-400",
    },
  },
  {
    name: "Veggies",
    icon: Salad,
    portion: "1 Fist = 1 Portion",
    amount: "Green & leafy",
    examples: ["Spinach", "Broccoli", "Green beans", "Peppers", "Zucchini"],
    alternatives: ["Kale", "Asparagus"],
    colors: {
      border: "border-green-200 dark:border-green-900",
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
    },
  },
  {
    name: "Junk",
    icon: Cookie,
    portion: "1 Fist = 1 Portion",
    amount: "The fun stuff",
    examples: ["Chips", "Cookies", "Ice cream", "Pizza", "Fried foods"],
    alternatives: ["Track honestly!"],
    colors: {
      border: "border-purple-200 dark:border-purple-900",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
];

function PortionCard({
  guide,
}: {
  guide: (typeof portionGuides)[number];
}) {
  const Icon = guide.icon;

  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        guide.colors.border,
        "bg-card hover:bg-accent/50 transition-colors"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            guide.colors.bg
          )}
        >
          <Icon className={cn("h-5 w-5", guide.colors.text)} />
        </div>
        <div className="flex flex-col">
          <figcaption className={cn("text-lg font-medium", guide.colors.text)}>
            {guide.name}
          </figcaption>
          <p className="text-xs text-muted-foreground">{guide.portion}</p>
        </div>
      </div>
      <div className="mt-3 text-sm">
        <p className="font-medium mb-1">{guide.amount}:</p>
        <ul className="space-y-0.5 text-muted-foreground text-xs">
          {guide.examples.slice(0, 4).map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

// Use deterministic orderings to avoid hydration mismatch
// First row: original order, Second row: reversed for visual variety
const firstRowGuides = portionGuides;
const secondRowGuides = [...portionGuides].reverse();

export function PortionGuideMarquee() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRowGuides.map((guide) => (
          <PortionCard key={guide.name} guide={guide} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRowGuides.map((guide) => (
          <PortionCard key={guide.name} guide={guide} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
