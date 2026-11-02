"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { UserMenu } from "@/components/user-menu";
import { CloseIcon, FilterIcon } from "@/components/ui/icons";

const navLinkClasses =
  "text-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export function AppHeader() {
  const t = useTranslations("header");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="relative z-40 shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-base font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {t("brand")}
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/cities" className={navLinkClasses}>
            {t("cities")}
          </Link>
          <Link href="/report" className={navLinkClasses}>
            {t("report")}
          </Link>
          <UserMenu />
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 md:hidden"
          aria-label={menuOpen ? t("closeMenu") : t("menu")}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon /> : <FilterIcon />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-sm md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-1">
            <Link
              href="/cities"
              onClick={() => setMenuOpen(false)}
              className={`flex h-10 items-center ${navLinkClasses}`}
            >
              {t("cities")}
            </Link>
            <Link
              href="/report"
              onClick={() => setMenuOpen(false)}
              className={`flex h-10 items-center ${navLinkClasses}`}
            >
              {t("report")}
            </Link>
            <div className="flex min-h-10 items-center border-t border-slate-100 py-1">
              <UserMenu />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
