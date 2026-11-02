"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ModerationFilterToggle } from "@/components/admin/moderation-filter-toggle";
import { PendingItemCard } from "@/components/admin/pending-item-card";
import { RequireUser } from "@/components/auth/require-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { listPendingItems, setModerationStatus } from "@/lib/data/repository";
import type { PendingItem } from "@/lib/data/types";

export default function AdminPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const nextItems = await listPendingItems();
      setItems(nextItems);
      setError(null);
    } catch {
      setError(t("accessRequired"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // This is a client-side fetch for the authenticated admin queue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  const visibleItems = useMemo(
    () => (onlyFlagged ? items.filter((item) => item.flagged) : items),
    [items, onlyFlagged],
  );

  const handleDecision = async (item: PendingItem, status: "approved" | "rejected") => {
    const key = `${item.kind}-${item.id}`;
    setSubmittingKey(key);

    try {
      await setModerationStatus(item.kind, item.id, status);
      await loadItems();
    } catch {
      setError(t("statusFailure"));
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <RequireUser role="admin">
      <PageContainer size="lg">
        <PageHeader
          title={t("title")}
          actions={
            <Button href="/" variant="secondary" size="sm">
              {t("backToMap")}
            </Button>
          }
        />

        {error ? (
          <div role="alert" className="mb-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800">{error}</div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mb-3">
            <ModerationFilterToggle checked={onlyFlagged} onChange={setOnlyFlagged} />
          </div>
        ) : null}

        {loading ? (
          <Card className="text-sm text-ink-500">
            <div role="status">{t("loading")}</div>
          </Card>
        ) : visibleItems.length === 0 ? (
          <Card className="text-center text-sm text-ink-500">
            {onlyFlagged ? t("noFlaggedItems") : t("noItems")}
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const key = `${item.kind}-${item.id}`;

              return (
                <PendingItemCard
                  key={key}
                  item={item}
                  isSubmitting={submittingKey === key}
                  onApprove={() => void handleDecision(item, "approved")}
                  onReject={() => void handleDecision(item, "rejected")}
                />
              );
            })}
          </div>
        )}
      </PageContainer>
    </RequireUser>
  );
}
