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
import { MoreHorizontal, Trash2, ArrowUpDown, Pencil, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { MealForm } from "./meal-form";

interface Note {
  id: string;
  text: string;
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
  dateTime: Date;
  notes: Note[];
}

interface MealsTableProps {
  meals: Meal[];
  onViewMeal?: (meal: Meal) => void;
}

export function MealsTable({ meals, onViewMeal }: MealsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const deleteMeal = async (id: string) => {
    try {
      const res = await fetch(`/api/rest/v1/meals/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Meal deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete meal");
    }
  };

  const openEditDialog = (meal: Meal) => {
    setEditingMeal(meal);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingMeal(null);
  };

  const columns: ColumnDef<Meal>[] = [
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
        const meal = row.original;
        return (
          <button
            onClick={() => onViewMeal?.(meal)}
            className="text-left hover:underline text-primary font-medium"
          >
            {format(new Date(row.getValue("dateTime")), "PPp")}
          </button>
        );
      },
    },
    {
      accessorKey: "mealCategory",
      header: "Type",
      cell: ({ row }) => {
        const category = row.getValue("mealCategory") as string | null;
        if (!category) {
          return <span className="text-muted-foreground">-</span>;
        }
        // Format: "BREAKFAST" -> "Breakfast"
        const formatted =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        return <Badge variant="secondary">{formatted}</Badge>;
      },
    },
    {
      accessorKey: "notes",
      header: "",
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes || notes.length === 0) return null;
        return (
          <span className="inline-flex items-center gap-1 text-muted-foreground" title={`${notes.length} note(s)`}>
            <StickyNote className="h-4 w-4" />
            <span className="text-xs">{notes.length}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "proteinsUsed",
      header: "P",
      cell: ({ row }) => row.getValue("proteinsUsed"),
    },
    {
      accessorKey: "carbsUsed",
      header: "C",
      cell: ({ row }) => row.getValue("carbsUsed"),
    },
    {
      accessorKey: "fatsUsed",
      header: "F",
      cell: ({ row }) => row.getValue("fatsUsed"),
    },
    {
      accessorKey: "veggiesUsed",
      header: "V",
      cell: ({ row }) => row.getValue("veggiesUsed"),
    },
    {
      accessorKey: "junkUsed",
      header: "J",
      cell: ({ row }) => row.getValue("junkUsed"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const meal = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(meal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteMeal(meal.id)}
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
    data: meals,
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
                    No meals found.
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

      {/* Edit Meal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>
              {editingMeal && (
                <>
                  Logged on{" "}
                  {format(new Date(editingMeal.dateTime), "PPPP 'at' p")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingMeal && (
            <MealForm
              meal={editingMeal}
              onSuccess={closeEditDialog}
              onCancel={closeEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
