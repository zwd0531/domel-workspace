import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BilingualSurface, LanguageProvider } from "@/components/i18n/language-provider";
import { LANGUAGE_COOKIE, normalizeLocale } from "@/components/i18n/translations";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domel Decision Workspace",
  description: "Formal project foundation for the Domel decision workspace.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = normalizeLocale((await cookies()).get(LANGUAGE_COOKIE)?.value);
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body>
        <LanguageProvider initialLocale={locale}>
          <BilingualSurface />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
