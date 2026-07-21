export type BookmarkKind = "note" | "file" | "community_note";

export interface BookmarkItem {
  kind: BookmarkKind;
  id: string;
  title: string;
  subtitle: string; // subject name, mime type, or author display name
  href: string;
  updatedAt: string;
}

export interface BookmarkOverview {
  notes: BookmarkItem[];
  files: BookmarkItem[];
  community: BookmarkItem[];
  totals: {
    notes: number;
    files: number;
    community: number;
    all: number;
  };
}
