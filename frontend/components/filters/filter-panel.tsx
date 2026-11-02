"use client";

/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { fieldClass } from "@/components/ui/field-styles";
import { CloseIcon, FilterIcon } from "@/components/ui/icons";
import {
  buildSearchParams,
  parseSearchParams,
  type StoreSearchParams,
  type StoreType,
} from "@/lib/search-params";

type DraftState = {
  type: StoreType[];
  maxPrice?: number;
  promo: boolean;
  fresh?: 3 | 14 | 30;
  sort: "cheapest" | "nearest" | "recent";
};

function draftFromParams(params: StoreSearchParams): DraftState {
  return {
    type: params.type ?? [],
    maxPrice: params.maxPrice,
    promo: params.promo ?? false,
    fresh: params.fresh,
    sort: params.sort ?? "cheapest",
  };
}

export function FilterPanel() {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => draftFromParams(parsed));

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);
  const openPanel = () => {
    setDraft(draftFromParams(parsed));
    setOpen(true);
  };

  const applyFilters = () => {
    const nextQuery = buildSearchParams({
      ...parsed,
      type: draft.type.length > 0 ? draft.type : undefined,
      maxPrice: draft.maxPrice,
      promo: draft.promo,
      fresh: draft.fresh,
      sort: draft.sort,
    });

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    setOpen(false);
  };

  const resetFilters = () => {
    const nextDraft: DraftState = { type: [], maxPrice: undefined, promo: false, fresh: undefined, sort: "cheapest" };
    setDraft(nextDraft);

    const nextQuery = buildSearchParams({
      ...parsed,
      type: undefined,
      maxPrice: undefined,
      promo: false,
      fresh: undefined,
      sort: "cheapest",
    });

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={t("title")}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-ink-300 bg-surface px-2 text-sm text-ink-700 hover:bg-ink-50 focus-ring sm:px-3"
      >
        <FilterIcon />
        <span className="hidden sm:inline">{t("title")}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-ink-900/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col rounded-t-xl border-t border-ink-200 bg-surface text-ink-900 shadow-sm lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[360px] lg:rounded-none lg:border-l lg:border-t-0"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-ink-200 px-4 py-3">
              <h2 className="text-base font-semibold text-ink-900">{t("title")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-ring"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <p className="mb-2 text-sm font-medium text-ink-900">{t("storeType")}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["supermarket", t("types.supermarket")],
                    ["minimarket", t("types.minimarket")],
                    ["market", t("types.market")],
                    ["grocery-stall", t("types.groceryStall")],
                  ].map(([value, label]) => {
                    const checked = draft.type.includes(value as StoreType);
                    return (
                      <label
                        key={value}
                        className={`flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${
                          checked
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : "border-ink-200 bg-surface text-ink-700 hover:bg-ink-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-600"
                          checked={checked}
                          onChange={() => {
                            setDraft((previous) => ({
                              ...previous,
                              type: checked
                                ? previous.type.filter((item) => item !== value)
                                : [...previous.type, value as StoreType],
                            }));
                          }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="filter-max-price" className="mb-2 block text-sm font-medium text-ink-900">
                  {t("maxPrice")}
                </label>
                <input
                  id="filter-max-price"
                  type="text"
                  inputMode="numeric"
                  value={draft.maxPrice == null ? "" : draft.maxPrice.toLocaleString("id-ID")}
                  onChange={(event) => {
                    const digits = Number(event.target.value.replace(/[^\d]/g, ""));
                    setDraft((previous) => ({
                      ...previous,
                      maxPrice: Number.isFinite(digits) && digits > 0 ? digits : undefined,
                    }));
                  }}
                  placeholder="250.000"
                  className={fieldClass()}
                />
              </div>

              <label className="flex h-9 items-center justify-between gap-4 rounded-lg border border-ink-300 bg-surface px-3 text-sm text-ink-700">
                <span>{t("promoOnly")}</span>
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={draft.promo}
                  onChange={(event) => setDraft((previous) => ({ ...previous, promo: event.target.checked }))}
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-900">{t("freshness")}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {[{ value: undefined, label: t("freshnessOptions.all") }, { value: 3, label: t("freshnessOptions.3") }, { value: 14, label: t("freshnessOptions.14") }, { value: 30, label: t("freshnessOptions.30") }].map((option) => (
                    <label key={String(option.value ?? "all")} className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="radio"
                        name="freshness"
                        className="accent-brand-600"
                        checked={draft.fresh === option.value}
                        onChange={() => setDraft((previous) => ({ ...previous, fresh: option.value as 3 | 14 | 30 | undefined }))}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-900">{t("sort")}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {[
                    ["cheapest", t("sortOptions.cheapest")],
                    ["nearest", t("sortOptions.nearest")],
                    ["recent", t("sortOptions.recent")],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="radio"
                        name="sort"
                        className="accent-brand-600"
                        checked={draft.sort === value}
                        onChange={() => setDraft((previous) => ({ ...previous, sort: value as "cheapest" | "nearest" | "recent" }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-ink-200 bg-surface p-3">
              <button
                type="button"
                onClick={applyFilters}
                className="h-9 flex-1 rounded-full bg-brand-600 px-4 text-sm font-medium text-on-brand hover:bg-brand-700 focus-ring"
              >
                {t("apply")}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 rounded-lg border border-ink-300 bg-surface px-4 text-sm font-medium text-ink-700 hover:bg-ink-50 focus-ring"
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
