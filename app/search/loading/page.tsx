"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UserGroupIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";
import { searchParamsToCondition, conditionToSearchParams } from "@/lib/condition-query";
import { BUDGET_LABEL, CUISINE_LABEL, RELATIONSHIP_LABEL, VIBE_MOOD } from "@/lib/labels";
import { track } from "@/lib/analytics";
import type { Condition } from "@/lib/types";

// 문장이 길면(특히 음식 메시지) 0.55초는 다 읽기 전에 다음 메시지로 바뀌어 잘려 보인다.
// 한 문장을 편하게 읽을 수 있는 간격으로 늘렸다.
const MESSAGE_INTERVAL_MS = 1000;

// 5단계(관계→예산→음식→분위기→완료) 순서를 buildMessages와 그대로 맞춘다. 마지막
// SparklesIcon은 results 페이지의 큐레이션 배지 아이콘과 같은 모티프라, 로딩이 끝나고
// 그 배지가 나타날 때 "이어지는 느낌"을 준다. lucide는 선 스타일 전용이라 필채움이
// 어색해서, 실제로 solid로 그려진 Heroicons로 통일했다(상세 페이지 위치·가격
// 아이콘과 같은 이유)
const STAGE_ICONS: ComponentType<{ className?: string }>[] = [
  UserGroupIcon,
  WalletIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
];

function buildMessages(condition: Condition): string[] {
  const cuisines = condition.cuisines.filter((c) => c !== "any");
  const cuisineText =
    cuisines.length > 0
      ? `${cuisines.map((c) => CUISINE_LABEL[c]).join("·")} 맛집을 확인하고 있어요`
      : "메뉴 취향까지 맞춰보고 있어요";
  const budgetText =
    condition.budget !== "any"
      ? `${BUDGET_LABEL[condition.budget]} 안에서 고르고 있어요`
      : "예산 부담 없는 곳을 고르고 있어요";

  return [
    // "친구·지인 모임"처럼 이름 끝에 이미 "모임"이 붙은 관계는 "모임 모임"이 되지 않게 한 번만 붙인다
    `${RELATIONSHIP_LABEL[condition.relationship].replace(/\s*모임$/, "")} 모임에 맞는지 보고 있어요`,
    budgetText,
    cuisineText,
    condition.vibe !== "any"
      ? `${VIBE_MOOD[condition.vibe]}인지 살펴보고 있어요`
      : "대화하기 좋은 곳인지 확인하고 있어요",
    "청모픽이 가장 잘 맞는 곳을 골랐어요!",
  ];
}

function LoadingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const condition = useMemo(() => searchParamsToCondition(searchParams), [searchParams]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!condition) {
      router.replace("/search");
      return;
    }
    track("result_loading_viewed", { relationship: condition.relationship });

    const messages = buildMessages(condition);
    const tick = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, messages.length - 1));
    }, MESSAGE_INTERVAL_MS);

    const finish = setTimeout(() => {
      router.replace(`/results?${conditionToSearchParams(condition).toString()}`);
    }, messages.length * MESSAGE_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!condition) return null;
  const messages = buildMessages(condition);
  const StageIcon = STAGE_ICONS[messageIndex];
  const progress = ((messageIndex + 1) / messages.length) * 100;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* 아이콘 하나를 고정해두고 문구만 갈아끼우던 예전 방식은 5단계 내내 화면이 똑같아
          보여 "진짜 뭔가 진행되고 있다"는 느낌을 못 줬다 — 단계마다 아이콘도 같이 바뀌고
          (관계→예산→음식→분위기→완료), 뒤에 은은히 숨쉬는 원을 깔아 화면이 계속
          살아있게 했다 */}
      {/* 결과 화면 큐레이터 카드와 같은 그라디언트 테두리(accent-light→accent)와 안쪽 옅은 틴트를 써서,
          로딩이 끝나고 큐레이터 카드가 나타날 때 같은 손길이 이어진다는 인상을 준다.
          뒤에는 같은 색의 번짐이 천천히 숨쉬듯 커졌다 줄어든다 */}
      <span className="relative flex h-28 w-28 items-center justify-center">
        <span
          className="absolute inset-0 animate-pulse rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-accent-light) 45%, transparent) 0%, color-mix(in srgb, var(--color-accent-soft) 35%, transparent) 45%, transparent 70%)",
          }}
          aria-hidden
        />
        <span className="relative rounded-full bg-gradient-to-br from-accent-light/70 via-accent/40 to-accent/75 p-px shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
          <span
            key={messageIndex}
            className="animate-fade-in-up flex h-[72px] w-[72px] items-center justify-center rounded-full bg-cream-soft bg-gradient-to-br from-transparent from-30% to-accent-soft/80"
            aria-hidden
          >
            <StageIcon className="h-8 w-8 text-accent" />
          </span>
        </span>
      </span>

      <p key={`text-${messageIndex}`} className="animate-fade-in-up text-h2 font-bold text-ink">
        {messages[messageIndex]}
      </p>

      {/* 진행바도 같은 그라디언트. 바탕 트랙은 회색 대신 옅은 브랜드 틴트로 두고, 채워진 부분 위로
          빛이 한 번씩 지나가 멈춰 있지 않다는 걸 보여준다 */}
      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-accent-soft/70" aria-hidden>
        <div
          className="loading-shine relative h-full overflow-hidden rounded-full bg-gradient-to-r from-accent-light via-accent to-accent-strong transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function SearchLoadingPage() {
  return (
    <Suspense fallback={null}>
      <LoadingScreen />
    </Suspense>
  );
}
