"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <ErrorState onRetry={reset} />
      </div>
    </div>
  );
}
