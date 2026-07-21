"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { renameConversation } from "../actions/rename-conversation";

interface Props {
  conversationId: string;
  title: string;
  subjectName: string | null;
}

/**
 * Inline title editor for the chat header. Click-to-edit; Enter saves,
 * Escape cancels. Optimistic local update so the header doesn't flash
 * back to the old title while the Server Action round-trips.
 */
export function EditableChatTitle({ conversationId, title, subjectName }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function commit() {
    const next = value.trim();
    if (next.length === 0 || next === title) {
      setEditing(false);
      setValue(title);
      return;
    }
    setSaving(true);
    const res = await renameConversation({ conversationId, title: next });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      setValue(title);
    }
    setEditing(false);
  }

  function cancel() {
    setValue(title);
    setEditing(false);
  }

  return (
    <div className="flex min-w-0 flex-col">
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          disabled={saving}
          className="w-full rounded-sm border border-input bg-transparent px-1 py-0.5 text-[15px] font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={200}
          aria-label="Chat title"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "group flex items-center gap-1.5 text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
          )}
          aria-label="Rename this chat"
        >
          <span className="truncate text-[15px] font-extrabold tracking-tight">
            {value}
          </span>
          <Pencil
            className="h-3 w-3 flex-shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      )}
      {subjectName ? (
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {subjectName}
        </div>
      ) : null}
    </div>
  );
}
