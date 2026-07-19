import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCommunityNote } from "@/features/community/actions/get-community-note";
import { CommunityDetailView } from "@/features/community/components/community-detail-view";

export const metadata: Metadata = { title: "Community note" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityNotePage({ params }: Props) {
  const { id } = await params;
  const result = await getCommunityNote(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  return (
    <div className="mx-auto max-w-[820px] px-5 py-6 sm:px-7 sm:py-8 lg:px-11 lg:py-10">
      <CommunityDetailView note={result.data} />
    </div>
  );
}
