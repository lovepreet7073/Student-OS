import Link from "next/link";
import { BookText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

interface NotesEmptyStateProps {
  hasFilters: boolean;
}

export function NotesEmptyState({ hasFilters }: NotesEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={BookText}
        title="No notes match those filters"
        description="Try clearing the search or picking a different subject."
      />
    );
  }
  return (
    <EmptyState
      icon={BookText}
      title="No notes yet"
      description="Start capturing what you're learning — organised by subject, searchable, and always with you."
      action={
        <Button asChild>
          <Link href="/app/notes/new">
            <Plus className="h-4 w-4" aria-hidden />
            Create your first note
          </Link>
        </Button>
      }
    />
  );
}
