"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildSearchParams, parseSearchParams } from "@/lib/search-params";
import { LocateIcon } from "@/components/ui/icons";

export function LocateMeButton() {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    if (!navigator.geolocation) {
      setMessage(t("locationDenied"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextQuery = buildSearchParams({
          ...parsed,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          sort: "nearest",
          bbox: undefined,
        });

        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        setMessage(null);
      },
      () => {
        setMessage(t("locationDenied"));
      },
      { timeout: 10_000 },
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={t("locateMe")}
        title={t("locateMe")}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:px-3"
      >
        <LocateIcon />
        <span className="hidden sm:inline">{t("locateMe")}</span>
      </button>
      {message ? (
        <span role="status" className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 shadow-sm">
          {message}
        </span>
      ) : null}
    </div>
  );
}
