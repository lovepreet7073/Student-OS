import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDoubt } from "@/features/doubt-solver/actions/get-doubt";
import { DoubtDetailView } from "@/features/doubt-solver/components/doubt-detail-view";

export const metadata: Metadata = { title: "AI answer" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DoubtDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getDoubt(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  return (
    <div className="mx-auto max-w-[820px] px-5 py-6 sm:px-7 sm:py-8 lg:px-11 lg:py-10">
      <DoubtDetailView doubt={result.data} />
    </div>
  );
}
