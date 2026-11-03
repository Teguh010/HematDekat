"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { RequireUser } from "@/components/auth/require-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkCard } from "@/components/ui/link-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getProfile } from "@/lib/data/repository";
import type { Profile, ProfileReportStatus } from "@/lib/data/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const statusVariant: Record<ProfileReportStatus, "success" | "warning" | "danger"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setError(null);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Client-side fetch for the authenticated profile summary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <RequireUser>
      <PageContainer size="md">
        <PageHeader
          title={t("title")}
          actions={
            <Button href="/" variant="secondary" size="sm">
              {t("backToMap")}
            </Button>
          }
        />

        {error ? (
          <div role="alert" className="mb-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <Card className="text-sm text-ink-500">
            <div role="status">{t("loading")}</div>
          </Card>
        ) : profile ? (
          <div className="space-y-4">
            <Section title={t("pointsTitle")}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-brand-700">{t("points", { points: profile.user.points })}</span>
                <Badge variant={profile.rank !== null ? "success" : "muted"}>
                  {profile.rank !== null ? t("rankLabel", { rank: profile.rank }) : t("noRank")}
                </Badge>
              </div>
            </Section>

            <Section title={t("badgesTitle")}>
              {profile.badges.length === 0 ? (
                <p className="text-sm text-ink-500">{t("noBadges")}</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {profile.badges.map((badge) => (
                    <li key={badge.key} className="rounded-lg border border-ink-200 p-3">
                      <p className="text-sm font-semibold text-ink-900">{t(`badgeNames.${badge.key}`)}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{t(`badgeDescriptions.${badge.key}`)}</p>
                      <p className="mt-1 text-xs text-ink-400">{formatDate(badge.earnedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t("savedStoresTitle")}>
              {profile.savedStores.length === 0 ? (
                <EmptyState title={t("noSavedStores")} />
              ) : (
                <ul className="space-y-2">
                  {profile.savedStores.map((store) => (
                    <li key={store.id}>
                      <LinkCard href={`/stores/${store.slug}`}>
                        <p className="text-sm font-medium text-ink-900">{store.name}</p>
                      </LinkCard>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t("reportsTitle")}>
              {profile.reports.length === 0 ? (
                <EmptyState title={t("noReports")} />
              ) : (
                <ul className="space-y-2">
                  {profile.reports.map((report) => (
                    <li
                      key={`${report.kind}-${report.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{report.store.name}</p>
                        <p className="text-xs text-ink-500">
                          {t(`kind.${report.kind}`)} &middot; {report.product.name} &middot; {formatDate(report.createdAt)}
                        </p>
                      </div>
                      <Badge variant={statusVariant[report.status]}>{t(`status.${report.status}`)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        ) : null}
      </PageContainer>
    </RequireUser>
  );
}
