import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{t("copyright")}</p>

        <nav aria-label={t("navigation")} className="flex flex-wrap items-center gap-4">
          <Link href="/about" className="transition hover:text-white">
            {t("about")}
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            {t("terms")}
          </Link>
          <Link href="/feedback" className="transition hover:text-white">
            {t("feedback")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
