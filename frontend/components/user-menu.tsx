"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { useCurrentUser } from "@/components/current-user-provider";
import { apiFetch } from "@/lib/api-client";

export function UserMenu() {
  const t = useTranslations("header");
  const router = useRouter();
  const { status, user, refresh } = useCurrentUser();

  if (status === "loading") {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-slate-800" aria-label={t("login")} />;
  }

  if (status === "signed-out") {
    return (
      <Link href="/login" className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400">
        {t("login")}
      </Link>
    );
  }

  const displayName = user.name || user.email.split("@")[0];

  const handleLogout = async () => {
    await apiFetch("/auth/logout", {
      method: "POST",
      schema: z.object({ ok: z.boolean() }),
    });
    await refresh();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-slate-200 sm:inline">{t("greeting", { name: displayName })}</span>
      {user.role === "admin" ? (
        <Link href="/admin" className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15">
          {t("admin")}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
      >
        {t("logout")}
      </button>
    </div>
  );
}
