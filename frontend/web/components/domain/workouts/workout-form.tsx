"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { ExerciseCategory } from "@prisma/client";

interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  unit: string;
  isCustom: boolean;
}

interface WorkoutPlanExercise {
  exerciseId: string;
  dailyTarget: number;
  exercise: Exercise;
}

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: WorkoutPlanExercise[];
}

interface WorkoutData {
  id: string;
  dateTime: string;
  notes: string | null;
  exercises: {
    exerciseId: string;
    completed: number;
    exercise: Exercise;
  }[];
}

interface WorkoutFormProps {
  workout?: WorkoutData;
  activeWorkoutPlan?: WorkoutPlan | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const workoutFormSchema = z.object({
  notes: z.string().max(1000).optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        completed: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one exercise is required"),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export function WorkoutForm({
  workout,
  activeWorkoutPlan,
  onSuccess,
  onCancel,
}: WorkoutFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);

  const isEditMode = !!workout;

  // Build default exercises from active plan or workout data
  const getDefaultExercises = () => {
    if (workout) {
      return workout.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        completed: e.completed,
      }));
    }
    if (activeWorkoutPlan) {
      return activeWorkoutPlan.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        completed: 0,
      }));
    }
    return [];
  };

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      notes: workout?.notes ?? "",
      exercises: getDefaultExercises(),
    },
  });

  const watchedExercises = form.watch("exercises");

  useEffect(() => {
    async function fetchExercises() {
      try {
        const res = await fetch("/api/rest/v1/exercises");
        const data = await res.json();
        setExercises(data.data);
      } catch {
        toast.error("Failed to load exercises");
      } finally {
        setIsLoadingExercises(false);
      }
    }
    fetchExercises();
  }, []);

  const incrementExercise = (exerciseId: string) => {
    const currentExercises = form.getValues("exercises");
    const index = currentExercises.findIndex(
      (e) => e.exerciseId === exerciseId
    );
    if (index !== -1) {
      const updated = [...currentExercises];
      updated[index] = { ...updated[index], completed: updated[index].completed + 1 };
      form.setValue("exercises", updated);
    }
  };

  const decrementExercise = (exerciseId: string) => {
    const currentExercises = form.getValues("exercises");
    const index = currentExercises.findIndex(
      (e) => e.exerciseId === exerciseId
    );
    if (index !== -1 && currentExercises[index].completed > 0) {
      const updated = [...currentExercises];
      updated[index] = { ...updated[index], completed: updated[index].completed - 1 };
      form.setValue("exercises", updated);
    }
  };

  const setExerciseValue = (exerciseId: string, value: number) => {
    const currentExercises = form.getValues("exercises");
    const index = currentExercises.findIndex(
      (e) => e.exerciseId === exerciseId
    );
    if (index !== -1) {
      const updated = [...currentExercises];
      updated[index] = { ...updated[index], completed: Math.max(0, value) };
      form.setValue("exercises", updated);
    }
  };

  async function onSubmit(data: WorkoutFormValues) {
    setIsSubmitting(true);

    try {
      // Filter out exercises with 0 completed
      const exercisesWithData = data.exercises.filter((e) => e.completed > 0);

      if (exercisesWithData.length === 0) {
        toast.error("Log at least one exercise");
        setIsSubmitting(false);
        return;
      }

      if (isEditMode) {
        const res = await fetch(`/api/rest/v1/workouts/${workout.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: data.notes || null,
            exercises: exercisesWithData,
          }),
        });

        if (!res.ok) throw new Error("Failed to update workout");

        toast.success("Workout updated!");
        onSuccess?.();
        router.refresh();
      } else {
        const res = await fetch("/api/rest/v1/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: data.notes || undefined,
            exercises: exercisesWithData,
          }),
        });

        if (!res.ok) throw new Error("Failed to create workout");

        toast.success("Workout logged!");
        router.push("/dashboard#workouts");
        router.refresh();
      }
    } catch {
      toast.error(
        isEditMode ? "Failed to update workout" : "Failed to log workout"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (isLoadingExercises) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!activeWorkoutPlan && !isEditMode) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          You need an active workout plan to log workouts.
        </p>
        <Button onClick={() => router.push("/plans")}>
          Create Workout Plan
        </Button>
      </div>
    );
  }

  // Get exercises from active plan for display
  const planExercises = activeWorkoutPlan?.exercises ?? [];
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  // Group exercises by category
  const exercisesByCategory = planExercises.reduce(
    (acc, pe) => {
      const exercise = exerciseMap.get(pe.exerciseId);
      if (exercise) {
        if (!acc[exercise.category]) {
          acc[exercise.category] = [];
        }
        acc[exercise.category].push({
          ...pe,
          exercise,
        });
      }
      return acc;
    },
    {} as Record<ExerciseCategory, WorkoutPlanExercise[]>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Exercise Inputs by Category */}
        {(Object.entries(exercisesByCategory) as [ExerciseCategory, WorkoutPlanExercise[]][]).map(
          ([category, categoryExercises]) => {
            const config = EXERCISE_CATEGORIES[category];
            return (
              <div key={category} className="space-y-3">
                <h3
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide",
                    config.colors.text
                  )}
                >
                  {config.label}
                </h3>
                <div className="grid gap-3">
                  {categoryExercises.map((pe) => {
                    const exerciseValue =
                      watchedExercises.find((e) => e.exerciseId === pe.exerciseId)
                        ?.completed ?? 0;

                    return (
                      <div
                        key={pe.exerciseId}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3",
                          config.colors.border
                        )}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{pe.exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {pe.dailyTarget} {pe.exercise.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decrementExercise(pe.exerciseId)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <FormField
                            control={form.control}
                            name="exercises"
                            render={() => (
                              <FormItem className="w-16">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={exerciseValue || ""}
                                    onChange={(e) =>
                                      setExerciseValue(
                                        pe.exerciseId,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 text-center"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => incrementExercise(pe.exerciseId)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground w-12">
                            {pe.exercise.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}

        <FormField
          control={form.control}
          name="exercises"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How did the workout feel? Any PRs?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Log Workout"}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
