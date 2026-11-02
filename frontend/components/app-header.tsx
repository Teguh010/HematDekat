"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { UserMenu } from "@/components/user-menu";
import { BrandMark, CloseIcon, FilterIcon } from "@/components/ui/icons";

const navLinkClasses =
  "text-sm text-ink-600 transition-colors hover:text-ink-900 focus-ring";

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
    <header className="relative z-40 shrink-0 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold text-ink-900 focus-ring">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <BrandMark className="h-7 w-7" />
          </span>
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 focus-ring md:hidden"
          aria-label={menuOpen ? t("closeMenu") : t("menu")}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon /> : <FilterIcon />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="absolute inset-x-0 top-full border-b border-ink-200 bg-surface shadow-sm md:hidden">
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
            <div className="flex min-h-10 items-center border-t border-ink-100 py-1">
              <UserMenu />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
