"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Dumbbell } from "lucide-react";

type DashboardMode = "meals" | "workouts";

interface DashboardModeToggleProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
}

export function DashboardModeToggle({
  mode,
  onModeChange,
}: DashboardModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as DashboardMode)}
      className="w-full sm:w-auto"
    >
      <TabsList className="grid w-full sm:w-[200px] grid-cols-2">
        <TabsTrigger value="meals" className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Meals
        </TabsTrigger>
        <TabsTrigger value="workouts" className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Work
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
