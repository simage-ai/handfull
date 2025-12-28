"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Expand, X } from "lucide-react";

// Macro colors matching the radial chart
const MACRO_CONFIG = {
  proteins: { bg: "bg-red-100", text: "text-red-700", label: "Proteins" },
  carbs: { bg: "bg-blue-100", text: "text-blue-700", label: "Carbs" },
  fats: { bg: "bg-amber-100", text: "text-amber-700", label: "Fats" },
  veggies: { bg: "bg-green-100", text: "text-green-700", label: "Veggies" },
  junk: { bg: "bg-purple-100", text: "text-purple-700", label: "Junk" },
} as const;

type MacroKey = keyof typeof MACRO_CONFIG;

function formatMealCategory(category: string | null): string {
  if (!category) return "Meal";
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  image: string | null;
  mealCategory: string | null;
  dateTime: string;
  notes: { id: string; text: string }[];
  user: User;
}

interface FeedMealDialogProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedMealDialog({
  meal,
  open,
  onOpenChange,
}: FeedMealDialogProps) {
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!meal) return null;

  const macros: { key: MacroKey; value: number }[] = [
    { key: "proteins", value: meal.proteinsUsed },
    { key: "carbs", value: meal.carbsUsed },
    { key: "fats", value: meal.fatsUsed },
    { key: "veggies", value: meal.veggiesUsed },
    { key: "junk", value: meal.junkUsed },
  ];

  const nonZeroMacros = macros.filter((m) => m.value > 0);

  const getInitials = () => {
    return `${meal.user.firstName?.[0] || ""}${meal.user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="space-y-3">
            {/* User info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={meal.user.image || undefined} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">
                  {meal.user.firstName} {meal.user.lastName}
                </p>
                <p className="text-sm font-normal text-muted-foreground">
                  {meal.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {meal.mealCategory && (
                <Badge variant="secondary">
                  {formatMealCategory(meal.mealCategory)}
                </Badge>
              )}
              <span className="text-base font-normal text-muted-foreground">
                {format(new Date(meal.dateTime), "h:mm a")}
              </span>
            </div>
            <div className="text-lg">
              {format(new Date(meal.dateTime), "EEEE, MMMM d, yyyy")}
            </div>
          </DialogTitle>
        </DialogHeader>

        {meal.image && (
          <div className="relative">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.image}
                alt={meal.mealCategory || "Meal"}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              onClick={() => setImageExpanded(true)}
              className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              aria-label="Expand image"
            >
              <Expand className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Full-screen image overlay */}
        {imageExpanded && meal.image && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setImageExpanded(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.image}
                alt={meal.mealCategory || "Meal"}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
              <button
                onClick={() => setImageExpanded(false)}
                className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-100"
                aria-label="Close expanded image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Macro Slots Used</h4>
            {nonZeroMacros.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {nonZeroMacros.map(({ key, value }) => (
                  <div
                    key={key}
                    className={`rounded-lg p-3 ${MACRO_CONFIG[key].bg}`}
                  >
                    <div
                      className={`text-2xl font-bold ${MACRO_CONFIG[key].text}`}
                    >
                      {value}
                    </div>
                    <div
                      className={`text-xs font-medium ${MACRO_CONFIG[key].text} opacity-80`}
                    >
                      {MACRO_CONFIG[key].label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No macros logged</p>
            )}
          </div>

          {meal.notes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <ul className="space-y-2">
                  {meal.notes.map((note) => (
                    <li
                      key={note.id}
                      className="text-sm text-muted-foreground rounded-md bg-muted p-3"
                    >
                      {note.text}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
