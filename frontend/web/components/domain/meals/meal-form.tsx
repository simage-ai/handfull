"use client";

import { useState, useCallback, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const mealFormSchema = z.object({
  proteinsUsed: z.coerce.number().min(0),
  fatsUsed: z.coerce.number().min(0),
  carbsUsed: z.coerce.number().min(0),
  veggiesUsed: z.coerce.number().min(0),
  junkUsed: z.coerce.number().min(0),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional(),
  notes: z.string().optional(),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

interface MealData {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  mealCategory: string | null;
  image: string | null;
  dateTime: Date;
  notes?: { id: string; text: string }[];
}

interface MealFormProps {
  meal?: MealData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Convert a GCS path (gs://bucket/path) to a proxy API URL
 */
function gcsPathToProxyUrl(gcsPath: string): string | null {
  if (!gcsPath.startsWith("gs://")) return null;

  const withoutProtocol = gcsPath.replace("gs://", "");
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex === -1) return null;

  const filePath = withoutProtocol.substring(slashIndex + 1);
  return `/api/rest/v1/images/${filePath}`;
}

export function MealForm({ meal, onSuccess, onCancel }: MealFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const isEditMode = !!meal;

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      // For edit mode, use actual values; for new meals, use 0 (placeholder will still show)
      proteinsUsed: meal?.proteinsUsed ?? 0,
      fatsUsed: meal?.fatsUsed ?? 0,
      carbsUsed: meal?.carbsUsed ?? 0,
      veggiesUsed: meal?.veggiesUsed ?? 0,
      junkUsed: meal?.junkUsed ?? 0,
      mealCategory: (meal?.mealCategory as MealFormValues["mealCategory"]) || undefined,
      notes: meal?.notes?.[0]?.text ?? "",
    },
  });

  // Set existing image preview on mount for edit mode
  useEffect(() => {
    if (meal?.image && !removeExistingImage) {
      const proxyUrl = gcsPathToProxyUrl(meal.image);
      if (proxyUrl) {
        setImagePreview(proxyUrl);
      }
    }
  }, [meal?.image, removeExistingImage]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setImageFile(file);
    setRemoveExistingImage(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  async function onSubmit(data: MealFormValues) {
    setIsSubmitting(true);

    try {
      let imagePath: string | undefined | null;

      // Upload new image if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/rest/v1/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        imagePath = uploadData.data.path;
      } else if (removeExistingImage) {
        // Explicitly set to null to remove the image
        imagePath = null;
      }

      if (isEditMode) {
        // Update existing meal
        const mealData: Record<string, unknown> = {
          proteinsUsed: data.proteinsUsed,
          fatsUsed: data.fatsUsed,
          carbsUsed: data.carbsUsed,
          veggiesUsed: data.veggiesUsed,
          junkUsed: data.junkUsed,
          mealCategory: data.mealCategory || null,
        };

        // Only include image if it changed
        if (imagePath !== undefined) {
          mealData.image = imagePath;
        }

        const res = await fetch(`/api/rest/v1/meals/${meal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mealData),
        });

        if (!res.ok) {
          throw new Error("Failed to update meal");
        }

        toast.success("Meal updated successfully!");
        onSuccess?.();
        router.refresh();
      } else {
        // Create new meal
        const mealData = {
          ...data,
          image: imagePath,
          notes: data.notes ? [data.notes] : undefined,
        };

        const res = await fetch("/api/rest/v1/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mealData),
        });

        if (!res.ok) {
          throw new Error("Failed to create meal");
        }

        toast.success("Meal added successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error(
        isEditMode
          ? "Failed to update meal. Please try again."
          : "Failed to add meal. Please try again."
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload - Drag and Drop */}
        <div className="space-y-2">
          <FormLabel>Photo (Optional)</FormLabel>
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Meal preview"
                className="w-full max-h-80 rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleImageChange}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {isDragging ? (
                  <>
                    <ImageIcon className="h-10 w-10 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      Drop image here
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drag and drop an image, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP or HEIC up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Macro Inputs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <FormField
            control={form.control}
            name="proteinsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proteins</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.5} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carbsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbs</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.5} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fats</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.5} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="veggiesUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veggies</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.5} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="junkUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Junk</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.5} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Meal Category */}
        <FormField
          control={form.control}
          name="mealCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Type (Optional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="SNACK">Snack</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes - only show for new meals */}
        {!isEditMode && (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about this meal..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Add Meal"}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
