export type NoteVisibility = "private" | "link";

export type Note = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string;
  title: string;
  content: string;
  isBookmarked: boolean;
  visibility: NoteVisibility;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Denormalized shape used in list views — carries the subject name so cards
 * don't need per-row joins on the client. */
export type NoteListItem = Note & {
  subjectName: string;
  subjectSlug: string;
};

/** Query parameters accepted by `listNotes`. All optional. */
export type NotesQuery = {
  subjectId?: string;
  bookmarkedOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export type NotesListResult = {
  items: NoteListItem[];
  total: number;
};
