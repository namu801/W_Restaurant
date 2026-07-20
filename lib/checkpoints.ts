import { formatPrice, PEOPLE_LABEL } from "./labels";
import type { BudgetKey, Condition, PeopleKey, Place } from "./types";
import type { ReasonIconKey } from "./icon-keys";

export type CheckpointTone = "positive" | "neutral" | "warning";

export interface Checkpoint {
  /** 위계를 두 줄(라벨+값)에서 한 줄로 줄였다 — "대화 가능성" 같은 항목명 대신
   *  "대화하기 좋은 분위기"처럼 바로 읽히는 문장 하나로 합쳤다 */
  text: string;
  tone: CheckpointTone;
  icon: ReasonIconKey;
}

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

/** 장소 상세의 "내 모임에 맞을까요" 항목을 만든다. 예전엔 모임정보/식사조건/분위기·공간/
 *  운영조건 4개 카테고리로 묶었는데, "충족/정보부족/주의"를 체크·대시·경고 아이콘 하나로만
 *  표현해서 판단이 잘 안 섰다 — 이제 각 항목은 tone(positive/neutral/warning)만 들고 있고,
 *  실제 "잘 맞아요/무난해요/확인이 필요해요" 3단 그룹핑은 components/CheckpointList.tsx가
 *  이 tone 기준으로 다시 묶는다 */
export function buildCheckpoints(place: Place, condition: Condition | null): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  if (condition) {
    const peopleRange = PEOPLE_RANGE[condition.people];
    const overlap = peopleRange[0] <= place.capacityMax && place.capacityMin <= peopleRange[1];
    checkpoints.push({
      icon: "users",
      text: overlap
        ? `${PEOPLE_LABEL[condition.people]} 모임에 적합한 좌석 규모예요`
        : "인원수 대비 좌석 확인이 필요해요",
      tone: overlap ? "positive" : "warning",
    });
  } else {
    checkpoints.push({
      icon: "users",
      text: `${peopleRangeLabel(place.capacityMin, place.capacityMax)} 규모에 적합해요`,
      tone: "neutral",
    });
  }

  checkpoints.push({
    icon: "map-pinned",
    text: place.accessScore >= 7 ? "역에서 가까워 모이기 편해요" : "역에서 다소 걸어야 해요",
    tone: scoreTone(place.accessScore),
  });

  if (condition && condition.budget !== "any") {
    const need = BUDGET_RANGE[condition.budget];
    const overlap = need[0] <= place.priceMax && place.priceMin <= need[1];
    // 범위 안이라도 상한에 바짝 붙어 있으면("여유롭지 않음") 무조건 긍정으로 뭉치지 않고
    // 무난함 톤으로 따로 구분한다 — "범위 안 = 다 좋음"이 아니라는 걸 정직하게 알려준다
    const isTight = overlap && need[1] !== Infinity && place.priceMax >= need[1] * 0.9;
    checkpoints.push({
      icon: "wallet",
      text: !overlap
        ? `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산보다 다소 높을 수 있어요`
        : isTight
          ? `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산 범위 안이지만 여유롭지는 않아요`
          : `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산 범위 안이에요`,
      tone: !overlap ? "warning" : isTight ? "neutral" : "positive",
    });
  } else {
    checkpoints.push({
      icon: "wallet",
      text: `1인 ${formatPrice(place.priceMin, place.priceMax)} 수준이에요`,
      tone: "neutral",
    });
  }

  const selectedCuisines = condition?.cuisines.filter((c) => c !== "any") ?? [];
  const foodMatched =
    selectedCuisines.length > 0
      ? selectedCuisines.some((c) => place.cuisineTags.includes(c))
      : null;
  checkpoints.push({
    icon: "utensils-crossed",
    text:
      foodMatched === null
        ? `${place.category} 위주의 메뉴예요`
        : foodMatched
          ? "선호하는 음식 종류와 잘 맞아요"
          : "선호하는 음식 종류와는 다를 수 있어요",
    tone: foodMatched === null ? "neutral" : foodMatched ? "positive" : "warning",
  });

  checkpoints.push({
    icon: "message-circle",
    text:
      place.conversationScore >= 7
        ? "대화하기 좋은 분위기예요"
        : place.conversationScore >= 4
          ? "대화하기 무난한 분위기예요"
          : "대화가 다소 어려울 수 있어요",
    tone: scoreTone(place.conversationScore),
  });

  checkpoints.push({
    icon: "heart-handshake",
    text:
      place.hospitalityScore >= 7
        ? "대접하기 좋은 분위기예요"
        : place.hospitalityScore >= 4
          ? "무난한 수준의 대접감이에요"
          : "격식 있는 자리로는 다소 아쉬울 수 있어요",
    tone: scoreTone(place.hospitalityScore),
  });

  const seatText =
    place.seatType === "room"
      ? "독립된 룸이 있어요"
      : place.seatType === "semi-private"
        ? "반분리된 좌석이 있어요"
        : place.seatType === "wide"
          ? "좌석 간격이 넓은 편이에요"
          : "오픈된 좌석 위주예요";
  checkpoints.push({
    icon: "armchair",
    text: seatText,
    tone: place.seatType === "open" ? "neutral" : "positive",
  });

  const reservationText =
    place.reservationMethod === "available"
      ? "예약 없이도 방문 가능한 편이에요"
      : place.reservationMethod === "phone"
        ? "전화로 미리 예약해두는 게 안전해요"
        : place.reservationMethod === "difficult"
          ? "예약이 까다로운 편이라 서둘러야 해요"
          : "예약을 받지 않는 곳이에요";
  checkpoints.push({
    icon: "calendar-check",
    text: reservationText,
    tone:
      place.reservationMethod === "available"
        ? "positive"
        : place.reservationMethod === "phone"
          ? "neutral"
          : "warning",
  });

  checkpoints.push({
    icon: "clock-3",
    text:
      place.waitingRisk >= 6
        ? "피크타임엔 웨이팅이 있을 수 있어요"
        : place.waitingRisk >= 3
          ? "가끔 대기가 있을 수 있어요"
          : "웨이팅 걱정은 적은 편이에요",
    tone: scoreTone(place.waitingRisk, false),
  });

  checkpoints.push({
    icon: "star",
    text: place.serviceScore >= 7 ? "서비스가 안정적이에요" : "서비스 편차가 있을 수 있어요",
    tone: scoreTone(place.serviceScore),
  });

  checkpoints.push({
    icon: "square-parking",
    text: place.parkingAvailable
      ? place.parkingType === "valet"
        ? "발렛 주차가 가능해요"
        : "주차가 가능해요"
      : "별도 주차 공간은 없어요",
    tone: place.parkingAvailable ? "positive" : "neutral",
  });

  return checkpoints;
}
