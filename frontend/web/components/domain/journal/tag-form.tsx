"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Predefined tag colors
const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#64748b", // slate
];

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagFormProps {
  tag?: Tag;
  onSuccess?: (tag: Tag) => void;
  onCancel?: () => void;
}

const tagFormSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

export function TagForm({ tag, onSuccess, onCancel }: TagFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!tag;

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name ?? "",
      color: tag?.color ?? "#6366f1",
    },
  });

  const selectedColor = form.watch("color");

  async function onSubmit(data: TagFormValues) {
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode
        ? `/api/rest/v1/tags/${tag.id}`
        : "/api/rest/v1/tags";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save tag");
      }

      const response = await res.json();
      toast.success(isEditMode ? "Tag updated!" : "Tag created!");

      if (onSuccess) {
        onSuccess(response.data);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tag");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Work, Personal, Ideas..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedColor === color
                            ? "border-foreground ring-2 ring-offset-2"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => form.setValue("color", color)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      {...field}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => form.setValue("color", e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-2">Preview</p>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: selectedColor }}
          >
            {form.watch("name") || "Tag Name"}
          </span>
        </div>

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
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Tag"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
