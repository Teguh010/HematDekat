"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { apiFetch } from "@/lib/api-client";
import { formatRupiah } from "@/lib/format";

const pendingItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["price-report", "promo"]),
  product: z.object({
    slug: z.string(),
    name: z.string(),
    defaultUnit: z.enum(["kg", "liter", "pcs", "pack", "tray"]),
  }),
  store: z.object({ slug: z.string(), name: z.string() }),
  submittedBy: z.string(),
  price: z.number().nullable(),
  quantity: z.number().nullable(),
  normalizedUnitPrice: z.number().nullable(),
  promoPrice: z.number().nullable(),
  discountPct: z.number().nullable(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  flagged: z.boolean(),
  flagReason: z.string().nullable(),
  createdAt: z.string(),
});

const pendingListSchema = z.object({ items: z.array(pendingItemSchema).default([]) });

type PendingItem = z.infer<typeof pendingItemSchema>;

export default function AdminPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const payload = await apiFetch("/admin/pending", { schema: pendingListSchema });
      setItems(payload.items);
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

  const handleDecision = async (item: PendingItem, status: "approved" | "rejected") => {
    const endpoint = item.kind === "price-report" ? `price-reports/${item.id}/status` : `promos/${item.id}/status`;

    try {
      await apiFetch(`/admin/${endpoint}`, {
        method: "PATCH",
        body: { status },
        schema: z.object({ id: z.string(), status: z.enum(["approved", "rejected"]) }),
      });
      await loadItems();
    } catch {
      setError(t("statusFailure"));
    }
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
            const amount = item.price ?? item.promoPrice;
            const formattedPrice = amount === null ? "-" : formatRupiah(amount);

            return (
              <div key={`${item.kind}-${item.id}`} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{item.store.name}</p>
                  <p className="text-sm text-slate-400">
                    {item.product.name} • {formattedPrice} • {item.submittedBy}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-300">{t("pending")}</span>
                  <button
                    type="button"
                    onClick={() => void handleDecision(item, "approved")}
                    className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                  >
                    {t("approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision(item, "rejected")}
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
