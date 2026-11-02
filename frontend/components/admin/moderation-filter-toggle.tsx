"use client";

import { useTranslations } from "next-intl";

type ModerationFilterToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ModerationFilterToggle({ checked, onChange }: ModerationFilterToggleProps) {
  const t = useTranslations("admin");

  return (
    <label className="flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      />
      <span>{t("onlyFlagged")}</span>
    </label>
  );
}
