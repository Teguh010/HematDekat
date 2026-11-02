"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
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
  const conditionsId = useId();

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
      active ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-white"
    }`;

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-sm font-medium text-emerald-700">{t("thanks")}</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{t("submissionPending")}</h1>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={resetForm}>{t("reportAgain")}</Button>
            <Button href="/" variant="secondary">
              {t("backToMap")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{t("reportFormTitle")}</h1>
        <Button href="/" variant="secondary" size="sm">
          {t("backToMap")}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div role="group" aria-label={t("title")} className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          <button type="button" aria-pressed={tab === "price"} onClick={() => setTab("price")} className={tabClass(tab === "price")}>
            {t("tabPrice")}
          </button>
          <button type="button" aria-pressed={tab === "promo"} onClick={() => setTab("promo")} className={tabClass(tab === "promo")}>
            {t("tabPromo")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <StorePicker value={selectedStore} onChange={setSelectedStore} error={fieldErrors.storeSlug || fieldErrors.placeId || fieldErrors.storeType} />

          {selectedStore && selectedStoreLabel && !selectedStore.storeSlug ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
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
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2" aria-live="polite">
                <p className="text-xs font-medium text-emerald-800">{t("livePreview")}</p>
                <p className="text-base font-semibold text-emerald-700">
                  {t("unitPriceLabel", { unit: defaultUnit, price: formatRupiah(unitPrice) })}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={t("promoPrice")}
                  type="number"
                  min="0"
                  value={promoPrice}
                  onChange={(event) => setPromoPrice(event.target.value)}
                  error={fieldErrors.promoPrice}
                  placeholder="14000"
                />
                <TextField
                  label={t("discountPct")}
                  type="number"
                  min="1"
                  max="99"
                  value={discountPct}
                  onChange={(event) => setDiscountPct(event.target.value)}
                  error={fieldErrors.discountPct}
                  placeholder="10"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor={conditionsId} className="block text-xs font-medium text-slate-700">
                  {t("conditions")}
                </label>
                <textarea
                  id={conditionsId}
                  maxLength={200}
                  value={conditions}
                  onChange={(event) => setConditions(event.target.value)}
                  className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  placeholder={t("conditionsPlaceholder")}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={t("validFrom")}
                  type="date"
                  value={validFrom}
                  onChange={(event) => setValidFrom(event.target.value)}
                  error={fieldErrors.validFrom}
                />
                <TextField
                  label={t("validTo")}
                  type="date"
                  value={validTo}
                  onChange={(event) => setValidTo(event.target.value)}
                  error={fieldErrors.validTo}
                />
              </div>
            </div>
          )}

          {serverError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting || !selectedStore || !productSlug} className="w-full">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
