"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/select";
import type { City, LeaderboardPeriod } from "@/lib/data/types";

type LeaderboardCitySelectProps = {
  cities: City[];
  period: LeaderboardPeriod;
  selectedCity?: string;
};

export function LeaderboardCitySelect({ cities, period, selectedCity }: LeaderboardCitySelectProps) {
  const t = useTranslations("leaderboard");
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(nextCity: string) {
    const search = new URLSearchParams();
    if (period !== "all") {
      search.set("period", period);
    }
    if (nextCity !== "all") {
      search.set("city", nextCity);
    }
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t("cityLabel")}</span>
      <Select
        fieldSize="sm"
        width="auto"
        value={selectedCity ?? "all"}
        onChange={(event) => handleChange(event.target.value)}
      >
        <option value="all">{t("allCities")}</option>
        {cities.map((city) => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
