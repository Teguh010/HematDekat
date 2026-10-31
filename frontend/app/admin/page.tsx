"use client";

/* eslint-disable i18next/no-literal-string */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PendingItem = {
  id: string;
  kind: "price-report" | "promo";
  product: string;
  store: string;
  reporter?: string;
  submitter?: string;
  price?: number;
  promoPrice?: number | null;
  discountPct?: number | null;
  normalizedUnitPrice?: number;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/admin/pending`, {
        credentials: "include",
      });

      if (!response.ok) {
        setError(t("accessRequired"));
        setItems([]);
        return;
      }

      const payload = (await response.json()) as { items?: PendingItem[] };
      setItems(payload.items ?? []);
      setError(null);
    } catch {
      setError(t("loadFailure"));
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

  const handleDecision = async (item: PendingItem, status: "APPROVED" | "REJECTED") => {
    const endpoint = item.kind === "price-report" ? `price-reports/${item.id}/status` : `promos/${item.id}/status`;

    const response = await fetch(`${backendBaseUrl}/admin/${endpoint}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError(t("statusFailure"));
      return;
    }

    await loadItems();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
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

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-slate-300">{t("loading")}</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-slate-300">{t("noItems")}</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const formattedPrice = item.price
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(item.price)
              : item.promoPrice
                ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(item.promoPrice)
                : "-";

            return (
              <div key={`${item.kind}-${item.id}`} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{item.store}</p>
                  <p className="text-sm text-slate-400">
                    {item.product} • {formattedPrice} • {item.kind === "price-report" ? item.reporter ?? t("reporter") : item.submitter ?? t("submitter")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-300">{t("pending")}</span>
                  <button
                    type="button"
                    onClick={() => void handleDecision(item, "APPROVED")}
                    className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                  >
                    {t("approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision(item, "REJECTED")}
                    className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
