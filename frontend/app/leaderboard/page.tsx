import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeaderboardCitySelect } from "@/components/leaderboard/leaderboard-city-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api-client";
import { getLeaderboard, listCities } from "@/lib/data/repository";
import { leaderboardPeriodSchema, type LeaderboardPeriod } from "@/lib/data/types";

type LeaderboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSingleString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(value: string | string[] | undefined): LeaderboardPeriod {
  const result = leaderboardPeriodSchema.safeParse(toSingleString(value));
  return result.success ? result.data : "all";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leaderboard");

  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  return (
    <Suspense fallback={<LeaderboardPageFallback />}>
      <LeaderboardPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LeaderboardPageFallback() {
  const t = await getTranslations("leaderboard");
  return <div className="p-8 text-center text-sm text-ink-500">{t("loading")}</div>;
}

async function LeaderboardPageContent({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const t = await getTranslations("leaderboard");

  const period = parsePeriod(params.period);
  const city = toSingleString(params.city);

  let items;
  try {
    items = await getLeaderboard({ period, city });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const cities = await listCities();

  const periodHref = (nextPeriod: LeaderboardPeriod) => {
    const search = new URLSearchParams();
    if (nextPeriod !== "all") {
      search.set("period", nextPeriod);
    }
    if (city) {
      search.set("city", city);
    }
    const query = search.toString();
    return query ? `/leaderboard?${query}` : "/leaderboard";
  };

  return (
    <PageContainer size="md">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button href="/" variant="secondary" size="sm">
            {t("backToMap")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip href={periodHref("week")} active={period === "week"}>
            {t("periodWeek")}
          </Chip>
          <Chip href={periodHref("month")} active={period === "month"}>
            {t("periodMonth")}
          </Chip>
          <Chip href={periodHref("all")} active={period === "all"}>
            {t("periodAll")}
          </Chip>
        </div>

        <LeaderboardCitySelect cities={cities} period={period} selectedCity={city} />
      </div>

      {items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.userId}>
              <Card padding="sm" className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant={item.rank <= 3 ? "success" : "muted"}>{t("rank", { rank: item.rank })}</Badge>
                  <span className="text-sm font-medium text-ink-900">{item.displayName}</span>
                </div>
                <span className="text-sm font-semibold text-brand-700">{t("points", { points: item.points })}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
