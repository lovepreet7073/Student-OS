import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPlan } from "@/features/study-planner/actions/get-plan";
import { PlanView } from "@/features/study-planner/components/plan-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPlan(id);
  return { title: result.ok ? result.data.title : "Study plan" };
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPlan(id);
  if (!result.ok) notFound();
  return <PlanView plan={result.data} />;
}
