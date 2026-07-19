import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEvaluation } from "@/features/test-evaluations/actions/get-evaluation";
import { EvaluationReport } from "@/features/test-evaluations/components/evaluation-report";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getEvaluation(id);
  return { title: result.ok ? result.data.title : "Test evaluation" };
}

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEvaluation(id);
  if (!result.ok) notFound();
  return <EvaluationReport evaluation={result.data} />;
}
