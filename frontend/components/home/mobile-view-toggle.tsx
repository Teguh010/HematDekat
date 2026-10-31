"use client";

import { useTranslations } from "next-intl";

type MobileViewToggleProps = {
  value: "map" | "list";
  onChange: (nextValue: "map" | "list") => void;
};

export function MobileViewToggle({ value, onChange }: MobileViewToggleProps) {
  const t = useTranslations("home");

  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-sm items-center rounded-full border border-white/10 bg-slate-900 p-1">
        <button
          type="button"
          aria-pressed={value === "map"}
          onClick={() => onChange("map")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
            value === "map" ? "bg-emerald-500 text-slate-950" : "text-slate-300"
          }`}
        >
          {t("showMap")}
        </button>
        <button
          type="button"
          aria-pressed={value === "list"}
          onClick={() => onChange("list")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
            value === "list" ? "bg-emerald-500 text-slate-950" : "text-slate-300"
          }`}
        >
          {t("showList")}
        </button>
      </div>
    </div>
  );
}
