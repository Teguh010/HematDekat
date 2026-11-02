"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <ErrorState onRetry={reset} />
      </div>
    </main>
  );
}
