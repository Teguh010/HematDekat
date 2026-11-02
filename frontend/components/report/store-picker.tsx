"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { fieldClass } from "@/components/ui/field-styles";
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
      <label htmlFor="report-store-input" className="block text-xs font-medium text-ink-700">{t("store")}</label>
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
        className={fieldClass({ error: Boolean(error || searchError) })}
        placeholder={t("storePlaceholder")}
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length > 0 ? "store-suggestions" : undefined}
        aria-autocomplete="list"
      />
      {value?.storeSlug ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
          <span>{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="font-medium text-brand-700 hover:text-brand-900 focus-ring">
            {t("changeStore")}
          </button>
        </div>
      ) : null}
      {suggestions.length > 0 ? (
        <ul id="store-suggestions" className="rounded-lg border border-ink-200 bg-surface p-1 shadow-sm">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => void handleSelect(suggestion)}
                className="flex w-full flex-col items-start rounded-md px-3 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50 focus-ring"
              >
                <span className="font-medium text-ink-900">{suggestion.mainText}</span>
                {suggestion.secondaryText ? <span className="text-xs text-ink-500">{suggestion.secondaryText}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error || searchError ? <p className="text-xs text-danger-700">{error ?? searchError}</p> : null}
    </div>
  );
}
