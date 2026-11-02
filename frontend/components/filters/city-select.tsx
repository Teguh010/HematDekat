"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { City } from "@/lib/data/types";
import { Select } from "@/components/ui/select";
import { buildSearchParams, parseSearchParams } from "@/lib/search-params";

export function CitySelect({ cities }: { cities: City[] }) {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const selectedCity = parsed.city ?? "all";

  const handleChange = (nextCity: string) => {
    const nextQuery = buildSearchParams({
      ...parsed,
      city: nextCity === "all" ? undefined : nextCity,
      bbox: undefined,
      lat: undefined,
      lng: undefined,
    });
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t("cityLabel")}</span>
      <Select
        fieldSize="sm"
        width="auto"
        value={selectedCity}
        onChange={(event) => handleChange(event.target.value)}
      >
        <option value="all">{t("cityLabel")}</option>
        {cities.map((city) => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
