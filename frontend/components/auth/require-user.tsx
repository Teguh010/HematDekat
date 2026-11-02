"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";

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
    return <div className="flex min-h-48 items-center justify-center text-sm text-ink-500">{t("loading")}</div>;
  }

  if (status === "signed-out") {
    return null;
  }

  if (role === "admin" && user?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-5 text-center">
          <h1 className="text-xl font-semibold text-danger-800">{t("noAccess")}</h1>
          <Button href="/" variant="secondary" className="mt-4">
            {t("goToMap")}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
