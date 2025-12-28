"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, ArrowUpDown, Eye, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { ExerciseCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  unit: string;
}

interface WorkoutExercise {
  exerciseId: string;
  completed: number;
  exercise: Exercise;
}

interface Workout {
  id: string;
  dateTime: Date;
  notes: string | null;
  exercises: WorkoutExercise[];
}

interface WorkoutsTableProps {
  workouts: Workout[];
}

export function WorkoutsTable({ workouts }: WorkoutsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const deleteWorkout = async (id: string) => {
    try {
      const res = await fetch(`/api/rest/v1/workouts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Workout deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete workout");
    }
  };

  const openViewDialog = (workout: Workout) => {
    setViewingWorkout(workout);
    setViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setViewingWorkout(null);
  };

  // Summarize workout by category
  const getWorkoutSummary = (exercises: WorkoutExercise[]) => {
    const summary: Record<ExerciseCategory, number> = {
      LOWER_BODY_GLUTES: 0,
      UPPER_BODY_CORE: 0,
      FULL_BODY_CARDIO: 0,
      STRETCHES: 0,
    };
    exercises.forEach((e) => {
      summary[e.exercise.category] += e.completed;
    });
    return summary;
  };

  const columns: ColumnDef<Workout>[] = [
    {
      accessorKey: "dateTime",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const workout = row.original;
        return (
          <button
            onClick={() => openViewDialog(workout)}
            className="text-left hover:underline text-primary font-medium"
          >
            {format(new Date(row.getValue("dateTime")), "PPp")}
          </button>
        );
      },
    },
    {
      id: "exercises",
      header: "Exercises",
      cell: ({ row }) => {
        const workout = row.original;
        return (
          <span className="text-muted-foreground">
            {workout.exercises.length} exercises
          </span>
        );
      },
    },
    {
      id: "notes",
      header: "",
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) return null;
        return (
          <span className="inline-flex items-center text-muted-foreground" title="Has notes">
            <StickyNote className="h-4 w-4" />
          </span>
        );
      },
    },
    {
      id: "lower",
      header: () => (
        <span className={EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.colors.text}>
          Lower
        </span>
      ),
      cell: ({ row }) => {
        const summary = getWorkoutSummary(row.original.exercises);
        return (
          <Badge
            variant="secondary"
            className={cn(
              EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.colors.bg,
              EXERCISE_CATEGORIES.LOWER_BODY_GLUTES.colors.text
            )}
          >
            {summary.LOWER_BODY_GLUTES}
          </Badge>
        );
      },
    },
    {
      id: "upper",
      header: () => (
        <span className={EXERCISE_CATEGORIES.UPPER_BODY_CORE.colors.text}>
          Upper
        </span>
      ),
      cell: ({ row }) => {
        const summary = getWorkoutSummary(row.original.exercises);
        return (
          <Badge
            variant="secondary"
            className={cn(
              EXERCISE_CATEGORIES.UPPER_BODY_CORE.colors.bg,
              EXERCISE_CATEGORIES.UPPER_BODY_CORE.colors.text
            )}
          >
            {summary.UPPER_BODY_CORE}
          </Badge>
        );
      },
    },
    {
      id: "cardio",
      header: () => (
        <span className={EXERCISE_CATEGORIES.FULL_BODY_CARDIO.colors.text}>
          Cardio
        </span>
      ),
      cell: ({ row }) => {
        const summary = getWorkoutSummary(row.original.exercises);
        return (
          <Badge
            variant="secondary"
            className={cn(
              EXERCISE_CATEGORIES.FULL_BODY_CARDIO.colors.bg,
              EXERCISE_CATEGORIES.FULL_BODY_CARDIO.colors.text
            )}
          >
            {summary.FULL_BODY_CARDIO}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const workout = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openViewDialog(workout)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteWorkout(workout.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: workouts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No workouts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Workout Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Workout Details</DialogTitle>
            <DialogDescription>
              {viewingWorkout && (
                <>
                  Logged on{" "}
                  {format(new Date(viewingWorkout.dateTime), "PPPP 'at' p")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewingWorkout && (
            <div className="space-y-4">
              {/* Group exercises by category */}
              {(
                Object.entries(
                  viewingWorkout.exercises.reduce(
                    (acc, e) => {
                      if (!acc[e.exercise.category]) {
                        acc[e.exercise.category] = [];
                      }
                      acc[e.exercise.category].push(e);
                      return acc;
                    },
                    {} as Record<ExerciseCategory, WorkoutExercise[]>
                  )
                ) as [ExerciseCategory, WorkoutExercise[]][]
              ).map(([category, exercises]) => {
                const config = EXERCISE_CATEGORIES[category];
                return (
                  <div key={category} className="space-y-2">
                    <h4
                      className={cn(
                        "text-sm font-semibold uppercase tracking-wide",
                        config.colors.text
                      )}
                    >
                      {config.label}
                    </h4>
                    <div className="space-y-1">
                      {exercises.map((e) => (
                        <div
                          key={e.exerciseId}
                          className="flex justify-between text-sm"
                        >
                          <span>{e.exercise.name}</span>
                          <span className="font-medium">
                            {e.completed} {e.exercise.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {viewingWorkout.notes && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-semibold mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {viewingWorkout.notes}
                  </p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={closeViewDialog}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
