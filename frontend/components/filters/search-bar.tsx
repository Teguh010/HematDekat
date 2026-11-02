"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildSearchParams, parseSearchParams } from "@/lib/search-params";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

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
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        id="home-search"
        type="search"
        value={value}
        onChange={(event) => handleQueryChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => handleQueryChange("")}
          aria-label={t("clearSearch")}
          className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}
