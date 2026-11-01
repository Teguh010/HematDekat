import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <Suspense fallback={<div className="h-12 w-48 rounded-full bg-slate-800" />}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
