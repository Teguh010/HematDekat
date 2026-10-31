"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type AppHeaderProps = {
  currentUser: AppUser | null;
  onLogout: () => Promise<void> | void;
};

export function AppHeader({ currentUser, onLogout }: AppHeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">{t("brand")}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{t("subtitle")}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cities" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
            {t("cities")}
          </Link>
          <Link href="/report" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
            {t("report")}
          </Link>

          {currentUser ? (
            <>
              <button
                type="button"
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15"
              >
                {t("greeting", { name: currentUser.name ?? currentUser.email.split("@")[0] })}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onLogout();
                }}
                className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
              {t("login")}
            </Link>
          )}

          <Link href="/admin" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15">
            {t("admin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
