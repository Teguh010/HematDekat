"use client";

import { useTranslations } from "next-intl";

type ModerationFilterToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ModerationFilterToggle({ checked, onChange }: ModerationFilterToggleProps) {
  const t = useTranslations("admin");

  return (
    <label className="flex w-fit items-center gap-2 rounded-lg border border-ink-300 bg-surface px-3 py-1.5 text-sm text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-brand-600 focus-ring"
      />
      <span>{t("onlyFlagged")}</span>
    </label>
  );
}
