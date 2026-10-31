"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, onRetry }: ErrorStateProps) {
  const router = useRouter();
  const t = useTranslations("errors");

  return (
    <div role="alert" className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
      <p className="font-semibold">{title ?? t("generic")}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry ?? (() => router.refresh())}>
        {t("retry")}
      </Button>
    </div>
  );
}
