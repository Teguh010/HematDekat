"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildSearchParams, parseSearchParams } from "@/lib/search-params";

export function SearchBar() {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const [value, setValue] = useState(() => parsed.q ?? "");

  const handleQueryChange = (nextValue: string) => {
    setValue(nextValue);
    const trimmed = nextValue.trim();
    const nextQuery = buildSearchParams({ ...parsed, q: trimmed || undefined });
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <div className="relative flex-1">
      <input
        id="home-search"
        type="search"
        value={value}
        onChange={(event) => handleQueryChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      />
      {value ? (
        <button
          type="button"
          onClick={() => handleQueryChange("")}
          aria-label={t("clearSearch")}
          className="absolute inset-y-0 right-3 flex items-center text-lg text-slate-300 hover:text-white"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
