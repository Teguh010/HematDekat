"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { ApiError, apiFetch, getApiBaseUrl } from "@/lib/api-client";
import { currentUserSchema } from "@/lib/data/types";

const NEXT_STORAGE_KEY = "hematdekat:next";

function sanitizeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const { refresh } = useCurrentUser();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode !== "login" || searchParams.get("auth") !== "google-success") {
      return;
    }

    const redirectTarget = sanitizeNext(sessionStorage.getItem(NEXT_STORAGE_KEY) ?? next);
    sessionStorage.removeItem(NEXT_STORAGE_KEY);

    const timer = window.setTimeout(() => {
      router.replace(redirectTarget);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [mode, next, router, searchParams]);

  const handleGoogleLogin = () => {
    if (mode !== "login") {
      return;
    }

    sessionStorage.setItem(NEXT_STORAGE_KEY, next);
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t("emailInvalid");
    }

    if (mode === "register" && name.trim().length < 2) {
      errors.name = t("nameMin");
    }

    if (password.length < 8) {
      errors.password = t("passwordMin");
    }

    if (mode === "register" && password !== confirmPassword) {
      errors.confirmPassword = t("passwordMismatch");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError("");
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: trimmedEmail, password }
          : { email: trimmedEmail, name: name.trim(), password };

      await apiFetch(endpoint, {
        method: "POST",
        body: payload,
        schema: currentUserSchema,
      });

      await refresh();
      router.replace(next);
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors);
          setSubmitError("");
          return;
        }

        if (mode === "login" && error.status === 401) {
          setSubmitError(t("invalidCredentials"));
        } else if (mode === "login" && error.status === 429) {
          setSubmitError(t("tooManyAttempts"));
        } else if (mode === "register" && error.status === 409) {
          setSubmitError(t("emailAlreadyRegistered"));
        } else {
          setSubmitError(error.message);
        }

        return;
      }

      setSubmitError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRegister = mode === "register";
  const alternateText = isRegister ? t("alreadyHaveAccount") : t("noAccount");
  const alternateAction = isRegister ? t("signIn") : t("signUp");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-slate-950/40 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">{t("account")}</p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          {isRegister ? t("signUpTitle") : t("signInTitle")}
        </h1>

        {searchParams.get("auth") === "google-success" ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {t("googleSuccess")}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
          >
            {t("continueWithGoogle")}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          <span>{t("or")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <TextField
              id="name"
              label={t("name")}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              error={fieldErrors.name}
              autoComplete="name"
            />
          ) : null}

          <TextField
            id="email"
            label={t("email")}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <TextField
            id="password"
            label={t("password")}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("passwordPlaceholder")}
            error={fieldErrors.password}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />

          {isRegister ? (
            <TextField
              id="confirmPassword"
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
            />
          ) : null}

          {submitError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {submitError}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("loading") : isRegister ? t("createAccount") : t("signIn")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {alternateText} <Link href={isRegister ? `/login?next=${encodeURIComponent(next)}` : `/register?next=${encodeURIComponent(next)}`} className="font-medium text-emerald-300">{alternateAction}</Link>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          {t("googleInfo")}
        </div>
      </div>
    </div>
  );
}
