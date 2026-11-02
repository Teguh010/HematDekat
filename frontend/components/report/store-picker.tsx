"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ApiError } from "@/lib/api-client";
import { autocompletePlaces, lookupPlace } from "@/lib/data/repository";
import type { PlaceSuggestion, StoreType } from "@/lib/data/types";

type StoreChoice = {
  storeSlug?: string;
  placeId?: string;
  storeType?: StoreType;
  name: string;
};

type StorePickerProps = {
  value: StoreChoice | null;
  onChange: (nextValue: StoreChoice | null) => void;
  error?: string;
};

export function StorePicker({ value, onChange, error }: StorePickerProps) {
  const t = useTranslations("report");
  const [query, setQuery] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const autocompleteTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (autocompleteTimer.current) {
        window.clearTimeout(autocompleteTimer.current);
      }
    };
  }, []);

  const startSearch = () => {
    setSessionToken((current) => current ?? crypto.randomUUID());
    setSearchError(null);
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    const token = sessionToken ?? crypto.randomUUID();
    try {
      const place = await lookupPlace(suggestion.placeId, token);
      const nextValue = place.existingStoreSlug
        ? { storeSlug: place.existingStoreSlug, storeType: place.suggestedType, name: place.name }
        : { placeId: place.placeId, storeType: place.suggestedType, name: place.name };

      onChange(nextValue);
      setQuery(place.name);
      setSuggestions([]);
      setSessionToken(crypto.randomUUID());
      setSearchError(null);
    } catch (caughtError: unknown) {
      if (caughtError instanceof ApiError && caughtError.status === 503) {
        setSearchError(t("searchUnavailable"));
        return;
      }
      setSearchError(t("genericError"));
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor="report-store-input" className="block text-xs font-medium text-slate-700">{t("store")}</label>
      <input
        id="report-store-input"
        value={query}
        onFocus={startSearch}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);

          if (nextQuery.trim().length < 3) {
            setSuggestions([]);
            return;
          }

          const nextToken = sessionToken ?? crypto.randomUUID();
          setSessionToken(nextToken);
          if (autocompleteTimer.current) {
            window.clearTimeout(autocompleteTimer.current);
          }

          autocompleteTimer.current = window.setTimeout(() => {
            void autocompletePlaces({ input: nextQuery.trim(), sessionToken: nextToken })
              .then((items) => {
                setSuggestions(items.slice(0, 5));
                setSearchError(null);
              })
              .catch((caughtError: unknown) => {
                if (caughtError instanceof ApiError && caughtError.status === 503) {
                  setSearchError(t("searchUnavailable"));
                  return;
                }
                setSearchError(t("genericError"));
              });
          }, 300);
        }}
        aria-invalid={Boolean(error || searchError)}
        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
          error || searchError ? "border-red-300 bg-red-50" : "border-slate-300"
        }`}
        placeholder={t("storePlaceholder")}
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length > 0 ? "store-suggestions" : undefined}
        aria-autocomplete="list"
      />
      {value?.storeSlug ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
          <span>{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="font-medium text-emerald-700 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            {t("changeStore")}
          </button>
        </div>
      ) : null}
      {suggestions.length > 0 ? (
        <ul id="store-suggestions" className="rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => void handleSelect(suggestion)}
                className="flex w-full flex-col items-start rounded-md px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <span className="font-medium text-slate-900">{suggestion.mainText}</span>
                {suggestion.secondaryText ? <span className="text-xs text-slate-500">{suggestion.secondaryText}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error || searchError ? <p className="text-xs text-red-700">{error ?? searchError}</p> : null}
    </div>
  );
}
