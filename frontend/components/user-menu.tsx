"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api-client";

export function UserMenu() {
  const t = useTranslations("header");
  const router = useRouter();
  const { status, user, refresh } = useCurrentUser();

  if (status === "loading") {
    return <Skeleton className="h-8 w-16" aria-label={t("login")} />;
  }

  if (status === "signed-out") {
    return (
      <Button href="/login" variant="primary" size="sm">
        {t("login")}
      </Button>
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
      <span className="max-w-[12ch] truncate text-sm text-slate-600 sm:max-w-none">{t("greeting", { name: displayName })}</span>
      {user.role === "admin" ? (
        <Button href="/admin" variant="ghost" size="sm">
          {t("admin")}
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
        {t("logout")}
      </Button>
    </div>
  );
}
