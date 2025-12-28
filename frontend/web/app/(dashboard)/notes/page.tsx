import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { PlusCircle } from "lucide-react";
import { JournalTable } from "@/components/domain/journal/journal-table";
import { JournalForm } from "@/components/domain/journal/journal-form";
import { TagManager } from "@/components/domain/journal/tag-manager";

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
          <TagManager tags={tags} />
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
