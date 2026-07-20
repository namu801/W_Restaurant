"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { track } from "@/lib/analytics";

export const SORT_OPTIONS = [
  { value: "recommended", label: "추천순" },
  { value: "price", label: "가격 낮은순" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/** 레퍼런스(마켓컬리 검색 결과)의 "추천순 ⌄" 드롭다운 자리. 우리는 실제로 정렬 기준이
 *  두 가지뿐이라(추천순=매칭 점수순, 가격 낮은순) 딱 그만큼만 옵션으로 둔다 — 스위칭할
 *  기준이 하나뿐인데 드롭다운처럼 보이게만 만들면 눌러도 아무 일도 안 일어나는
 *  가짜 버튼이 되어버린다. */
export function SortDropdown({ sort }: { sort: SortValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleSelect(value: SortValue) {
    setOpen(false);
    if (value === sort) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    track("result_sort_changed", { sort: value });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {current.label}
        <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-lg border border-line bg-cream-soft shadow-card"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === sort}
              onClick={() => handleSelect(option.value)}
              className={clsx(
                "block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-cream-strong",
                option.value === sort ? "font-bold text-accent" : "font-medium text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
