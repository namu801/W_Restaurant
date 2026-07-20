"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Check, TriangleAlert } from "lucide-react";
import { ICON_COLOR, ICON_MAP } from "@/components/checkpoint-icon-map";
import type { FitGuidance, ReasonCard } from "@/lib/reason";

// "추천 이유/체크포인트/주의사항"은 사무적으로 항목을 나열하는 이름이라, 사용자가 최종
// 판단을 내리는 데 청모픽이 어떻게 도움을 주는지가 안 드러났다 — 탭 이름 자체를 사용자
// 의사결정 기준("왜/맞을까/예약 전에")으로 바꾼다
const TABS = [
  { id: "reason", label: "왜 추천해요" },
  { id: "checkpoints", label: "내 모임에 맞을까요" },
  { id: "caution", label: "예약 전에 확인해요" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * 예전엔 탭을 누르면 그 섹션으로 스크롤 이동만 하고, 세 섹션 내용이 한 페이지에 계속
 * 이어 붙어 있었다(고정 탭바 + IntersectionObserver로 현재 위치만 하이라이트).
 * 그런데 탭이 있는데 모든 콘텐츠를 계속 이어 보여주면 탭의 의미가 약해진다 — 실제로
 * 누른 탭의 내용만 보이게, 진짜 탭 전환으로 바꾼다. 스크롤 위치 추적이 필요 없어져서
 * sticky 탭바·IntersectionObserver 로직을 걷어내고 훨씬 단순해졌다.
 */
export function PlaceDetailTabs({
  reasonCards,
  fitGuidance,
  bookingFacts,
  reservationAsk,
}: {
  reasonCards: ReasonCard[];
  fitGuidance: FitGuidance;
  bookingFacts: string[];
  reservationAsk: string;
}) {
  const [active, setActive] = useState<TabId>("reason");

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
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

      {active === "reason" && (
        <div className="flex flex-col gap-3 pt-6">
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
      )}

      {active === "checkpoints" && (
        <div className="flex flex-col gap-5 pt-6">
          {/* "잘 맞아요/무난해요/확인이 필요해요"처럼 항목을 다시 잘게 쪼개는 대신, "어떤
              상황에서 선택해야 하는지"를 바로 말해준다 — 좋은 점만 말하지 않고 이 장소가
              안 맞을 만한 상황(avoidFor)까지 정직하게 같이 보여줘야 진짜 조언이 된다 */}
          <div>
            <p className="mb-2 text-sm font-bold text-sage">이런 모임에 추천해요</p>
            <ul className="flex flex-col gap-2">
              {fitGuidance.recommendFor.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={2.2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {fitGuidance.avoidFor.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold text-clay">이런 경우에는 다른 곳이 나을 수 있어요</p>
              <ul className="flex flex-col gap-2">
                {fitGuidance.avoidFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {active === "caution" && (
        <div className="pt-6 pb-2">
          {/* 예전엔 이 탭 안에 주의사항+예약 팁+주문 팁+모임 팁이 다 들어 있어 길고
              반복적으로 보였다 — 확인이 필요한 사실 최대 3개 + 실행 문구 한 줄이면 충분하다 */}
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
        </div>
      )}
    </div>
  );
}
