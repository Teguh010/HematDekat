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
    return <Skeleton className="h-10 w-24" aria-label={t("login")} />;
  }

  if (status === "signed-out") {
    return (
      <Button href="/login" variant="secondary" size="sm">
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
      <span className="hidden text-sm text-slate-200 sm:inline">{t("greeting", { name: displayName })}</span>
      {user.role === "admin" ? (
        <Button href="/admin" variant="secondary" size="sm">
          {t("admin")}
        </Button>
      ) : null}
      <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
        {t("logout")}
      </Button>
    </div>
  );
}
