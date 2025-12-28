"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagForm } from "./tag-form";
import { Tags, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

interface TagManagerProps {
  tags: Tag[];
}

type View = "list" | "create" | "edit";

export function TagManager({ tags: initialTags }: TagManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);
  const [tags, setTags] = useState(initialTags);

  const handleCreateSuccess = () => {
    setView("list");
    router.refresh();
  };

  const handleEditSuccess = () => {
    setEditingTag(null);
    setView("list");
    router.refresh();
  };

  const handleDelete = async (tag: Tag) => {
    try {
      const res = await fetch(`/api/rest/v1/tags/${tag.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete tag");
      }

      toast.success("Tag deleted");
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      setDeleteConfirmTag(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tag");
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setView("edit");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setView("list");
      setEditingTag(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Tags className="mr-2 h-4 w-4" />
            Manage Tags
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {view !== "list" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setView("list");
                    setEditingTag(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {view === "list" && "Tag Manager"}
              {view === "create" && "Create New Tag"}
              {view === "edit" && `Edit Tag: ${editingTag?.name}`}
            </DialogTitle>
            <DialogDescription>
              {view === "list" && "Organize your notes with custom tags"}
              {view === "create" && "Add a new tag to organize your notes"}
              {view === "edit" && "Update this tag's name or color"}
            </DialogDescription>
          </DialogHeader>

          {view === "list" && (
            <div className="space-y-4">
              {/* Create Button */}
              <Button
                onClick={() => setView("create")}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Tag
              </Button>

              <Separator />

              {/* Tags List */}
              {tags.length === 0 ? (
                <div className="text-center py-8">
                  <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tags yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first tag to organize notes
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {tag.usageCount} {tag.usageCount === 1 ? "note" : "notes"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => startEdit(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmTag(tag)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {view === "create" && (
            <TagForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setView("list")}
            />
          )}

          {view === "edit" && editingTag && (
            <TagForm
              tag={editingTag}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setView("list");
                setEditingTag(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmTag}
        onOpenChange={(open) => !open && setDeleteConfirmTag(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{deleteConfirmTag?.name}&quot;?
              {deleteConfirmTag && deleteConfirmTag.usageCount > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  This tag is used in {deleteConfirmTag.usageCount}{" "}
                  {deleteConfirmTag.usageCount === 1 ? "note" : "notes"}.
                  The tag will be removed from those notes.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmTag && handleDelete(deleteConfirmTag)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
