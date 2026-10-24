"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
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
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Akun</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Masuk ke Sembako Murah</h1>

        {isGoogleSuccess ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Berhasil masuk dengan Google. Anda akan diarahkan ke halaman utama dalam beberapa saat.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <a
            href={`${backendBaseUrl}/auth/google`}
            className="block w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
          >
            Lanjutkan dengan Google
          </a>

          <button type="button" className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500">
            Masuk dengan email
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          Login Google diproses di backend NestJS. Setelah login berhasil, browser akan menerima cookie auth yang dikirim dari API backend.
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Belum punya akun? <Link href="/" className="font-medium text-emerald-300">Lanjut ke peta</Link>
        </div>
      </div>
    </main>
  );
}
