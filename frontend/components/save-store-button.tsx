"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { useSavedStores } from "@/components/saved-stores-provider";
import { HeartIcon } from "@/components/ui/icons";

type SaveStoreButtonProps = {
  storeSlug: string;
  className?: string;
};

export function SaveStoreButton({ storeSlug, className }: SaveStoreButtonProps) {
  const t = useTranslations("store");
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useCurrentUser();
  const { isSaved, save, unsave } = useSavedStores();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saved = isSaved(storeSlug);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (status !== "signed-in") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (saved) {
        await unsave(storeSlug);
      } else {
        await save(storeSlug);
      }
    } catch {
      // The optimistic update already reverted itself in SavedStoresProvider.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isSubmitting || status === "loading"}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? t("unsave") : t("save")}
      title={saved ? t("unsave") : t("save")}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-danger-700 focus-ring disabled:pointer-events-none disabled:opacity-50 ${saved ? "text-danger-600" : ""} ${className ?? ""}`}
    >
      <HeartIcon filled={saved} className="h-5 w-5" />
    </button>
  );
}
