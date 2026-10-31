import { describe, expect, it } from "vitest";
import { hasTranslation, normalizeLocale, translateUiText } from "@/components/i18n/translations";

describe("bilingual UI translations", () => {
  it("normalizes unknown or absent language cookies to English", () => {
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale("zh")).toBe("zh");
  });

  it("translates core navigation while preserving surrounding whitespace", () => {
    expect(translateUiText("  Business Dashboard ", "zh")).toBe("  业务看板 ");
    expect(translateUiText("Business Dashboard", "en")).toBe("Business Dashboard");
  });

  it("translates dynamic presentation counts without changing business data", () => {
    expect(translateUiText("12 product records", "zh")).toBe("12 条产品记录");
    expect(translateUiText("EC730 motor", "zh")).toBe("EC730 motor");
    expect(hasTranslation("Scenario Planning")).toBe(true);
    expect(hasTranslation("Customer-supplied evidence title")).toBe(false);
  });
});
