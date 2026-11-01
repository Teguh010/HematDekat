"use client";

/* eslint-disable i18next/no-literal-string */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
        className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400"
      >
        {t("title")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-900 p-4 text-slate-50 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[420px] lg:rounded-l-3xl lg:rounded-tr-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-300">
                {t("close")}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm font-medium text-slate-200">{t("storeType")}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["supermarket", t("types.supermarket")],
                    ["minimarket", t("types.minimarket")],
                    ["market", t("types.market")],
                    ["grocery-stall", t("types.groceryStall")],
                  ].map(([value, label]) => {
                    const checked = draft.type.includes(value as StoreType);
                    return (
                      <label key={value} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
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
                <label htmlFor="filter-max-price" className="mb-3 block text-sm font-medium text-slate-200">
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
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                />
              </div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-slate-200">
                <span>{t("promoOnly")}</span>
                <input
                  type="checkbox"
                  checked={draft.promo}
                  onChange={(event) => setDraft((previous) => ({ ...previous, promo: event.target.checked }))}
                />
              </label>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-200">{t("freshness")}</p>
                <div className="space-y-2">
                  {[{ value: undefined, label: t("freshnessOptions.all") }, { value: 3, label: t("freshnessOptions.3") }, { value: 14, label: t("freshnessOptions.14") }, { value: 30, label: t("freshnessOptions.30") }].map((option) => (
                    <label key={String(option.value ?? "all")} className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="freshness"
                        checked={draft.fresh === option.value}
                        onChange={() => setDraft((previous) => ({ ...previous, fresh: option.value as 3 | 14 | 30 | undefined }))}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-200">{t("sort")}</p>
                <div className="space-y-2">
                  {[
                    ["cheapest", t("sortOptions.cheapest")],
                    ["nearest", t("sortOptions.nearest")],
                    ["recent", t("sortOptions.recent")],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="sort"
                        checked={draft.sort === value}
                        onChange={() => setDraft((previous) => ({ ...previous, sort: value as "cheapest" | "nearest" | "recent" }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950"
              >
                {t("apply")}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-slate-200"
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
