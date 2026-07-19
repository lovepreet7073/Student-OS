import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFileMetadata } from "@/features/study-space/actions/get-item";
import { FileDetailView } from "@/features/study-space/components/file-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fileId: string }>;
}): Promise<Metadata> {
  const { fileId } = await params;
  const result = await getFileMetadata(fileId);
  return { title: result.ok ? result.data.fileName : "File" };
}

export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;
  const result = await getFileMetadata(fileId);
  if (!result.ok) notFound();
  return <FileDetailView file={result.data} />;
}
