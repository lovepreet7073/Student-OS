import { FolderOpen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

interface LibraryEmptyStateProps {
  hasFilters: boolean;
}

export function LibraryEmptyState({ hasFilters }: LibraryEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No files match those filters"
        description="Try clearing the search or picking a different subject."
      />
    );
  }
  return (
    <EmptyState
      icon={FolderOpen}
      title="Your Study Space is empty"
      description="Upload PDFs of chapters, past-paper scans, notebook photos, and anything else you're studying. Files are private to you."
    />
  );
}
