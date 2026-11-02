"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ApiError } from "@/lib/api-client";
import { listProducts, submitPriceReport, submitPromo } from "@/lib/data/repository";
import type { Product, ProductUnit, StoreType } from "@/lib/data/types";
import { formatRupiah } from "@/lib/format";
import { toDefaultUnitQuantity } from "@/lib/units";
import { PriceInput } from "@/components/report/price-input";
import { ProductSelect } from "@/components/report/product-select";
import { QuantityInput } from "@/components/report/quantity-input";
import { StorePicker } from "@/components/report/store-picker";

type StoreChoice = {
  storeSlug?: string;
  placeId?: string;
  storeType?: StoreType;
  name: string;
};

type ReportTab = "price" | "promo";

type FieldErrors = Record<string, string>;

const priceSchema = z
  .object({
    storeSlug: z.string().trim().min(1).optional(),
    placeId: z.string().trim().min(1).optional(),
    storeType: z.enum(["supermarket", "minimarket", "market", "grocery-stall"]).optional(),
    productSlug: z.string().trim().min(1),
    price: z.coerce.number().int().min(100).max(10_000_000),
    quantity: z.coerce.number().positive().refine((value) => Number(value.toFixed(3)) === value, {
      message: "Quantity must have at most 3 decimal places",
    }),
    unit: z.enum(["kg", "liter", "pcs", "pack", "tray"]),
  })
  .superRefine((value, ctx) => {
    const hasStoreSlug = Boolean(value.storeSlug);
    const hasPlaceId = Boolean(value.placeId);

    if (hasStoreSlug === hasPlaceId) {
      ctx.addIssue({
        code: "custom",
        message: "Exactly one of storeSlug or placeId is required",
        path: ["storeSlug"],
      });
    }

    if (value.placeId && !value.storeType) {
      ctx.addIssue({
        code: "custom",
        message: "storeType is required when placeId is provided",
        path: ["storeType"],
      });
    }
  });

const promoSchema = z
  .object({
    storeSlug: z.string().trim().min(1).optional(),
    placeId: z.string().trim().min(1).optional(),
    storeType: z.enum(["supermarket", "minimarket", "market", "grocery-stall"]).optional(),
    productSlug: z.string().trim().min(1),
    promoPrice: z.coerce.number().int().min(100).max(10_000_000).optional(),
    discountPct: z.coerce.number().int().min(1).max(99).optional(),
    conditions: z.string().max(200).optional(),
    validFrom: z.string().trim().min(1),
    validTo: z.string().trim().min(1),
  })
  .superRefine((value, ctx) => {
    const hasStoreSlug = Boolean(value.storeSlug);
    const hasPlaceId = Boolean(value.placeId);
    if (hasStoreSlug === hasPlaceId) {
      ctx.addIssue({ code: "custom", message: "Exactly one of storeSlug or placeId is required", path: ["storeSlug"] });
    }

    if (value.placeId && !value.storeType) {
      ctx.addIssue({ code: "custom", message: "storeType is required when placeId is provided", path: ["storeType"] });
    }

    const hasPromoPrice = value.promoPrice !== undefined;
    const hasDiscount = value.discountPct !== undefined;
    if (hasPromoPrice === hasDiscount) {
      ctx.addIssue({ code: "custom", message: "Pilih promo price atau discount percent", path: ["promoPrice"] });
    }

    if (value.validFrom > value.validTo) {
      ctx.addIssue({ code: "custom", message: "Tanggal akhir tidak boleh sebelum tanggal mulai", path: ["validTo"] });
    }
  });

function toFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  return Object.fromEntries(issues.map((issue) => [issue.path.join(".") || "field", issue.message]));
}

export function ReportForm() {
  const t = useTranslations("report");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ReportTab>(searchParams.get("tab") === "promo" ? "promo" : "price");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreChoice | null>(() => {
    const storeSlugFromQuery = searchParams.get("store");
    return storeSlugFromQuery ? { storeSlug: storeSlugFromQuery, name: t("storeSelected") } : null;
  });
  const [productSlug, setProductSlug] = useState(() => searchParams.get("product") ?? "");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<ProductUnit>("kg");
  const [promoPrice, setPromoPrice] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [conditions, setConditions] = useState("");
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(() => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate.toISOString().slice(0, 10);
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void listProducts().then((items) => setProducts(items));
  }, []);

  const activeProductSlug = productSlug || products[0]?.slug || "";
  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === activeProductSlug) ?? products[0] ?? null,
    [activeProductSlug, products],
  );

  const defaultUnit = selectedProduct?.defaultUnit ?? "kg";

  const handleProductChange = (nextSlug: string) => {
    setProductSlug(nextSlug);
    const nextProduct = products.find((product) => product.slug === nextSlug);
    if (nextProduct) {
      setUnit(nextProduct.defaultUnit);
    }
  };
  const normalizedQuantity = Number(quantity || 0) > 0 ? toDefaultUnitQuantity(Number(quantity), unit, defaultUnit) : 0;
  const unitPrice = Number(price || 0) > 0 && normalizedQuantity > 0 ? Math.round(Number(price) / normalizedQuantity) : 0;

  const resetForm = () => {
    setSelectedStore(null);
    setPrice("");
    setQuantity("1");
    setUnit(defaultUnit);
    setPromoPrice("");
    setDiscountPct("");
    setConditions("");
    setValidFrom(new Date().toISOString().slice(0, 10));
    setValidTo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setFieldErrors({});
    setServerError(null);
    setSubmitted(false);
    router.replace("/report");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      if (tab === "price") {
        const parsed = priceSchema.safeParse({
          storeSlug: selectedStore?.storeSlug,
          placeId: selectedStore?.placeId,
          storeType: selectedStore?.storeType,
          productSlug,
          price: Number(price),
          quantity: Number(quantity),
          unit,
        });

        if (!parsed.success) {
          setFieldErrors(toFieldErrors(parsed.error.issues));
          return;
        }

        await submitPriceReport(parsed.data);
      } else {
        const parsed = promoSchema.safeParse({
          storeSlug: selectedStore?.storeSlug,
          placeId: selectedStore?.placeId,
          storeType: selectedStore?.storeType,
          productSlug,
          promoPrice: promoPrice ? Number(promoPrice) : undefined,
          discountPct: discountPct ? Number(discountPct) : undefined,
          conditions: conditions.trim() || undefined,
          validFrom,
          validTo,
        });

        if (!parsed.success) {
          setFieldErrors(toFieldErrors(parsed.error.issues));
          return;
        }

        await submitPromo(parsed.data);
      }

      setSubmitted(true);
    } catch (caughtError: unknown) {
      if (caughtError instanceof ApiError) {
        setFieldErrors(caughtError.fieldErrors);
        setServerError(caughtError.message);
        return;
      }
      setServerError(t("noData"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStoreLabel = selectedStore?.name || t("storePlaceholder");

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("thanks")}</p>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("submissionPending")}</h1>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={resetForm} className="rounded-full bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950">
              {t("reportAgain")}
            </button>
            <Link href="/" className="rounded-full border border-white/10 bg-slate-900 px-4 py-2.5 font-medium text-slate-100">
              {t("backToMap")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("title")}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{t("reportFormTitle")}</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
          {t("backToMap")}
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
        <div className="mb-6 flex rounded-full border border-white/10 bg-slate-950/70 p-1">
          <button
            type="button"
            onClick={() => setTab("price")}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${tab === "price" ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}
          >
            {t("tabPrice")}
          </button>
          <button
            type="button"
            onClick={() => setTab("promo")}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${tab === "promo" ? "bg-emerald-500 text-slate-950" : "text-slate-300"}`}
          >
            {t("tabPromo")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <StorePicker value={selectedStore} onChange={setSelectedStore} error={fieldErrors.storeSlug || fieldErrors.placeId || fieldErrors.storeType} />

          {selectedStore && selectedStoreLabel ? (
            <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              {selectedStoreLabel}
            </div>
          ) : null}

          <ProductSelect products={products} value={activeProductSlug} onChange={handleProductChange} error={fieldErrors.productSlug} />

          {tab === "price" ? (
            <>
              <PriceInput value={price} onChange={setPrice} error={fieldErrors.price} />
              <QuantityInput
                value={quantity}
                unit={unit}
                onValueChange={setQuantity}
                onUnitChange={setUnit}
                error={fieldErrors.quantity || fieldErrors.unit}
              />
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">{t("livePreview")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {t("unitPriceLabel", { unit: defaultUnit, price: formatRupiah(unitPrice) })}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">{t("promoPrice")}</label>
                  <input
                    type="number"
                    min="0"
                    value={promoPrice}
                    onChange={(event) => setPromoPrice(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                    placeholder="14000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">{t("discountPct")}</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={discountPct}
                    onChange={(event) => setDiscountPct(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">{t("conditions")}</label>
                <textarea
                  maxLength={200}
                  value={conditions}
                  onChange={(event) => setConditions(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  placeholder={t("conditionsPlaceholder")}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">{t("validFrom")}</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(event) => setValidFrom(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200">{t("validTo")}</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(event) => setValidTo(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {serverError ? <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-200">{serverError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !selectedStore || !productSlug}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
