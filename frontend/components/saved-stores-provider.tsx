"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { listSavedStores, saveStore, unsaveStore } from "@/lib/data/repository";

type SavedStoresValue = {
  savedSlugs: Set<string> | null;
  isSaved: (storeSlug: string) => boolean;
  save: (storeSlug: string) => Promise<void>;
  unsave: (storeSlug: string) => Promise<void>;
};

const SavedStoresContext = createContext<SavedStoresValue | null>(null);

export function SavedStoresProvider({ children }: { children: ReactNode }) {
  const { status } = useCurrentUser();
  const [savedSlugs, setSavedSlugs] = useState<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const stores = await listSavedStores();
      setSavedSlugs(new Set(stores.map((store) => store.slug)));
    } catch {
      setSavedSlugs(null);
    }
  }, []);

  useEffect(() => {
    if (status === "signed-in") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the saved list once per session
      void refresh();
    } else {
      setSavedSlugs(null);
    }
  }, [status, refresh]);

  const save = useCallback(async (storeSlug: string) => {
    setSavedSlugs((current) => new Set(current).add(storeSlug));
    try {
      await saveStore(storeSlug);
    } catch (error) {
      setSavedSlugs((current) => {
        const next = new Set(current);
        next.delete(storeSlug);
        return next;
      });
      throw error;
    }
  }, []);

  const unsave = useCallback(async (storeSlug: string) => {
    setSavedSlugs((current) => {
      const next = new Set(current);
      next.delete(storeSlug);
      return next;
    });
    try {
      await unsaveStore(storeSlug);
    } catch (error) {
      setSavedSlugs((current) => new Set(current).add(storeSlug));
      throw error;
    }
  }, []);

  const isSaved = useCallback((storeSlug: string) => savedSlugs?.has(storeSlug) ?? false, [savedSlugs]);

  return <SavedStoresContext value={{ savedSlugs, isSaved, save, unsave }}>{children}</SavedStoresContext>;
}

export function useSavedStores(): SavedStoresValue {
  const value = use(SavedStoresContext);
  if (!value) throw new Error("useSavedStores must be used inside SavedStoresProvider");
  return value;
}
