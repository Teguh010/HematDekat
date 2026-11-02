import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs text-slate-500">
        <p>{t("copyright")}</p>

        <nav aria-label={t("navigation")} className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/about" className="transition-colors hover:text-slate-900">
            {t("about")}
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-slate-900">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-900">
            {t("terms")}
          </Link>
          <Link href="/feedback" className="transition-colors hover:text-slate-900">
            {t("feedback")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
