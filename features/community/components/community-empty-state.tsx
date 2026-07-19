import Link from "next/link";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function CommunityEmptyState() {
  const t = useTranslations("community.empty");
  return (
    <EmptyState
      icon={Users}
      title={t("title")}
      description={t("description")}
      action={
        <Button asChild>
          <Link href="/app/notes">{t("cta")}</Link>
        </Button>
      }
    />
  );
}

export function ModerationEmptyState() {
  return (
    <EmptyState
      icon={Users}
      title="No pending notes"
      description="You're all caught up. New submissions from your board / class / medium will appear here."
    />
  );
}
