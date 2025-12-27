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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Droplets } from "lucide-react";
import { WATER_UNIT_LABELS, WATER_UNIT_SHORT, toFluidOunces } from "@/lib/water";
import type { WaterUnit } from "@prisma/client";

const WATER_UNITS: WaterUnit[] = [
  "FLUID_OUNCES",
  "GLASSES",
  "CUPS",
  "LITERS",
  "MILLILITERS",
];

// Quick add presets
const QUICK_PRESETS = [
  { label: "1 Glass", amount: 1, unit: "GLASSES" as WaterUnit },
  { label: "1 Cup", amount: 1, unit: "CUPS" as WaterUnit },
  { label: "16 oz", amount: 16, unit: "FLUID_OUNCES" as WaterUnit },
  { label: "500 mL", amount: 500, unit: "MILLILITERS" as WaterUnit },
  { label: "1 Liter", amount: 1, unit: "LITERS" as WaterUnit },
];

const waterFormSchema = z.object({
  amount: z.coerce.number().min(0.1, "Amount must be greater than 0"),
  unit: z.enum(["FLUID_OUNCES", "GLASSES", "CUPS", "LITERS", "MILLILITERS"]),
  notes: z.string().max(500).optional(),
});

type WaterFormValues = z.infer<typeof waterFormSchema>;

interface WaterEntry {
  id: string;
  amount: number;
  unit: WaterUnit;
  notes: string | null;
  dateTime: Date;
}

interface WaterFormProps {
  water?: WaterEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WaterForm({ water, onSuccess, onCancel }: WaterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!water;

  const form = useForm<WaterFormValues>({
    resolver: zodResolver(waterFormSchema),
    defaultValues: {
      amount: water?.amount ?? 8,
      unit: water?.unit ?? "FLUID_OUNCES",
      notes: water?.notes ?? "",
    },
  });

  const watchedAmount = form.watch("amount");
  const watchedUnit = form.watch("unit");

  // Calculate fluid ounces equivalent for display
  const flOzEquivalent = toFluidOunces(watchedAmount || 0, watchedUnit);

  async function onSubmit(data: WaterFormValues) {
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode
        ? `/api/rest/v1/water/${water.id}`
        : "/api/rest/v1/water";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          unit: data.unit,
          notes: data.notes || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save water entry");
      }

      toast.success(isEditMode ? "Water entry updated!" : "Water logged!");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/water");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save water entry"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyPreset(preset: (typeof QUICK_PRESETS)[0]) {
    form.setValue("amount", preset.amount);
    form.setValue("unit", preset.unit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Presets */}
        {!isEditMode && (
          <div className="space-y-2">
            <FormLabel>Quick Add</FormLabel>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  <Droplets className="mr-1 h-3 w-3" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...field}
                    className="text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WATER_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {WATER_UNIT_LABELS[unit]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fluid ounces equivalent */}
        <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Equivalent to</p>
          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
            {Math.round(flOzEquivalent * 10) / 10} fl oz
          </p>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., After workout, With breakfast..."
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any notes about this water intake
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Log Water"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
