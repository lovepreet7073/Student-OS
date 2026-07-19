export type CommunityNoteStatus = "pending" | "approved" | "rejected";

/** Row shown in feeds + moderation queue lists. */
export type CommunityNoteListItem = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  subjectId: string;
  subjectName: string;
  title: string;
  excerpt: string;
  status: CommunityNoteStatus;
  likesCount: number;
  bookmarksCount: number;
  hasLiked: boolean;
  createdAt: string;
};

/** Full detail view. */
export type CommunityNoteDetail = CommunityNoteListItem & {
  content: string;
  rejectionReason: string | null;
  moderatedAt: string | null;
  hasBookmarked: boolean;
  isOwn: boolean;
};

export type ModerateAction = "approve" | "reject";
