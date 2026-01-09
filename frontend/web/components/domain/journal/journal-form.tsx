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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { TagForm } from "./tag-form";

// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface JournalEntry {
  id: string;
  text: string;
  dateTime: Date;
  tags: Tag[];
}

interface JournalFormProps {
  entry?: JournalEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const journalFormSchema = z.object({
  text: z.string().min(1, "Note cannot be empty").max(10000),
  dateTime: z.string().min(1, "Date and time is required"),
  tagIds: z.array(z.string()).optional(),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;

export function JournalForm({ entry, onSuccess, onCancel }: JournalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    entry?.tags.map((t) => t.id) || []
  );
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const isEditMode = !!entry;

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      text: entry?.text ?? "",
      dateTime: formatDateTimeLocal(entry?.dateTime ? new Date(entry.dateTime) : new Date()),
      tagIds: entry?.tags.map((t) => t.id) ?? [],
    },
  });

  // Fetch available tags
  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch("/api/rest/v1/tags");
      const data = await res.json();
      setTags(data.data);
    } catch {
      console.error("Failed to fetch tags");
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const newSelection = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];
      form.setValue("tagIds", newSelection);
      return newSelection;
    });
  }

  async function onSubmit(data: JournalFormValues) {
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode
        ? `/api/rest/v1/journal/${entry.id}`
        : "/api/rest/v1/journal";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          dateTime: new Date(data.dateTime).toISOString(),
          tagIds: selectedTagIds,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save note");
      }

      toast.success(isEditMode ? "Note updated!" : "Note created!");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/notes");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save note"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTagCreated(newTag: Tag) {
    setTags((prev) => [...prev, newTag]);
    setSelectedTagIds((prev) => [...prev, newTag.id]);
    form.setValue("tagIds", [...selectedTagIds, newTag.id]);
    setCreateTagDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your thoughts, ideas, or observations..."
                  className="min-h-[150px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your notes are private and only visible to you
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Selection */}
        <div className="space-y-3">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  style={{
                    backgroundColor: isSelected ? tag.color : "transparent",
                    borderColor: tag.color,
                    color: isSelected ? "white" : tag.color,
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                  {isSelected && <X className="ml-1 h-3 w-3" />}
                </Badge>
              );
            })}
            <Dialog
              open={createTagDialogOpen}
              onOpenChange={setCreateTagDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="mr-1 h-3 w-3" />
                  New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                  <DialogDescription>
                    Create a new tag to organize your notes
                  </DialogDescription>
                </DialogHeader>
                <TagForm
                  onSuccess={handleTagCreated}
                  onCancel={() => setCreateTagDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Click tags to add or remove them from this note
          </p>
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
            {isEditMode ? "Save Changes" : "Create Note"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
