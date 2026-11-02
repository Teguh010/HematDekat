"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { BrandMark, CloseIcon } from "@/components/ui/icons";

const STORAGE_KEY = "hematdekat-hello-dismissed";
const DISMISS_EVENT = "hematdekat-hello-dismissed";

type MapHelloProps = {
  placement?: "desktop" | "mobile";
};

export function MapHello({ placement = "desktop" }: MapHelloProps) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setOpen(window.localStorage.getItem(STORAGE_KEY) !== "1");
      } catch {
        setOpen(true);
      }
    };

    sync();
    window.addEventListener(DISMISS_EVENT, sync);
    return () => window.removeEventListener(DISMISS_EVENT, sync);
  }, []);

  if (!open) {
    return null;
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Hide for this view even when storage is blocked.
    }
    setOpen(false);
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  const position = placement === "mobile" ? "bottom-16 left-3" : "bottom-4 left-4";

  return (
    <div className={`pointer-events-none absolute z-10 w-64 ${position}`}>
      <div className="pointer-events-auto relative rounded-2xl border border-ink-200 bg-surface p-3 pr-8 shadow-warm">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-ring"
          aria-label={t("helloClose")}
        >
          <CloseIcon />
        </button>
        <div className="flex items-start gap-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <BrandMark className="h-8 w-8" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{t("helloTitle")}</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-600">{t("helloBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
