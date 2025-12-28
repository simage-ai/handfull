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
import { MoreHorizontal, Trash2, ArrowUpDown, Pencil, Droplets } from "lucide-react";
import { toast } from "sonner";
import { WaterForm } from "./water-form";
import { formatWaterAmount, toFluidOunces, WATER_UNIT_LABELS } from "@/lib/water";
import type { WaterUnit } from "@prisma/client";

interface WaterEntry {
  id: string;
  amount: number;
  unit: WaterUnit;
  notes: string | null;
  dateTime: Date;
}

interface WaterTableProps {
  waterEntries: WaterEntry[];
}

export function WaterTable({ waterEntries }: WaterTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingWater, setEditingWater] = useState<WaterEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const deleteWater = async (id: string) => {
    try {
      const res = await fetch(`/api/rest/v1/water/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Water entry deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete water entry");
    }
  };

  const openEditDialog = (water: WaterEntry) => {
    setEditingWater(water);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingWater(null);
    router.refresh();
  };

  const columns: ColumnDef<WaterEntry>[] = [
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
      cell: ({ row }) => format(new Date(row.getValue("dateTime")), "PPp"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const unit = row.original.unit;
        return (
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-500" />
            <span className="font-medium">{formatWaterAmount(amount, unit)}</span>
          </div>
        );
      },
    },
    {
      id: "flOzEquivalent",
      header: "Fl Oz",
      cell: ({ row }) => {
        const flOz = toFluidOunces(row.original.amount, row.original.unit);
        return (
          <Badge variant="outline" className="text-cyan-700 border-cyan-300">
            {Math.round(flOz * 10) / 10} fl oz
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        if (!notes) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="max-w-[200px] truncate block" title={notes}>
            {notes}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const water = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(water)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteWater(water.id)}
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
    data: waterEntries,
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
                    No water entries found.
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

      {/* Edit Water Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Water Entry</DialogTitle>
            <DialogDescription>
              {editingWater && (
                <>
                  Logged on{" "}
                  {format(new Date(editingWater.dateTime), "PPPP 'at' p")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingWater && (
            <WaterForm
              water={editingWater}
              onSuccess={closeEditDialog}
              onCancel={closeEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
