"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { castVote } from "@/lib/data/repository";

type VoteButtonProps = {
  priceReportId?: string;
  promoId?: string;
  count: number;
  isConfirmed?: boolean;
  className?: string;
};

export function getVoteButtonLabel({ count: _count, isConfirmed }: { count: number; isConfirmed: boolean }) {
  void _count;
  return isConfirmed ? "Terkonfirmasi" : "Harga masih sama";
}

export function getVoteButtonCaption({ count, isConfirmed }: { count: number; isConfirmed?: boolean }) {
  void isConfirmed;
  return `${count} konfirmasi`;
}

export function VoteButton({
  priceReportId,
  promoId,
  count,
  isConfirmed = false,
  className,
}: VoteButtonProps) {
  const t = useTranslations("vote");
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useCurrentUser();
  const [localCount, setLocalCount] = useState(count);
  const [confirmed, setConfirmed] = useState(isConfirmed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!priceReportId && !promoId) {
    return null;
  }

  const handleVote = async () => {
    if (status !== "signed-in") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (confirmed || isSubmitting) {
      return;
    }

    const previousCount = localCount;
    setError(null);
    setIsSubmitting(true);
    setLocalCount((current) => current + 1);

    try {
      const result = await castVote({ priceReportId, promoId });
      setLocalCount(result.confirmationCount);
      setConfirmed(true);
      router.refresh();
    } catch (caught) {
      setLocalCount(previousCount);

      if (caught instanceof ApiError) {
        if (caught.status === 403) {
          setError(t("selfVote"));
          return;
        }

        if (caught.status === 409) {
          setConfirmed(true);
          setLocalCount((current) => Math.max(current, previousCount + 1));
          router.refresh();
          return;
        }
      }

      setError(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const label = confirmed ? t("confirmed") : t("confirm");

  return (
    <div className={`flex flex-col items-end gap-0.5 ${className ?? ""}`}>
      <Button
        type="button"
        variant={confirmed ? "secondary" : "primary"}
        size="sm"
        disabled={isSubmitting || confirmed || status === "loading"}
        onClick={handleVote}
        className="whitespace-nowrap"
      >
        {isSubmitting ? t("submitting") : label}
      </Button>
      <span className="text-xs text-slate-500">{t("count", { count: localCount })}</span>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
