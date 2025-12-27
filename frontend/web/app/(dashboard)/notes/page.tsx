import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, BookOpen, Tags } from "lucide-react";
import { JournalTable } from "@/components/domain/journal/journal-table";
import { JournalForm } from "@/components/domain/journal/journal-form";
import { TagForm } from "@/components/domain/journal/tag-form";

async function getNotesData(userId: string) {
  const [journalEntries, tags] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { dateTime: "desc" },
    }),
    prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { journalEntries: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Transform entries to flatten tags
  const transformedEntries = journalEntries.map((entry) => ({
    ...entry,
    tags: entry.tags.map((t) => t.tag),
  }));

  // Transform tags to include usage count
  const transformedTags = tags.map((tag) => ({
    ...tag,
    usageCount: tag._count.journalEntries,
  }));

  return {
    entries: transformedEntries,
    tags: transformedTags,
  };
}

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { entries, tags } = await getNotesData(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notes</h2>
          <p className="text-muted-foreground">
            Your personal journal and quick notes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tags className="mr-2 h-4 w-4" />
                Manage Tags
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Tags help you organize and filter your notes
                </DialogDescription>
              </DialogHeader>
              <TagForm />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Write a quick note or journal entry
                </DialogDescription>
              </DialogHeader>
              <JournalForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats and Tags Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              Notes created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tags Used</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique tags
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags yet. Create one when adding a note!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <span className="ml-1 opacity-75">({tag.usageCount})</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Notes</CardTitle>
          <CardDescription>
            Search and filter through your notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JournalTable entries={entries} allTags={tags} />
        </CardContent>
      </Card>
    </div>
  );
}
