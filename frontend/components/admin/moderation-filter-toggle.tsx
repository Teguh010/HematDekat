"use client";

import { useTranslations } from "next-intl";

type ModerationFilterToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ModerationFilterToggle({ checked, onChange }: ModerationFilterToggleProps) {
  const t = useTranslations("admin");

  return (
    <label className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      />
      <span>{t("onlyFlagged")}</span>
    </label>
  );
}
