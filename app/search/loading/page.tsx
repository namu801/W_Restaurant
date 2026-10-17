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
import { BUDGET_LABEL, CUISINE_LABEL, RELATIONSHIP_LABEL, VIBE_LABEL } from "@/lib/labels";
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
    `${RELATIONSHIP_LABEL[condition.relationship]} 모임에 맞는지 보고 있어요`,
    budgetText,
    cuisineText,
    condition.vibe !== "any"
      ? `${VIBE_LABEL[condition.vibe]} 분위기인지 살펴보고 있어요`
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
      <span className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-pulse rounded-full bg-accent-soft" aria-hidden />
        <span
          key={messageIndex}
          className="animate-fade-in-up relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft"
          aria-hidden
        >
          <StageIcon className="h-7 w-7 text-accent" />
        </span>
      </span>

      <p key={`text-${messageIndex}`} className="animate-fade-in-up text-h2 font-bold text-ink">
        {messages[messageIndex]}
      </p>

      {/* results 페이지 큐레이션 배지와 같은 accent→accent-light 그라디언트를 그대로 써서,
          로딩이 끝나면 이 색이 그 배지로 그대로 이어진다는 인상을 준다. 다른 색(예전엔 gold)
          으로 넘어가지 않고 같은 브랜드 hue 안에서 밝기만 오간다. */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-line-strong" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-[width] duration-500 ease-out"
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
