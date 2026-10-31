"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { getApiBaseUrl } from "@/lib/api-client";

function LoginContent() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const isGoogleSuccess = authStatus === "google-success";

  useEffect(() => {
    if (!isGoogleSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push("/");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isGoogleSuccess, router]);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-slate-950/40">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("account")}</p>
        <h1 className="mt-3 text-3xl font-bold text-white">{t("signInTitle")}</h1>

        {isGoogleSuccess ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {t("googleSuccess")}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <a
            href={`${getApiBaseUrl()}/auth/google`}
            className="block w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
          >
            {t("continueWithGoogle")}
          </a>

          <button type="button" className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500">
            {t("signInWithEmail")}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          {t("googleInfo")}
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          {t("noAccount")} <Link href="/" className="font-medium text-emerald-300">{t("goToMap")}</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8"><div className="rounded-3xl border border-white/10 bg-slate-900 p-6 text-slate-300">Memuat halaman masuk...</div></main>}>
      <LoginContent />
    </Suspense>
  );
}
