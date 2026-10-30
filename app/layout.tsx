import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domel Decision Workspace",
  description: "Formal project foundation for the Domel decision workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
