import type { CommunityNoteListItem } from "../types";
import { CommunityNoteCard } from "./community-note-card";

interface Props {
  notes: CommunityNoteListItem[];
}

export function CommunityFeed({ notes }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <CommunityNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
