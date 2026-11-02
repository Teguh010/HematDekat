import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-64 w-full max-w-sm animate-pulse rounded-xl bg-ink-100" />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
