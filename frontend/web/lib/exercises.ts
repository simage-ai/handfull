import { ExerciseCategory } from "@prisma/client";

export const EXERCISE_CATEGORIES: Record<
  ExerciseCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    colors: {
      border: string;
      bg: string;
      text: string;
      chartColor: string;
    };
  }
> = {
  LOWER_BODY_GLUTES: {
    label: "Lower Body & Glutes",
    shortLabel: "Lower",
    description: "Exercises targeting legs and glutes",
    colors: {
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      chartColor: "#ef4444", // red-500
    },
  },
  UPPER_BODY_CORE: {
    label: "Upper Body & Core",
    shortLabel: "Upper",
    description: "Exercises targeting arms, chest, back, and core",
    colors: {
      border: "border-blue-200 dark:border-blue-900",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      chartColor: "#3b82f6", // blue-500
    },
  },
  FULL_BODY_CARDIO: {
    label: "Full Body & Cardio",
    shortLabel: "Cardio",
    description: "Full body movements and cardiovascular exercises",
    colors: {
      border: "border-green-200 dark:border-green-900",
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      chartColor: "#22c55e", // green-500
    },
  },
  STRETCHES: {
    label: "Stretches",
    shortLabel: "Stretch",
    description: "Posture and mobility stretches",
    colors: {
      border: "border-purple-200 dark:border-purple-900",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      chartColor: "#a855f7", // purple-500
    },
  },
};

export type PreDefinedExercise = {
  name: string;
  category: ExerciseCategory;
  unit: string;
};

export const PRE_DEFINED_EXERCISES: PreDefinedExercise[] = [
  // Lower Body & Glutes
  { name: "Squats", category: "LOWER_BODY_GLUTES", unit: "reps" },
  { name: "Lunges", category: "LOWER_BODY_GLUTES", unit: "reps" },
  { name: "Glute Bridges", category: "LOWER_BODY_GLUTES", unit: "reps" },
  { name: "Step-ups", category: "LOWER_BODY_GLUTES", unit: "reps" },
  { name: "Single-Leg Deadlifts", category: "LOWER_BODY_GLUTES", unit: "reps" },

  // Upper Body & Core
  { name: "Push-ups", category: "UPPER_BODY_CORE", unit: "reps" },
  { name: "Pull-ups", category: "UPPER_BODY_CORE", unit: "reps" },
  { name: "Plank", category: "UPPER_BODY_CORE", unit: "seconds" },
  { name: "Dips", category: "UPPER_BODY_CORE", unit: "reps" },
  { name: "Superman", category: "UPPER_BODY_CORE", unit: "reps" },

  // Full Body & Cardio
  { name: "Burpees", category: "FULL_BODY_CARDIO", unit: "reps" },
  { name: "Mountain Climbers", category: "FULL_BODY_CARDIO", unit: "reps" },
  { name: "Jumping Jacks", category: "FULL_BODY_CARDIO", unit: "reps" },
  { name: "Bear Crawls", category: "FULL_BODY_CARDIO", unit: "meters" },

  // Stretches
  { name: "Chest Opener", category: "STRETCHES", unit: "reps" },
  { name: "Thoracic Spine Rotation", category: "STRETCHES", unit: "reps" },
  { name: "Upper Trap Stretch", category: "STRETCHES", unit: "reps" },
  { name: "Wall Angels", category: "STRETCHES", unit: "reps" },
  { name: "Chin Tucks", category: "STRETCHES", unit: "reps" },
  { name: "Behind Back Book Pass", category: "STRETCHES", unit: "reps" },
];

export function getCategoryConfig(category: ExerciseCategory) {
  return EXERCISE_CATEGORIES[category];
}

export function getExercisesByCategory(category: ExerciseCategory) {
  return PRE_DEFINED_EXERCISES.filter(
    (exercise) => exercise.category === category
  );
}

export function getAllCategories(): ExerciseCategory[] {
  return Object.keys(EXERCISE_CATEGORIES) as ExerciseCategory[];
}
