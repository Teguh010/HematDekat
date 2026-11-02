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
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      <p className="font-medium">{title ?? t("generic")}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry ?? (() => router.refresh())}>
        {t("retry")}
      </Button>
    </div>
  );
}
