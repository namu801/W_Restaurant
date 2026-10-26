import { PLACE_PHOTOS } from "./place-photos";
import type { CuisineKey, VibeKey } from "./types";

/**
 * 조건 입력의 사진 카드에 쓰는 사진. 새 파일을 따로 두지 않고 식당 사진(public/places)에서
 * [식당 이름, 사진 순번(0부터)]으로 가리킨다 — 경로 문자열을 직접 쓰면 한글 파일명의
 * NFC/NFD 차이로 배포 환경에서 깨질 수 있어서(lib/place-photos.ts 주석 참고) 항상
 * PLACE_PHOTOS를 거친다.
 *
 * 고르는 기준
 * - 분위기: 그 분위기를 실제로 가진 식당의 공간 사진(카테고리·소음·격식 데이터가 카드와 맞는 곳)
 * - 음식: 그 메뉴 태그(cuisineTags)를 실제로 가진 식당의 음식 사진
 * 사진을 바꿀 땐 이 표만 고치면 된다.
 *
 * 카드 아래쪽 35%쯤은 이름·설명 글씨에 가려서, 핵심 장면(테이블·손님)이 사진 아래에 있으면
 * 천장만 보인다. 그런 사진은 장면이 위쪽에 오도록 잘라 public/wizard/에 따로 두고 경로로
 * 가리킨다(파일명이 영문이라 NFC/NFD 문제가 없다). 원본은 public/places 그대로다.
 */
type PhotoRef = readonly [placeName: string, index: number] | `/wizard/${string}`;

const VIBE_PHOTO_REF: Record<Exclude<VibeKey, "any">, PhotoRef> = {
  "calm-formal": ["쿠촐로서울", 1], // 커튼으로 나뉜 단독 룸 · 조용 · 격식
  "neat-comfy": ["미미옥 신용산점", 4], // 우드 톤으로 정돈된 단체석 · 무난한 격식
  trendy: "/wizard/vibe-trendy.jpg", // 버누드 1번 사진에서 곡선 바·테이블 쪽을 잘라냄 · 감성 점수 5
  "lively-casual": "/wizard/vibe-lively.jpg", // 양복점 4번 사진에서 손님이 먹고 마시는 쪽을 잘라냄
};

const CUISINE_PHOTO_REF: Partial<Record<CuisineKey, PhotoRef>> = {
  korean: ["한량주가", 0],
  japanese: ["우나 용산본점", 3],
  chinese: ["크리스탈제이드 용산아이파크몰점", 0],
  western: ["먼치 용산", 4],
  meat: ["양복점 용산점", 1],
  seafood: ["용산봉숭아", 1],
  "brunch-cafe": ["쇼니노", 0],
};

function resolve(ref: PhotoRef | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return PLACE_PHOTOS[ref[0]]?.[ref[1]];
}

export function vibePhoto(vibe: VibeKey): string | undefined {
  return vibe === "any" ? undefined : resolve(VIBE_PHOTO_REF[vibe]);
}

export function cuisinePhoto(cuisine: CuisineKey): string | undefined {
  return resolve(CUISINE_PHOTO_REF[cuisine]);
}
