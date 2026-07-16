"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { formatWon } from "@/lib/labels";
import type { BudgetKey } from "@/lib/types";

// 슬라이더 자체는 0~110000원 범위를 쓰지만, 실제로 의미 있는 선택 구간은 2만~10만원이다.
// min을 0으로 잡아둔 건 "2만원 이하"를 값 0이 아니라 20000으로 대표시켜서, 손잡이가
// 트랙 맨 왼쪽 끝(채워진 색이 하나도 없어 "선택 안 됨"처럼 보이는 지점)에 붙지 않게 하기 위해서다.
const MIN = 0;
const MAX = 110_000;
const STEP = 1_000;
const LOWER_BOUND = 20_000; // 이하면 "2만원 이하"
const UPPER_BOUND = 100_000; // 이상이면 "10만원 이상"
const DEFAULT_VALUE = 40_000;

function valueToBudgetKey(v: number): Exclude<BudgetKey, "any"> {
  if (v <= 20_000) return "under-20k";
  if (v <= 30_000) return "20-30k";
  if (v <= 50_000) return "30-50k";
  return "over-50k";
}

function bucketRepresentativeValue(key: BudgetKey): number {
  switch (key) {
    case "under-20k":
      return LOWER_BOUND;
    case "20-30k":
      return 25_000;
    case "30-50k":
      return DEFAULT_VALUE;
    case "over-50k":
      return 70_000;
    case "any":
      return DEFAULT_VALUE;
  }
}

function valueToLabel(v: number): string {
  if (v <= LOWER_BOUND) return "2만원 이하";
  if (v >= UPPER_BOUND) return "10만원 이상";
  return formatWon(v);
}

/**
 * 예산 조건을 버튼 목록 대신 슬라이더로 고른다. 2만~10만원 사이는 자유롭게 끌어서
 * 고를 수 있고, 안쪽에서는 여전히 4개 구간(2만 이하/2만~3만/3만~5만/5만 이상)으로
 * 나눠 기존 매칭 로직과 그대로 맞물린다. "가격 상관없음"을 체크하면 슬라이더가
 * 흐릿해지고 조건이 "any"로 바뀐다.
 */
export function BudgetSlider({
  value,
  onChange,
}: {
  value: BudgetKey | undefined;
  onChange: (value: BudgetKey) => void;
}) {
  const isAny = value === "any";
  // 버킷 하나에 여러 슬라이더 값이 매핑되기 때문에("20-30k"는 20001~30000원 전부),
  // 정확히 어디를 끌어놨었는지는 Condition에 저장되지 않는다. 컴포넌트 안에서만
  // 원시 슬라이더 위치를 별도로 기억해 드래그가 매끄럽게 느껴지게 한다.
  const [raw, setRaw] = useState(() => (value ? bucketRepresentativeValue(value) : DEFAULT_VALUE));

  // 옵션 버튼과 달리 슬라이더는 항상 어떤 값을 보여주고 있어서 "아직 답 안 함" 상태가
  // 없다. 화면엔 이미 값이 보이는데 다음 버튼은 비활성인 채로 남으면 헷갈리니,
  // 이 스텝에 들어오는 순간 화면에 보이는 기본값을 바로 답으로 커밋해둔다
  useEffect(() => {
    if (value === undefined) onChange(valueToBudgetKey(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSlide(v: number) {
    setRaw(v);
    onChange(valueToBudgetKey(v));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-line bg-cream-soft py-6 text-center">
        <p className="font-serif text-2xl font-bold text-ink">{isAny ? "상관없어요" : valueToLabel(raw)}</p>
      </div>

      <div className={clsx("flex flex-col gap-2.5 transition-opacity", isAny && "pointer-events-none opacity-40")}>
        {/* 네이티브 range 인풋을 그대로 쓰면 드래그·키보드·터치가 모두 기본으로 접근성 있게 동작한다.
            accent-* 유틸리티가 트랙 채움과 손잡이 색을 우리 브랜드 컬러로 맞춰준다 */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={raw}
          disabled={isAny}
          onChange={(e) => handleSlide(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-accent-strong"
          aria-label="1인당 예산"
        />
        <div className="flex justify-between text-xs text-ink-faint">
          <span>2만원</span>
          <span>10만원 이상</span>
        </div>
      </div>

      {/* 흰 카드로 감싸지 않고, 체크박스 + 텍스트만 가볍게 둔다 */}
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={isAny}
          onChange={(e) => onChange(e.target.checked ? "any" : valueToBudgetKey(raw))}
          className="h-4 w-4 accent-accent-strong"
        />
        가격 상관없음
      </label>
    </div>
  );
}
