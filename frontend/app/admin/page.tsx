"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ModerationFilterToggle } from "@/components/admin/moderation-filter-toggle";
import { PendingItemCard } from "@/components/admin/pending-item-card";
import { RequireUser } from "@/components/auth/require-user";
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("title")}</p>
            <h1 className="mt-2 text-3xl font-bold text-white">{t("title")}</h1>
          </div>
          <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
            {t("backToMap")}
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mb-4">
            <ModerationFilterToggle checked={onlyFlagged} onChange={setOnlyFlagged} />
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-slate-300">{t("loading")}</div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-slate-300">
            {onlyFlagged ? t("noFlaggedItems") : t("noItems")}
          </div>
        ) : (
          <div className="space-y-4">
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
      </main>
    </RequireUser>
  );
}
