import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BilingualSurface, LanguageProvider } from "@/components/i18n/language-provider";
import { LANGUAGE_COOKIE, normalizeLocale } from "@/components/i18n/translations";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domel Workspace · 清晰地做出决策",
  description: "Domel 苏州团队的业务看板、场景规划与行业情报决策工作台。"
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
