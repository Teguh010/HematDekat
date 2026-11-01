"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useCurrentUser } from "@/components/current-user-provider";

type RequireUserProps = {
  children: ReactNode;
  role?: "admin";
};

export function RequireUser({ children, role }: RequireUserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth");
  const { status, user } = useCurrentUser();

  useEffect(() => {
    if (status === "signed-out") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status === "loading") {
    return <div className="flex min-h-48 items-center justify-center text-slate-300">{t("loading")}</div>;
  }

  if (status === "signed-out") {
    return null;
  }

  if (role === "admin" && user?.role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-red-500/30 bg-slate-900 p-6 text-center shadow-xl shadow-slate-950/40">
          <p className="text-xs uppercase tracking-[0.28em] text-red-300">{t("account")}</p>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("noAccess")}</h1>
          <div className="mt-6">
            <Link href="/" className="rounded-full border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-emerald-400">
              {t("goToMap")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
