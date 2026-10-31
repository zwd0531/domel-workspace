"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGE_COOKIE, type AppLocale, translateUiText } from "./translations";

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const TRANSLATED_ATTRIBUTES = ["aria-label", "placeholder", "title"] as const;

export function LanguageProvider({ initialLocale, children }: { initialLocale: AppLocale; children: React.ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);
  const toggleLocale = useCallback(() => setLocale((current) => current === "en" ? "zh" : "en"), []);
  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, toggleLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function BilingualSurface() {
  const { locale } = useLanguage();
  const originalText = useRef(new WeakMap<Text, string>());
  const originalAttributes = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const root = document.body;

    function translateTextNode(node: Text, allowOriginalUpdate: boolean) {
      if (node.parentElement?.closest("[data-no-translate]")) return;
      const knownOriginal = originalText.current.get(node);
      if (locale === "en") {
        if (knownOriginal !== undefined && node.nodeValue !== knownOriginal) node.nodeValue = knownOriginal;
        return;
      }
      const current = node.nodeValue ?? "";
      let original = knownOriginal;
      if (original === undefined) {
        original = current;
        originalText.current.set(node, original);
      } else if (allowOriginalUpdate && current !== translateUiText(original, "zh") && current !== original) {
        original = current;
        originalText.current.set(node, original);
      }
      const translated = translateUiText(original, "zh");
      if (node.nodeValue !== translated) node.nodeValue = translated;
    }

    function translateElementAttributes(element: Element, allowOriginalUpdate: boolean) {
      if (element.closest("[data-no-translate]")) return;
      let originals = originalAttributes.current.get(element);
      if (!originals) {
        originals = new Map<string, string>();
        originalAttributes.current.set(element, originals);
      }
      for (const attribute of TRANSLATED_ATTRIBUTES) {
        const current = element.getAttribute(attribute);
        if (current === null) continue;
        const knownOriginal = originals.get(attribute);
        if (locale === "en") {
          if (knownOriginal !== undefined && current !== knownOriginal) element.setAttribute(attribute, knownOriginal);
          continue;
        }
        let original = knownOriginal;
        if (original === undefined) {
          original = current;
          originals.set(attribute, original);
        } else if (allowOriginalUpdate && current !== translateUiText(original, "zh") && current !== original) {
          original = current;
          originals.set(attribute, original);
        }
        const translated = translateUiText(original, "zh");
        if (current !== translated) element.setAttribute(attribute, translated);
      }
    }

    function walk(node: Node, allowOriginalUpdate = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node as Text, allowOriginalUpdate);
        return;
      }
      if (!(node instanceof Element) && node !== root) return;
      if (node instanceof Element) translateElementAttributes(node, allowOriginalUpdate);
      node.childNodes.forEach((child) => walk(child, allowOriginalUpdate));
    }

    walk(root);
    if (locale === "en") return;

    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      for (const mutation of mutations) {
        if (mutation.type === "characterData") walk(mutation.target, true);
        if (mutation.type === "childList") mutation.addedNodes.forEach((node) => walk(node));
        if (mutation.type === "attributes") walk(mutation.target, true);
      }
      observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES] });
    });
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...TRANSLATED_ATTRIBUTES] });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
