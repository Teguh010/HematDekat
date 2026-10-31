"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

import { apiFetch } from "@/lib/api-client";
import { currentUserSchema, type CurrentUser } from "@/lib/data/types";

type CurrentUserState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: CurrentUser };

type CurrentUserValue = CurrentUserState & { refresh: () => Promise<void> };

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurrentUserState>({ status: "loading", user: null });

  const refresh = useCallback(async () => {
    try {
      const user = await apiFetch("/auth/me", { schema: currentUserSchema });
      setState({ status: "signed-in", user });
    } catch {
      setState({ status: "signed-out", user: null });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the session once on mount
    void refresh();
  }, [refresh]);

  return <CurrentUserContext value={{ ...state, refresh }}>{children}</CurrentUserContext>;
}

export function useCurrentUser(): CurrentUserValue {
  const value = use(CurrentUserContext);
  if (!value) throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  return value;
}
