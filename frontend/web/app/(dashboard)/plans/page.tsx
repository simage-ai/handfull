"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  Dumbbell,
} from "lucide-react";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { ExerciseCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Macro colors matching the radial chart
const MACRO_CONFIG = {
  proteins: {
    bg: "bg-red-500",
    bgLight: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Proteins",
  },
  carbs: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Carbs",
  },
  fats: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    label: "Fats",
  },
  veggies: {
    bg: "bg-green-500",
    bgLight: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Veggies",
  },
  junk: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Junk",
  },
} as const;

// --- Meal Plan Types ---
const planFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  proteinSlots: z.coerce.number().int().min(0),
  fatSlots: z.coerce.number().int().min(0),
  carbSlots: z.coerce.number().int().min(0),
  veggieSlots: z.coerce.number().int().min(0),
  junkSlots: z.coerce.number().int().min(0),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface Plan {
  id: string;
  name: string;
  proteinSlots: number;
  fatSlots: number;
  carbSlots: number;
  veggieSlots: number;
  junkSlots: number;
}

// --- Workout Plan Types ---
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

const workoutPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      dailyTarget: z.coerce.number().int().min(0),
      selected: z.boolean(),
    })
  ),
});

type WorkoutPlanFormValues = z.infer<typeof workoutPlanFormSchema>;

// Custom Exercise Form
const customExerciseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(["LOWER_BODY_GLUTES", "UPPER_BODY_CORE", "FULL_BODY_CARDIO"]),
  unit: z.string().min(1, "Unit is required").max(50),
});

type CustomExerciseFormValues = z.infer<typeof customExerciseFormSchema>;

type PlanMode = "meals" | "workouts";

export default function PlansPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PlanMode>("meals");

  // Read initial mode from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "workouts" || hash === "work") {
      setMode("workouts");
    } else if (hash === "meals") {
      setMode("meals");
    }
  }, []);

  // Update hash when mode changes
  const handleModeChange = (newMode: PlanMode) => {
    setMode(newMode);
    window.history.replaceState(null, "", `#${newMode === "workouts" ? "work" : "meals"}`);
  };

  // --- Meal Plans State ---
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [animateBars, setAnimateBars] = useState(false);

  // --- Workout Plans State ---
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeWorkoutPlanId, setActiveWorkoutPlanId] = useState<string | null>(
    null
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [editingWorkoutPlan, setEditingWorkoutPlan] =
    useState<WorkoutPlan | null>(null);
  const [isWorkoutSubmitting, setIsWorkoutSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<ExerciseCategory, boolean>
  >({
    LOWER_BODY_GLUTES: true,
    UPPER_BODY_CORE: true,
    FULL_BODY_CARDIO: true,
  });
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] =
    useState(false);
  const [isCustomExerciseSubmitting, setIsCustomExerciseSubmitting] =
    useState(false);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      proteinSlots: 0,
      fatSlots: 0,
      carbSlots: 0,
      veggieSlots: 0,
      junkSlots: 0,
    },
  });

  const workoutForm = useForm<WorkoutPlanFormValues>({
    resolver: zodResolver(workoutPlanFormSchema),
    defaultValues: {
      name: "",
      exercises: [],
    },
  });

  const customExerciseForm = useForm<CustomExerciseFormValues>({
    resolver: zodResolver(customExerciseFormSchema),
    defaultValues: {
      name: "",
      category: "LOWER_BODY_GLUTES",
      unit: "reps",
    },
  });

  useEffect(() => {
    fetchPlans();
    fetchWorkoutPlans();
    fetchExercises();
  }, []);

  // Trigger bar animation after plans load
  useEffect(() => {
    if (!isLoading && (plans.length > 0 || workoutPlans.length > 0)) {
      const timer = setTimeout(() => setAnimateBars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, plans.length, workoutPlans.length]);

  // --- Meal Plan Functions ---
  async function fetchPlans() {
    try {
      const res = await fetch("/api/rest/v1/plans");
      const data = await res.json();
      setPlans(data.data);
      setActivePlanId(data.activePlanId);
    } catch {
      toast.error("Failed to load meal plans");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: PlanFormValues) {
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        const res = await fetch(`/api/rest/v1/plans/${editingPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update plan");
        toast.success("Plan updated successfully!");
      } else {
        const res = await fetch("/api/rest/v1/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create plan");
        toast.success("Plan created successfully!");
      }
      form.reset();
      setDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
      router.refresh();
    } catch {
      toast.error(
        editingPlan ? "Failed to update plan" : "Failed to create plan"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditDialog(plan: Plan) {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      proteinSlots: plan.proteinSlots,
      fatSlots: plan.fatSlots,
      carbSlots: plan.carbSlots,
      veggieSlots: plan.veggieSlots,
      junkSlots: plan.junkSlots,
    });
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingPlan(null);
    form.reset({
      name: "",
      proteinSlots: 0,
      fatSlots: 0,
      carbSlots: 0,
      veggieSlots: 0,
      junkSlots: 0,
    });
    setDialogOpen(true);
  }

  async function activatePlan(planId: string) {
    try {
      const res = await fetch(`/api/rest/v1/plans/${planId}/activate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to activate plan");
      toast.success("Meal plan activated!");
      setActivePlanId(planId);
      router.refresh();
    } catch {
      toast.error("Failed to activate plan");
    }
  }

  async function deletePlan(planId: string) {
    try {
      const res = await fetch(`/api/rest/v1/plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      toast.success("Plan deleted!");
      fetchPlans();
      router.refresh();
    } catch {
      toast.error("Failed to delete plan");
    }
  }

  // --- Workout Plan Functions ---
  async function fetchWorkoutPlans() {
    try {
      const res = await fetch("/api/rest/v1/workout-plans");
      const data = await res.json();
      setWorkoutPlans(data.data);
      setActiveWorkoutPlanId(data.activeWorkoutPlanId);
    } catch {
      toast.error("Failed to load workout plans");
    }
  }

  async function fetchExercises() {
    try {
      const res = await fetch("/api/rest/v1/exercises");
      const data = await res.json();
      setExercises(data.data);
    } catch {
      toast.error("Failed to load exercises");
    }
  }

  function openWorkoutCreateDialog() {
    setEditingWorkoutPlan(null);
    workoutForm.reset({
      name: "",
      exercises: exercises.map((e) => ({
        exerciseId: e.id,
        dailyTarget: 0,
        selected: false,
      })),
    });
    setWorkoutDialogOpen(true);
  }

  function openWorkoutEditDialog(plan: WorkoutPlan) {
    setEditingWorkoutPlan(plan);
    const exerciseMap = new Map(
      plan.exercises.map((e) => [e.exerciseId, e.dailyTarget])
    );
    workoutForm.reset({
      name: plan.name,
      exercises: exercises.map((e) => ({
        exerciseId: e.id,
        dailyTarget: exerciseMap.get(e.id) ?? 0,
        selected: exerciseMap.has(e.id),
      })),
    });
    setWorkoutDialogOpen(true);
  }

  async function onWorkoutSubmit(data: WorkoutPlanFormValues) {
    setIsWorkoutSubmitting(true);
    try {
      const selectedExercises = data.exercises
        .filter((e) => e.selected && e.dailyTarget > 0)
        .map((e) => ({
          exerciseId: e.exerciseId,
          dailyTarget: e.dailyTarget,
        }));

      if (selectedExercises.length === 0) {
        toast.error("Select at least one exercise with a target > 0");
        setIsWorkoutSubmitting(false);
        return;
      }

      const payload = {
        name: data.name,
        exercises: selectedExercises,
      };

      if (editingWorkoutPlan) {
        const res = await fetch(
          `/api/rest/v1/workout-plans/${editingWorkoutPlan.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error("Failed to update workout plan");
        toast.success("Workout plan updated!");
      } else {
        const res = await fetch("/api/rest/v1/workout-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create workout plan");
        toast.success("Workout plan created!");
      }

      workoutForm.reset();
      setWorkoutDialogOpen(false);
      setEditingWorkoutPlan(null);
      fetchWorkoutPlans();
      // Ensure we stay on work tab
      window.history.replaceState(null, "", "#work");
      router.refresh();
    } catch {
      toast.error(
        editingWorkoutPlan
          ? "Failed to update workout plan"
          : "Failed to create workout plan"
      );
    } finally {
      setIsWorkoutSubmitting(false);
    }
  }

  async function activateWorkoutPlan(planId: string) {
    try {
      const res = await fetch(
        `/api/rest/v1/workout-plans/${planId}/activate`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to activate workout plan");
      toast.success("Workout plan activated!");
      setActiveWorkoutPlanId(planId);
      router.refresh();
    } catch {
      toast.error("Failed to activate workout plan");
    }
  }

  async function deleteWorkoutPlan(planId: string) {
    try {
      const res = await fetch(`/api/rest/v1/workout-plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workout plan");
      toast.success("Workout plan deleted!");
      fetchWorkoutPlans();
      router.refresh();
    } catch {
      toast.error("Failed to delete workout plan");
    }
  }

  // Toggle category expansion
  function toggleCategory(category: ExerciseCategory) {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  // Custom exercise creation
  async function onCustomExerciseSubmit(data: CustomExerciseFormValues) {
    setIsCustomExerciseSubmitting(true);
    try {
      const res = await fetch("/api/rest/v1/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create exercise");
      }

      const response = await res.json();
      toast.success("Custom exercise created!");
      customExerciseForm.reset();
      setCustomExerciseDialogOpen(false);
      await fetchExercises();

      // If workout dialog is open, update the form
      if (workoutDialogOpen) {
        const currentExercises = workoutForm.getValues("exercises");
        workoutForm.setValue("exercises", [
          ...currentExercises,
          {
            exerciseId: response.data.id,
            dailyTarget: 0,
            selected: false,
          },
        ]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create exercise"
      );
    } finally {
      setIsCustomExerciseSubmitting(false);
    }
  }

  // Group exercises by category
  const exercisesByCategory = exercises.reduce(
    (acc, e) => {
      if (!acc[e.category]) acc[e.category] = [];
      acc[e.category].push(e);
      return acc;
    },
    {} as Record<ExerciseCategory, Exercise[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      {/* Mobile header: stacked layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Plans</h2>
          {mode === "meals" ? (
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setEditingPlan(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? "Edit Meal Plan" : "Create Meal Plan"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan
                      ? "Update your macro slot allocations."
                      : "Set your daily macro slot allocations."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Cutting Phase" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="proteinSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="carbSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carb Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fat Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="veggieSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Veggie Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="junkSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Junk Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingPlan ? "Save Changes" : "Create Plan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog
              open={workoutDialogOpen}
              onOpenChange={(open) => {
                setWorkoutDialogOpen(open);
                if (!open) setEditingWorkoutPlan(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={openWorkoutCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWorkoutPlan
                      ? "Edit Workout Plan"
                      : "Create Workout Plan"}
                  </DialogTitle>
                  <DialogDescription>
                    Select exercises and set daily targets.
                  </DialogDescription>
                </DialogHeader>
                <Form {...workoutForm}>
                  <form
                    onSubmit={workoutForm.handleSubmit(onWorkoutSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={workoutForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Morning Routine"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {(
                          Object.entries(exercisesByCategory) as [
                            ExerciseCategory,
                            Exercise[]
                          ][]
                        ).map(([category, categoryExercises]) => {
                          const config = EXERCISE_CATEGORIES[category];
                          const isExpanded = expandedCategories[category];
                          const selectedCount = categoryExercises.filter(
                            (exercise) => {
                              const idx = workoutForm
                                .getValues("exercises")
                                .findIndex((e) => e.exerciseId === exercise.id);
                              return idx !== -1 && workoutForm.getValues("exercises")[idx]?.selected;
                            }
                          ).length;

                          return (
                            <Collapsible
                              key={category}
                              open={isExpanded}
                              onOpenChange={() => toggleCategory(category)}
                            >
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors",
                                    config.colors.border,
                                    config.colors.bg
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className={cn("h-4 w-4", config.colors.text)} />
                                    ) : (
                                      <ChevronRight className={cn("h-4 w-4", config.colors.text)} />
                                    )}
                                    <span
                                      className={cn(
                                        "text-sm font-semibold uppercase tracking-wide",
                                        config.colors.text
                                      )}
                                    >
                                      {config.label}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {selectedCount}/{categoryExercises.length}
                                  </Badge>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <div className="space-y-2 pl-2">
                                  {categoryExercises.map((exercise) => {
                                    const exerciseIndex =
                                      workoutForm
                                        .getValues("exercises")
                                        .findIndex(
                                          (e) => e.exerciseId === exercise.id
                                        );
                                    if (exerciseIndex === -1) return null;

                                    return (
                                      <div
                                        key={exercise.id}
                                        className={cn(
                                          "flex items-center gap-3 rounded-lg border p-3",
                                          config.colors.border
                                        )}
                                      >
                                        <FormField
                                          control={workoutForm.control}
                                          name={`exercises.${exerciseIndex}.selected`}
                                          render={({ field }) => (
                                            <FormItem className="flex items-center space-y-0">
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">
                                            {exercise.name}
                                            {exercise.isCustom && (
                                              <Badge variant="outline" className="ml-2 text-xs">
                                                Custom
                                              </Badge>
                                            )}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {exercise.unit}
                                          </p>
                                        </div>
                                        <FormField
                                          control={workoutForm.control}
                                          name={`exercises.${exerciseIndex}.dailyTarget`}
                                          render={({ field }) => (
                                            <FormItem className="w-20">
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  placeholder="Target"
                                                  {...field}
                                                  className="h-8 text-center"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Custom Exercise Button */}
                    <Dialog
                      open={customExerciseDialogOpen}
                      onOpenChange={setCustomExerciseDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Custom Exercise
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Custom Exercise</DialogTitle>
                          <DialogDescription>
                            Add a new exercise to your library.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...customExerciseForm}>
                          <form
                            onSubmit={customExerciseForm.handleSubmit(
                              onCustomExerciseSubmit
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={customExerciseForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exercise Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Box Jumps"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customExerciseForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(
                                        Object.entries(EXERCISE_CATEGORIES) as [
                                          ExerciseCategory,
                                          (typeof EXERCISE_CATEGORIES)[ExerciseCategory]
                                        ][]
                                      ).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                          {config.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customExerciseForm.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., reps, seconds, meters"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              disabled={isCustomExerciseSubmitting}
                              className="w-full"
                            >
                              {isCustomExerciseSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Create Exercise
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      type="submit"
                      disabled={isWorkoutSubmitting}
                      className="w-full"
                    >
                      {isWorkoutSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingWorkoutPlan ? "Save Changes" : "Create Plan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-muted-foreground">
          {mode === "meals"
            ? "Create and manage your daily macro slot allocations."
            : "Create and manage your daily exercise targets."}
        </p>
        <Tabs
          value={mode}
          onValueChange={(value) => handleModeChange(value as PlanMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meals" className="flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Meals
            </TabsTrigger>
            <TabsTrigger
              value="workouts"
              className="flex items-center justify-center gap-2"
            >
              <Dumbbell className="h-4 w-4" />
              Work
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop header: original horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plans</h2>
          <p className="text-muted-foreground">
            {mode === "meals"
              ? "Create and manage your daily macro slot allocations."
              : "Create and manage your daily exercise targets."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs
            value={mode}
            onValueChange={(value) => handleModeChange(value as PlanMode)}
            className="w-auto"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
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

          {/* Create Button */}
          {mode === "meals" ? (
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setEditingPlan(null);
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? "Edit Meal Plan" : "Create Meal Plan"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan
                      ? "Update your macro slot allocations."
                      : "Set your daily macro slot allocations."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Cutting Phase" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="proteinSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="carbSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carb Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fat Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="veggieSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Veggie Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="junkSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Junk Slots</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingPlan ? "Save Changes" : "Create Plan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog
              open={workoutDialogOpen}
              onOpenChange={(open) => {
                setWorkoutDialogOpen(open);
                if (!open) setEditingWorkoutPlan(null);
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openWorkoutCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWorkoutPlan
                      ? "Edit Workout Plan"
                      : "Create Workout Plan"}
                  </DialogTitle>
                  <DialogDescription>
                    Select exercises and set daily targets.
                  </DialogDescription>
                </DialogHeader>
                <Form {...workoutForm}>
                  <form
                    onSubmit={workoutForm.handleSubmit(onWorkoutSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={workoutForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Morning Routine"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {(
                          Object.entries(exercisesByCategory) as [
                            ExerciseCategory,
                            Exercise[]
                          ][]
                        ).map(([category, categoryExercises]) => {
                          const config = EXERCISE_CATEGORIES[category];
                          const isExpanded = expandedCategories[category];
                          const selectedCount = categoryExercises.filter(
                            (exercise) => {
                              const idx = workoutForm
                                .getValues("exercises")
                                .findIndex((e) => e.exerciseId === exercise.id);
                              return idx !== -1 && workoutForm.getValues("exercises")[idx]?.selected;
                            }
                          ).length;

                          return (
                            <Collapsible
                              key={category}
                              open={isExpanded}
                              onOpenChange={() => toggleCategory(category)}
                            >
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors",
                                    config.colors.border,
                                    config.colors.bg
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className={cn("h-4 w-4", config.colors.text)} />
                                    ) : (
                                      <ChevronRight className={cn("h-4 w-4", config.colors.text)} />
                                    )}
                                    <span
                                      className={cn(
                                        "text-sm font-semibold uppercase tracking-wide",
                                        config.colors.text
                                      )}
                                    >
                                      {config.label}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {selectedCount}/{categoryExercises.length}
                                  </Badge>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-2">
                                <div className="space-y-2 pl-2">
                                  {categoryExercises.map((exercise) => {
                                    const exerciseIndex =
                                      workoutForm
                                        .getValues("exercises")
                                        .findIndex(
                                          (e) => e.exerciseId === exercise.id
                                        );
                                    if (exerciseIndex === -1) return null;

                                    return (
                                      <div
                                        key={exercise.id}
                                        className={cn(
                                          "flex items-center gap-3 rounded-lg border p-3",
                                          config.colors.border
                                        )}
                                      >
                                        <FormField
                                          control={workoutForm.control}
                                          name={`exercises.${exerciseIndex}.selected`}
                                          render={({ field }) => (
                                            <FormItem className="flex items-center space-y-0">
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">
                                            {exercise.name}
                                            {exercise.isCustom && (
                                              <Badge variant="outline" className="ml-2 text-xs">
                                                Custom
                                              </Badge>
                                            )}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {exercise.unit}
                                          </p>
                                        </div>
                                        <FormField
                                          control={workoutForm.control}
                                          name={`exercises.${exerciseIndex}.dailyTarget`}
                                          render={({ field }) => (
                                            <FormItem className="w-20">
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  placeholder="Target"
                                                  {...field}
                                                  className="h-8 text-center"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Custom Exercise Button */}
                    <Dialog
                      open={customExerciseDialogOpen}
                      onOpenChange={setCustomExerciseDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Custom Exercise
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Custom Exercise</DialogTitle>
                          <DialogDescription>
                            Add a new exercise to your library.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...customExerciseForm}>
                          <form
                            onSubmit={customExerciseForm.handleSubmit(
                              onCustomExerciseSubmit
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={customExerciseForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exercise Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Box Jumps"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customExerciseForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(
                                        Object.entries(EXERCISE_CATEGORIES) as [
                                          ExerciseCategory,
                                          (typeof EXERCISE_CATEGORIES)[ExerciseCategory]
                                        ][]
                                      ).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                          {config.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customExerciseForm.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., reps, seconds, meters"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              disabled={isCustomExerciseSubmitting}
                              className="w-full"
                            >
                              {isCustomExerciseSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Create Exercise
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      type="submit"
                      disabled={isWorkoutSubmitting}
                      className="w-full"
                    >
                      {isWorkoutSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingWorkoutPlan ? "Save Changes" : "Create Plan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      {mode === "meals" ? (
        plans.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Meal Plans Yet</CardTitle>
              <CardDescription>
                Create your first meal plan to start tracking macros.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...plans]
              .sort((a, b) => {
                if (a.id === activePlanId) return -1;
                if (b.id === activePlanId) return 1;
                return 0;
              })
              .map((plan) => {
                const macros = [
                  { key: "proteins" as const, value: plan.proteinSlots },
                  { key: "carbs" as const, value: plan.carbSlots },
                  { key: "fats" as const, value: plan.fatSlots },
                  { key: "veggies" as const, value: plan.veggieSlots },
                  { key: "junk" as const, value: plan.junkSlots },
                ];
                const maxSlots = Math.max(...macros.map((m) => m.value), 1);

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      activePlanId === plan.id && "ring-2 ring-primary"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {activePlanId === plan.id && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {macros.map(({ key, value }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span
                                className={`font-medium ${MACRO_CONFIG[key].text}`}
                              >
                                {MACRO_CONFIG[key].label}
                              </span>
                              <span className="font-bold">{value}</span>
                            </div>
                            <div
                              className={`h-2 rounded-full ${MACRO_CONFIG[key].bgLight}`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${MACRO_CONFIG[key].bg}`}
                                style={{
                                  width: animateBars
                                    ? `${(value / maxSlots) * 100}%`
                                    : "0%",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        {activePlanId !== plan.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => activatePlan(plan.id)}
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )
      ) : workoutPlans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Workout Plans Yet</CardTitle>
            <CardDescription>
              Create your first workout plan to start tracking exercises.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...workoutPlans]
            .sort((a, b) => {
              if (a.id === activeWorkoutPlanId) return -1;
              if (b.id === activeWorkoutPlanId) return 1;
              return 0;
            })
            .map((plan) => {
              // Group by category for display
              const byCategory = plan.exercises.reduce(
                (acc, pe) => {
                  const cat = pe.exercise.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(pe);
                  return acc;
                },
                {} as Record<ExerciseCategory, WorkoutPlanExercise[]>
              );

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    activeWorkoutPlanId === plan.id && "ring-2 ring-primary"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {activeWorkoutPlanId === plan.id && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {(
                        Object.entries(byCategory) as [
                          ExerciseCategory,
                          WorkoutPlanExercise[]
                        ][]
                      ).map(([category, catExercises]) => {
                        const config = EXERCISE_CATEGORIES[category];
                        const totalTarget = catExercises.reduce(
                          (sum, e) => sum + e.dailyTarget,
                          0
                        );
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span
                                className={`font-medium ${config.colors.text}`}
                              >
                                {config.shortLabel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {catExercises.length} exercises, {totalTarget}{" "}
                                total
                              </span>
                            </div>
                            <div
                              className={`h-2 rounded-full ${config.colors.bg}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      {activeWorkoutPlanId !== plan.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => activateWorkoutPlan(plan.id)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => openWorkoutEditDialog(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteWorkoutPlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
