"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { City } from "@/lib/data/types";
import { buildSearchParams, parseSearchParams } from "@/lib/search-params";

export function CitySelect({ cities }: { cities: City[] }) {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const selectedCity = parsed.city ?? "all";

  const handleChange = (nextCity: string) => {
    const nextQuery = buildSearchParams({ ...parsed, city: nextCity === "all" ? undefined : nextCity });
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t("cityLabel")}</span>
      <select
        value={selectedCity}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        <option value="all">{t("cityLabel")}</option>
        {cities.map((city) => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}
