"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCurrentUser } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6">
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-ink-900">
          {isRegister ? t("signUpTitle") : t("signInTitle")}
        </h1>

        {searchParams.get("auth") === "google-success" ? (
          <div role="status" className="mt-3 rounded-lg border border-good-200 bg-good-50 px-3 py-2 text-sm text-good-800">
            {t("googleSuccess")}
          </div>
        ) : null}

        <Button type="button" variant="secondary" onClick={handleGoogleLogin} className="mt-4 w-full">
          {t("continueWithGoogle")}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-ink-500">
          <div className="h-px flex-1 bg-ink-200" />
          <span>{t("or")}</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
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
            <div role="alert" className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800">
              {submitError}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("loading") : isRegister ? t("createAccount") : t("signIn")}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-ink-500">
          {alternateText}{" "}
          <Link
            href={isRegister ? `/login?next=${encodeURIComponent(next)}` : `/register?next=${encodeURIComponent(next)}`}
            className="font-medium text-brand-700 hover:text-brand-800 focus-ring"
          >
            {alternateAction}
          </Link>
        </div>

        <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">{t("googleInfo")}</p>
      </Card>
    </div>
  );
}
