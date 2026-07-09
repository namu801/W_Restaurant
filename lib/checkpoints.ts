import { formatPrice, PEOPLE_LABEL } from "./labels";
import type { Condition, Place } from "./types";

export type CheckpointTone = "positive" | "neutral" | "warning";

export interface Checkpoint {
  label: string;
  value: string;
  tone: CheckpointTone;
}

function scoreTone(score: number, positiveIsHigh = true): CheckpointTone {
  const s = positiveIsHigh ? score : 10 - score;
  if (s >= 7) return "positive";
  if (s >= 4) return "neutral";
  return "warning";
}

function peopleRangeLabel(min: number, max: number): string {
  return max >= 10 ? `${min}명 이상` : `${min}~${max}명`;
}

/** 장소 상세(8.4)의 "청첩장 모임 체크포인트" 10개 항목을 만든다 */
export function buildCheckpoints(
  place: Place,
  condition: Condition | null,
): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];

  checkpoints.push({
    label: "대화 가능성",
    value:
      place.conversationScore >= 7
        ? "대화하기 좋아요"
        : place.conversationScore >= 4
          ? "대화하기 무난해요"
          : "대화가 다소 어려울 수 있어요",
    tone: scoreTone(place.conversationScore),
  });

  if (condition) {
    const need = { "under-20k": [0, 20000], "20-30k": [20000, 30000], "30-50k": [30000, 50000], "over-50k": [50000, Infinity] }[condition.budget];
    const overlap = need[0] <= place.priceMax && place.priceMin <= need[1];
    checkpoints.push({
      label: "예산 적합성",
      value: overlap
        ? `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산 범위 안에 들어와요`
        : `1인 ${formatPrice(place.priceMin, place.priceMax)}, 예산보다 다소 높을 수 있어요`,
      tone: overlap ? "positive" : "warning",
    });
  } else {
    checkpoints.push({
      label: "예산 적합성",
      value: `1인 ${formatPrice(place.priceMin, place.priceMax)} 수준이에요`,
      tone: "neutral",
    });
  }

  if (condition) {
    const peopleRange = { "2": [2, 2], "3-4": [3, 4], "5-6": [5, 6], "7+": [7, 99] }[condition.people];
    const overlap = peopleRange[0] <= place.capacityMax && place.capacityMin <= peopleRange[1];
    checkpoints.push({
      label: "인원 적합성",
      value: overlap
        ? `${PEOPLE_LABEL[condition.people]} 모임에 적합한 좌석 규모예요`
        : "인원수 대비 좌석 확인이 필요해요",
      tone: overlap ? "positive" : "warning",
    });
  } else {
    checkpoints.push({
      label: "인원 적합성",
      value: `${peopleRangeLabel(place.capacityMin, place.capacityMax)} 규모에 적합해요`,
      tone: "neutral",
    });
  }

  checkpoints.push({
    label: "역 접근성",
    value: place.accessScore >= 7 ? "역에서 가까워요" : "역에서 다소 걸어야 해요",
    tone: scoreTone(place.accessScore),
  });

  checkpoints.push({
    label: "대접감",
    value:
      place.hospitalityScore >= 7
        ? "대접하는 느낌을 주기 좋아요"
        : place.hospitalityScore >= 4
          ? "무난한 수준의 대접감이에요"
          : "격식 있는 자리로는 다소 아쉬울 수 있어요",
    tone: scoreTone(place.hospitalityScore),
  });

  const alcoholRelevantScore =
    condition?.alcohol === "no-alcohol" ? place.nonAlcoholFit : place.alcoholFit;
  checkpoints.push({
    label: "술/무알콜 적합도",
    value:
      condition?.alcohol === "no-alcohol"
        ? place.nonAlcoholFit >= 7
          ? "술 없이 식사만 하기에도 좋아요"
          : "무알콜 식사 자리로는 다소 아쉬울 수 있어요"
        : place.alcoholFit >= 7
          ? "술자리로도 무리 없어요"
          : "가벼운 반주 정도로 어울려요",
    tone: scoreTone(alcoholRelevantScore),
  });

  checkpoints.push({
    label: "예약 필요성",
    value:
      place.reservationDifficulty >= 7
        ? "예약이 까다로운 편이라 서둘러야 해요"
        : place.reservationDifficulty >= 4
          ? "미리 예약해두는 게 안전해요"
          : "예약 없이도 가능한 편이에요",
    tone: scoreTone(place.reservationDifficulty, false),
  });

  checkpoints.push({
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
    label: "서비스 안정감",
    value: place.serviceScore >= 7 ? "서비스가 안정적이에요" : "서비스 편차가 있을 수 있어요",
    tone: scoreTone(place.serviceScore),
  });

  checkpoints.push({
    label: "룸/분리 공간 여부",
    value: place.privateRoomAvailable ? "룸/분리 공간이 있어요" : "오픈된 좌석 위주예요",
    tone: place.privateRoomAvailable ? "positive" : "neutral",
  });

  return checkpoints;
}
