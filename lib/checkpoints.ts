import { formatPrice, PEOPLE_LABEL } from "./labels";
import type { BudgetKey, Condition, PeopleKey, Place } from "./types";

export type CheckpointTone = "positive" | "neutral" | "warning";
export type CheckpointGroup = "모임 정보" | "식사 조건" | "분위기·공간" | "운영 조건";

export interface Checkpoint {
  label: string;
  value: string;
  tone: CheckpointTone;
  group: CheckpointGroup;
  icon: string;
}

/** 그룹 표시 순서. 조건입력 스텝과 같은 어휘·순서를 써서 "내가 고른 조건이 여기 반영됐구나"를 바로 느끼게 한다 */
export const CHECKPOINT_GROUP_ORDER: CheckpointGroup[] = [
  "모임 정보",
  "식사 조건",
  "분위기·공간",
  "운영 조건",
];

const PEOPLE_RANGE: Record<PeopleKey, [number, number]> = {
  "2": [2, 2],
  "3-4": [3, 4],
  "5-6": [5, 6],
  "7-8": [7, 8],
  "9+": [9, 99],
};

const BUDGET_RANGE: Record<Exclude<BudgetKey, "any">, [number, number]> = {
  "under-20k": [0, 20000],
  "20-30k": [20000, 30000],
  "30-50k": [30000, 50000],
  "over-50k": [50000, Infinity],
};

function scoreTone(score: number, positiveIsHigh = true): CheckpointTone {
  const s = positiveIsHigh ? score : 10 - score;
  if (s >= 7) return "positive";
  if (s >= 4) return "neutral";
  return "warning";
}

function peopleRangeLabel(min: number, max: number): string {
  return max >= 10 ? `${min}명 이상` : `${min}~${max}명`;
}

/** 장소 상세의 "청첩장 모임 체크포인트" 항목을 만든다. 캐치테이블·네이버지도처럼
 *  플랫 카드 나열 대신 조건입력과 같은 4개 그룹으로 묶어서 위계를 줄인다 */
export function buildCheckpoints(place: Place, condition: Condition | null): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  if (condition) {
    const peopleRange = PEOPLE_RANGE[condition.people];
    const overlap = peopleRange[0] <= place.capacityMax && place.capacityMin <= peopleRange[1];
    checkpoints.push({
      group: "모임 정보",
      icon: "👥",
      label: "인원 적합성",
      value: overlap
        ? `${PEOPLE_LABEL[condition.people]} 모임에 적합한 좌석 규모예요`
        : "인원수 대비 좌석 확인이 필요해요",
      tone: overlap ? "positive" : "warning",
    });
  } else {
    checkpoints.push({
      group: "모임 정보",
      icon: "👥",
      label: "인원 적합성",
      value: `${peopleRangeLabel(place.capacityMin, place.capacityMax)} 규모에 적합해요`,
      tone: "neutral",
    });
  }

  checkpoints.push({
    group: "모임 정보",
    icon: "🚇",
    label: "역 접근성",
    value: place.accessScore >= 7 ? "역에서 가까워요" : "역에서 다소 걸어야 해요",
    tone: scoreTone(place.accessScore),
  });

  if (condition && condition.budget !== "any") {
    const need = BUDGET_RANGE[condition.budget];
    const overlap = need[0] <= place.priceMax && place.priceMin <= need[1];
    checkpoints.push({
      group: "식사 조건",
      icon: "💰",
      label: "예산 적합성",
      value: overlap
        ? `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산 범위 안에 들어와요`
        : `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산보다 다소 높을 수 있어요`,
      tone: overlap ? "positive" : "warning",
    });
  } else {
    checkpoints.push({
      group: "식사 조건",
      icon: "💰",
      label: "예산 적합성",
      value: `1인 ${formatPrice(place.priceMin, place.priceMax)} 수준이에요`,
      tone: "neutral",
    });
  }

  const selectedCuisines = condition?.cuisines.filter((c) => c !== "any") ?? [];
  const foodMatched =
    selectedCuisines.length > 0
      ? selectedCuisines.some((c) => place.cuisineTags.includes(c))
      : null;
  checkpoints.push({
    group: "식사 조건",
    icon: "🍽️",
    label: "음식 적합성",
    value:
      foodMatched === null
        ? `${place.category} 위주의 메뉴예요`
        : foodMatched
          ? "선호하는 음식 종류와 잘 맞아요"
          : "선호하는 음식 종류와는 다를 수 있어요",
    tone: foodMatched === null ? "neutral" : foodMatched ? "positive" : "warning",
  });

  checkpoints.push({
    group: "분위기·공간",
    icon: "💬",
    label: "대화 가능성",
    value:
      place.conversationScore >= 7
        ? "대화하기 좋아요"
        : place.conversationScore >= 4
          ? "대화하기 무난해요"
          : "대화가 다소 어려울 수 있어요",
    tone: scoreTone(place.conversationScore),
  });

  checkpoints.push({
    group: "분위기·공간",
    icon: "🤝",
    label: "분위기·대접감",
    value:
      place.hospitalityScore >= 7
        ? "대접하는 느낌을 주기 좋아요"
        : place.hospitalityScore >= 4
          ? "무난한 수준의 대접감이에요"
          : "격식 있는 자리로는 다소 아쉬울 수 있어요",
    tone: scoreTone(place.hospitalityScore),
  });

  const seatValue =
    place.seatType === "room"
      ? "독립된 룸이 있어요"
      : place.seatType === "semi-private"
        ? "반분리된 좌석이 있어요"
        : place.seatType === "wide"
          ? "좌석 간격이 넓은 편이에요"
          : "오픈된 좌석 위주예요";
  checkpoints.push({
    group: "분위기·공간",
    icon: "🪑",
    label: "좌석·공간",
    value: seatValue,
    tone: place.seatType === "open" ? "neutral" : "positive",
  });

  const reservationValue =
    place.reservationMethod === "available"
      ? "예약 없이도 방문 가능한 편이에요"
      : place.reservationMethod === "phone"
        ? "전화로 미리 예약해두는 게 안전해요"
        : place.reservationMethod === "difficult"
          ? "예약이 까다로운 편이라 서둘러야 해요"
          : "예약을 받지 않는 곳이에요";
  checkpoints.push({
    group: "운영 조건",
    icon: "📅",
    label: "예약 편의",
    value: reservationValue,
    tone:
      place.reservationMethod === "available"
        ? "positive"
        : place.reservationMethod === "phone"
          ? "neutral"
          : "warning",
  });

  checkpoints.push({
    group: "운영 조건",
    icon: "⏳",
    label: "웨이팅 리스크",
    value:
      place.waitingRisk >= 6
        ? "피크타임엔 웨이팅이 있을 수 있어요"
        : place.waitingRisk >= 3
          ? "가끔 대기가 있을 수 있어요"
          : "웨이팅 걱정은 적은 편이에요",
    tone: scoreTone(place.waitingRisk, false),
  });

  checkpoints.push({
    group: "운영 조건",
    icon: "⭐",
    label: "서비스 안정감",
    value: place.serviceScore >= 7 ? "서비스가 안정적이에요" : "서비스 편차가 있을 수 있어요",
    tone: scoreTone(place.serviceScore),
  });

  checkpoints.push({
    group: "운영 조건",
    icon: "🅿️",
    label: "주차",
    value: place.parkingAvailable
      ? place.parkingType === "valet"
        ? "발렛 주차가 가능해요"
        : "주차가 가능해요"
      : "별도 주차 공간은 없어요",
    tone: place.parkingAvailable ? "positive" : "neutral",
  });

  return checkpoints;
}
