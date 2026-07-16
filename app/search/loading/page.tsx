"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { searchParamsToCondition, conditionToSearchParams } from "@/lib/condition-query";
import { BUDGET_LABEL, CUISINE_LABEL, RELATIONSHIP_LABEL } from "@/lib/labels";
import { track } from "@/lib/analytics";
import type { Condition } from "@/lib/types";

// 문장이 길면(특히 음식 메시지) 0.55초는 다 읽기 전에 다음 메시지로 바뀌어 잘려 보인다.
// 한 문장을 편하게 읽을 수 있는 간격으로 늘렸다.
const MESSAGE_INTERVAL_MS = 1000;

function buildMessages(condition: Condition): string[] {
  const cuisines = condition.cuisines.filter((c) => c !== "any");
  const cuisineText =
    cuisines.length > 0
      ? `${cuisines.map((c) => CUISINE_LABEL[c]).join("·")} 메뉴가 있는 곳을 확인하고 있어요…`
      : "다양한 메뉴의 후보를 살펴보고 있어요…";
  const budgetText =
    condition.budget !== "any"
      ? `${BUDGET_LABEL[condition.budget]} 예산에 맞는 후보를 좁히고 있어요…`
      : "예산 부담 없는 후보를 찾고 있어요…";

  return [
    `${RELATIONSHIP_LABEL[condition.relationship]} 모임에 맞는 장소를 찾고 있어요…`,
    budgetText,
    cuisineText,
    "대화하기 좋은 자리인지 살펴보고 있어요…",
    "가장 잘 맞는 곳을 정리하고 있어요…",
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

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      {/* 로딩 스피너 대신, 앱 전반에 쓰는 이모지 일러스트 톤에 맞춘 음식 아이콘을 살짝 튀기며 보여준다 */}
      <span
        className="flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-accent-soft text-4xl"
        aria-hidden
      >
        🍽️
      </span>
      <p key={messageIndex} className="animate-fade-in-up font-serif text-lg font-bold leading-snug text-ink">
        {messages[messageIndex]}
      </p>
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
