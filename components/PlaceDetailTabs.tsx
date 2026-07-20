"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { TriangleAlert } from "lucide-react";
import { CheckpointList } from "@/components/CheckpointList";
import { ICON_COLOR, ICON_MAP } from "@/components/checkpoint-icon-map";
import type { Checkpoint } from "@/lib/checkpoints";
import type { ReasonCard } from "@/lib/reason";

const TABS = [
  { id: "reason", label: "추천 이유" },
  { id: "checkpoints", label: "체크포인트" },
  { id: "caution", label: "주의사항" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * 탭바를 순수 CSS position:sticky로만 뒀더니 실제 iOS 사파리에서 스크롤 중 고정되지 않고
 * 문서 흐름 그대로 떠내려가는 문제가 있었다(이 프로젝트가 BottomNav 등에서 이미 한 번
 * 겪었던 것과 같은 계열의 신뢰성 문제). 그래서 직접 두 벌을 그린다: 문서 흐름 안에 항상
 * 존재하는 "제자리" 탭바(공간을 차지)와, 그 자리가 뷰포트 위로 스크롤되어 나가는 순간부터
 * 화면에 고정으로 겹쳐 그리는 "떠 있는" 탭바. 어느 쪽이 보일지는 센티넬 엘리먼트를
 * IntersectionObserver로 지켜보다가 화면 밖으로 나가면 전환한다.
 */
export function PlaceDetailTabs({
  checkpoints,
  reasonCards,
  bookingFacts,
  reservationAsk,
}: {
  checkpoints: Checkpoint[];
  reasonCards: ReasonCard[];
  /** 주의사항은 예전엔 place.cautionNote 한 줄만 보여줬는데, 실제 확인이 필요한 사실
   *  (룸 최소 인원, 예약 방식, 예산 초과 가능성, 대기 등)을 최대 3개까지 같이 모아서
   *  보여주는 쪽이 더 도움이 된다는 판단으로 유지한다 — 나머지 탭(추천 이유·체크포인트)은
   *  카테고리별 판단으로 되돌렸지만, 이 탭은 그대로 둔다 */
  bookingFacts: string[];
  reservationAsk: string;
}) {
  const [active, setActive] = useState<TabId>("reason");
  const [isStuck, setIsStuck] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<TabId, HTMLElement | null>>({
    checkpoints: null,
    reason: null,
    caution: null,
  });
  const suppressObserverRef = useRef(false);
  const suppressTimeoutRef = useRef<number | null>(null);

  // 헤더는 화면 위쪽에 항상 떠 있는 별도 영역이라, 탭바가 "고정"될 때 그 바로 밑에 붙게
  // 하려면 헤더의 실제 렌더링 높이가 필요하다. 임의 px 값을 박아두면 폰트 크기나 로고
  // 크기가 바뀔 때마다 어긋나므로, 실제 DOM에서 측정한다
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

  useEffect(() => {
    const sections = Object.values(sectionRefs.current).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserverRef.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
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
      <div className="flex border-b border-line bg-cream">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={clsx(
              // 원티드 tabs 스펙: active는 fg-strong(잉크) 텍스트 + 2px fg-strong 언더라인이다 —
              // "화면당 단일 강조색" 원칙대로 탭 강조엔 브랜드 블루를 쓰지 않는다
              "flex-1 border-b-2 py-3 text-sm transition-colors",
              active === tab.id
                ? "border-ink font-semibold text-ink"
                : "border-transparent font-medium text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div ref={sentinelRef} className="h-px" />

      {/* 제자리 탭바: 문서 흐름 안에서 항상 자기 공간을 차지한다. 고정 탭바가 뜨는 동안엔
          시각적으로만 숨겨서, 레이아웃이 출렁이지 않게 한다 */}
      <div className={clsx("-mx-6 px-6", isStuck && "invisible")}>{renderTabBar()}</div>

      {/* 고정 탭바: 센티넬이 화면 위로 사라지면(= 원래 자리가 스크롤로 가려지면) 나타나서
          헤더 바로 아래에 겹쳐 그려진다. 프레임 폭(430px) 밖 데스크톱 배경까지 번지지 않도록
          안쪽 컨텐츠만 max-w로 가운데 정렬한다 */}
      {isStuck && (
        <div className="fixed inset-x-0 z-20" style={{ top: headerHeight }}>
          <div className="mx-auto max-w-[430px]">{renderTabBar()}</div>
        </div>
      )}

      <section
        ref={(el) => {
          sectionRefs.current.reason = el;
        }}
        data-tab-id="reason"
        className="scroll-mt-14 pt-8"
      >
        <p className="mb-4 text-lg font-bold tracking-tight text-ink">이 모임에 추천하는 이유</p>
        <div className="flex flex-col gap-3">
          {reasonCards.map((card, i) => {
            const CardIcon = ICON_MAP[card.icon];
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border border-accent/25 bg-accent-soft/60 p-4"
              >
                {/* 체크포인트와 같은 원형 배지+아이콘을 그대로 써서, 이 서비스 안에서
                    아이콘 스타일이 하나로 통일되게 한다 — 배경은 cream-strong(미색)이 아니라
                    흰색으로, 카드 자체의 옅은 accent 틴트 위에서 더 또렷하게 도드라지게 한다 */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                  <CardIcon className={clsx("h-4 w-4", ICON_COLOR[card.icon])} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  {card.emphasizeDescription ? (
                    <p className="text-sm font-bold leading-relaxed text-ink">{card.description}</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-ink">{card.headline}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{card.description}</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 레퍼런스(GS더프레시 매장상세)의 "우리매장 서비스"↔"픽업/배달 안내" 사이 구분
          밴드와 같은 자리 — 대분류가 바뀐다는 걸 헤어라인 하나보다 뚜렷하게 보여준다.
          bg-cream은 페이지 배경(body)과 완전히 같은 색이라 실제로는 안 보이는 밴드였다 —
          line-strong(#DDDEE0)으로 바꿔 실제로 보이게 했다 */}
      <div className="-mx-6 mt-8 h-2 bg-line-strong" />

      <section
        ref={(el) => {
          sectionRefs.current.checkpoints = el;
        }}
        data-tab-id="checkpoints"
        className="scroll-mt-14 pt-8"
      >
        <p className="mb-4 text-lg font-bold tracking-tight text-ink">청첩장 모임 체크포인트</p>
        <CheckpointList checkpoints={checkpoints} />
      </section>

      <div className="-mx-6 mt-8 h-2 bg-line-strong" />

      {/* 추천 이유(블루)와 뚜렷이 구분되도록 원티드 팔레트의 warning(주황) 톤을 쓴다.
          예전엔 place.cautionNote 한 줄만 보여줬는데, 실제 예약 전에 확인할 사실을
          최대 3개까지 모아서 보여주는 지금 방식이 더 도움이 돼서 그대로 유지한다 */}
      <section
        ref={(el) => {
          sectionRefs.current.caution = el;
        }}
        data-tab-id="caution"
        className="scroll-mt-14 pt-8 pb-2"
      >
        <p className="mb-4 text-lg font-bold tracking-tight text-ink">주의할 점</p>
        <ul className="flex flex-col gap-2.5">
          {bookingFacts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={2.2} />
              {fact}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-md border border-clay/30 bg-clay-soft p-4">
          <p className="text-sm leading-relaxed text-ink">{reservationAsk}</p>
        </div>
      </section>
    </div>
  );
}
