"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function scrollToProductAnalysis() {
  const heading = document.getElementById("product-analysis-title");
  if (!heading) return;
  heading.scrollIntoView({ behavior: "auto", block: "start" });
  heading.focus({ preventScroll: true });
}

export function AnalysisLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return <Link className={className} href={href} scroll={false} onClick={() => {
    const target = new URL(href, window.location.origin);
    const current = new URL(window.location.href);
    if (["product", "month", "role", "analysis"].every(key => target.searchParams.get(key) === current.searchParams.get(key))) {
      scrollToProductAnalysis();
    }
  }}>{children}</Link>;
}
