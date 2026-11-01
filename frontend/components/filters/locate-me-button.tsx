"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildSearchParams, parseSearchParams } from "@/lib/search-params";

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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400"
      >
        {t("locateMe")}
      </button>
      {message ? <span className="text-xs text-amber-300">{message}</span> : null}
    </div>
  );
}
