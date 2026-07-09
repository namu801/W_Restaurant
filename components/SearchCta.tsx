"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

export function SearchCta({
  className,
  children,
  source,
}: {
  className?: string;
  children: React.ReactNode;
  source: string;
}) {
  return (
    <Link
      href="/search"
      onClick={() => track("search_started", { source })}
      className={className}
    >
      {children}
    </Link>
  );
}
