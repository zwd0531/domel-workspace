"use client";

import { useLanguage } from "./language-provider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();
  const targetLabel = locale === "zh" ? "English" : "中文";
  const accessibleLabel = locale === "zh" ? "Switch to English" : "切换到中文";
  return (
    <button
      className={`language-toggle ${className}`.trim()}
      data-no-translate
      type="button"
      onClick={toggleLocale}
      title={accessibleLabel}
      aria-label={accessibleLabel}
    >
      <span aria-hidden="true">◎</span>{targetLabel}
    </button>
  );
}
