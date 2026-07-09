"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { track } from "@/lib/analytics";

export function EditConditionLink({ resultCount }: { resultCount: number }) {
  return (
    <Link
      href="/search"
      onClick={() => track("condition_edit_clicked", { current_result_count: resultCount })}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:border-ink-faint"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      조건 수정
    </Link>
  );
}
