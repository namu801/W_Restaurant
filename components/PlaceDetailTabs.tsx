"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { AlertCircle, Check, Sparkles } from "lucide-react";
import { CuratorFrame } from "@/components/CurationAgentCard";
import { HighlightText, countHighlights } from "@/components/HighlightText";
import { formatWon } from "@/lib/labels";
import type { MenuItem } from "@/lib/types";

/**
 * 예전엔 추천 이유·메뉴·체크포인트·주의사항 4개 섹션에 같은 말(룸, 전화 예약…)이 두세 번씩
 * 나왔다. 실제 내용은 세 가지라 탭도 세 개로 줄였다:
 *  - 추천 이유: 큐레이터 카드 하나에 핵심 문장만
 *  - 메뉴
 *  - 예약 전 확인: 조건과 맞는 점(✓)과 확인할 점(!)을 한 목록으로
 */
const TABS = [
  { id: "reason", label: "추천 이유" },
  { id: "menu", label: "메뉴" },
  { id: "check", label: "예약 전 확인" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * 탭바를 순수 CSS position:sticky로만 뒀더니 실제 iOS 사파리에서 스크롤 중 고정되지 않는 문제가
 * 있었다. 그래서 두 벌을 그린다: 문서 흐름 안의 "제자리" 탭바(공간 차지)와, 그 자리가 화면 위로
 * 나가는 순간부터 헤더 아래에 고정으로 겹쳐 그리는 "떠 있는" 탭바. 전환은 센티넬을
 * IntersectionObserver로 지켜보다가 화면 밖으로 나가면 한다.
 */
export function PlaceDetailTabs({
  menu,
  summaryTitle,
  summaryBullets,
  matchedPoints,
  pointsToCheck,
  reservationAsk,
}: {
  menu: MenuItem[];
  summaryTitle: string;
  summaryBullets: string[];
  /** 고른 조건과 맞는 점 */
  matchedPoints: string[];
  /** 예약 전에 확인할 점(룸 최소 인원, 예약 방식, 대기 등) */
  pointsToCheck: string[];
  reservationAsk: string;
}) {
  const [active, setActive] = useState<TabId>("reason");
  const [isStuck, setIsStuck] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<TabId, HTMLElement | null>>({ reason: null, menu: null, check: null });
  const suppressObserverRef = useRef(false);
  const suppressTimeoutRef = useRef<number | null>(null);
  const checkListRef = useRef<HTMLDivElement>(null);
  const [highlightOn, setHighlightOn] = useState(false);

  // 확인할 점 목록이 화면에 들어오면 형광펜을 한 번 긋는다(다시 지우지 않는다)
  useEffect(() => {
    const el = checkListRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHighlightOn(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) setHeaderHeight(header.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [headerHeight]);

  // 스크롤 위치에 따라 지금 보고 있는 섹션의 탭을 활성화한다
  useEffect(() => {
    const sections = Object.values(sectionRefs.current).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserverRef.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const id = topMost.target.getAttribute("data-tab-id") as TabId | null;
        if (id) setActive(id);
      },
      { rootMargin: `-${headerHeight + 52}px 0px -55% 0px`, threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headerHeight]);

  useEffect(() => {
    return () => {
      if (suppressTimeoutRef.current) window.clearTimeout(suppressTimeoutRef.current);
    };
  }, []);

  // 탭을 눌러 스크롤하는 동안엔 위 관찰자가 활성 탭을 덮어쓰지 않게 잠깐 막는다
  function handleTabClick(id: TabId) {
    suppressObserverRef.current = true;
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (suppressTimeoutRef.current) window.clearTimeout(suppressTimeoutRef.current);
    suppressTimeoutRef.current = window.setTimeout(() => {
      suppressObserverRef.current = false;
    }, 700);
  }

  function renderTabBar() {
    return (
      <div className="flex border-b border-line bg-cream-soft px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={clsx(
              "flex-1 border-b-2 py-3.5 text-label transition-colors",
              active === tab.id
                ? "border-ink font-bold text-ink"
                : "border-transparent font-medium text-ink-faint hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  const sectionRef = (id: TabId) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="flex flex-col">
      <div ref={sentinelRef} className="h-px" />

      <div className={clsx("-mx-6", isStuck && "invisible")}>{renderTabBar()}</div>

      {isStuck && (
        <div className="fixed inset-x-0 z-20" style={{ top: headerHeight }}>
          <div className="mx-auto max-w-[430px]">{renderTabBar()}</div>
        </div>
      )}

      <section ref={sectionRef("reason")} data-tab-id="reason" className="scroll-mt-14 pt-7">
        <CuratorFrame>
          <p className="flex items-center gap-1.5 text-caption font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={2} fill="currentColor" aria-hidden />
            청모픽 큐레이터가 정리했어요
          </p>
          <h2 className="mt-2 text-title font-bold text-ink">{summaryTitle}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {summaryBullets.map((line) => (
              <li key={line} className="flex gap-2 text-body text-ink-soft">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </CuratorFrame>
      </section>

      <div className="-mx-6 mt-8 h-2 bg-cream" />

      <section ref={sectionRef("menu")} data-tab-id="menu" className="scroll-mt-14 pt-7">
        <h2 className="mb-2 text-h2 font-bold text-ink">대표 메뉴</h2>
        {menu.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line">
            {menu.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 py-3.5 text-body">
                <span className="text-ink">{item.name}</span>
                <span className="shrink-0 font-semibold text-ink">{formatWon(item.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-label text-ink-soft">메뉴 정보를 아직 확인하지 못했어요. 지도 서비스에서 최신 메뉴를 확인해주세요.</p>
        )}
      </section>

      <div className="-mx-6 mt-6 h-2 bg-cream" />

      <section ref={sectionRef("check")} data-tab-id="check" className="scroll-mt-14 pt-7 pb-2">
        <h2 className="text-h2 font-bold text-ink">예약 전 확인</h2>

        {matchedPoints.length > 0 && (
          <>
            <p className="mt-5 text-caption font-semibold text-ink-soft">고른 조건과 맞아요</p>
            <ul className="mt-3 flex flex-col gap-4">
              {matchedPoints.map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-body leading-relaxed text-ink">
                  <Check className="mt-[5px] h-4 w-4 shrink-0 text-sage" strokeWidth={2.25} aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </>
        )}

        {pointsToCheck.length > 0 && (
          <div ref={checkListRef} className={clsx(highlightOn && "hl-on")}>
            <p className="mt-8 text-caption font-semibold text-ink-soft">미리 확인하세요</p>
            <ul className="mt-3 flex flex-col gap-4">
              {pointsToCheck.map((text, i) => {
                // 형광펜은 목록 전체에서 위에서부터 차례로 그어지도록 앞 항목들의 개수를 이어 센다
                const startIndex = pointsToCheck.slice(0, i).reduce((n, t) => n + countHighlights(t), 0);
                return (
                  <li key={text} className="flex items-start gap-2.5 text-body leading-relaxed text-ink">
                    <AlertCircle className="mt-[5px] h-4 w-4 shrink-0 text-clay" strokeWidth={2} aria-hidden />
                    <span>
                      <HighlightText text={text} startIndex={startIndex} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="mt-8 rounded-md bg-cream-strong px-4 py-3.5 text-body leading-relaxed text-ink">{reservationAsk}</p>
      </section>
    </div>
  );
}
