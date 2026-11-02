"use client";

import { useTranslations } from "next-intl";

import { ListIcon, MapIcon } from "@/components/ui/icons";

type MobileViewToggleProps = {
  value: "map" | "list";
  onChange: (nextValue: "map" | "list") => void;
};

const baseClasses =
  "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export function MobileViewToggle({ value, onChange }: MobileViewToggleProps) {
  const t = useTranslations("home");

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm lg:hidden">
      <button
        type="button"
        aria-pressed={value === "map"}
        onClick={() => onChange("map")}
        className={`${baseClasses} ${value === "map" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
      >
        <MapIcon />
        {t("showMap")}
      </button>
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={`${baseClasses} ${value === "list" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
      >
        <ListIcon />
        {t("showList")}
      </button>
    </div>
  );
}
