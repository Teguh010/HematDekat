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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">{t("store")}</label>
      <input
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
        className={`w-full rounded-xl border bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
          error || searchError ? "border-red-500/30 bg-red-500/5" : "border-white/10"
        }`}
        placeholder={t("storePlaceholder")}
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length > 0 ? "store-suggestions" : undefined}
        aria-autocomplete="list"
      />
      {value?.storeSlug ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100">
          <span>{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-emerald-200 hover:text-white">
            {t("changeStore")}
          </button>
        </div>
      ) : null}
      {suggestions.length > 0 ? (
        <ul id="store-suggestions" className="rounded-xl border border-white/10 bg-slate-900 p-1 shadow-lg shadow-slate-950/40">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => void handleSelect(suggestion)}
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                <span className="font-medium">{suggestion.mainText}</span>
                {suggestion.secondaryText ? <span className="text-xs text-slate-400">{suggestion.secondaryText}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error || searchError ? <p className="text-sm text-red-200">{error ?? searchError}</p> : null}
    </div>
  );
}
