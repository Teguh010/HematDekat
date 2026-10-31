"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { UserMenu } from "@/components/user-menu";

export function AppHeader() {
  const t = useTranslations("header");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">{t("brand")}</p>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{t("subtitle")}</h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/cities" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
              {t("cities")}
            </Link>
            <Link href="/report" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
              {t("report")}
            </Link>
            <UserMenu />
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex items-center rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 md:hidden"
            aria-label={menuOpen ? t("closeMenu") : t("menu")}
          >
            {menuOpen ? t("closeMenu") : t("menu")}
          </button>
        </div>

        {menuOpen ? (
          <nav className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 md:hidden">
            <Link href="/cities" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              {t("cities")}
            </Link>
            <Link href="/report" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              {t("report")}
            </Link>
            <div className="pt-1">
              <UserMenu />
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
