"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Dumbbell, PlusCircle, Droplets, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddEntryButtonProps {
  className?: string;
  buttonClassName?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
}

export function AddEntryButton({
  className,
  buttonClassName,
  buttonSize = "default",
}: AddEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleAddOption = (type: "meal" | "workout" | "water" | "note") => {
    setOpen(false);
    const routes: Record<typeof type, string> = {
      meal: "/add-meal",
      workout: "/add-work",
      water: "/add-water",
      note: "/notes",
    };
    router.push(routes[type]);
  };

  return (
    <div className={className}>
      <Button
        type="button"
        size={buttonSize}
        className={cn("w-full sm:w-auto", buttonClassName)}
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Entry
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What would you like to log?</DialogTitle>
            <DialogDescription>
              Choose what you&apos;d like to track
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("meal")}
            >
              <UtensilsCrossed className="h-8 w-8" />
              <span>Log Meal</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("workout")}
            >
              <Dumbbell className="h-8 w-8" />
              <span>Log Workout</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("water")}
            >
              <Droplets className="h-8 w-8 text-cyan-500" />
              <span>Log Water</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("note")}
            >
              <StickyNote className="h-8 w-8 text-amber-500" />
              <span>Add Note</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


