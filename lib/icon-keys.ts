/** 추천 이유 카드가 쓰는 아이콘 키. 실제 lucide 컴포넌트가 아니라 문자열만 갖고 있는
 *  이유는 lib/reason.ts가 서버 컴포넌트(장소 상세 페이지)에서 호출되는데, 컴포넌트(함수)를
 *  그대로 클라이언트 컴포넌트에 prop으로 넘기면 "Functions cannot be passed to Client
 *  Components" 에러가 나기 때문이다. 실제 아이콘 컴포넌트로의 매핑은 클라이언트 쪽인
 *  components/checkpoint-icon-map.tsx에서 한다 */
export type ReasonIconKey =
  | "users"
  | "map-pinned"
  | "wallet"
  | "utensils-crossed"
  | "message-circle"
  | "heart-handshake"
  | "armchair"
  | "calendar-check"
  | "clock-3"
  | "star"
  | "square-parking"
  | "sparkles";
