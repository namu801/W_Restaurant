import type { ReactNode } from "react";

/**
 * 예약 전 확인 문장에서 결정에 바로 걸리는 말(룸 여부, 예약 방식, 주차, 웨이팅, 휴무, 추가 비용)만
 * 형광펜으로 칠한다. 문장 전체를 굵게 하면 다 중요해 보여 아무것도 안 보이므로, 짧은 구절만 고른다.
 * 그어지는 동작은 부모에 .hl-on이 붙을 때 globals.css의 .hl이 처리한다.
 */
const KEY_PHRASES: RegExp[] = [
  /완전 독립된 룸은 아니고/,
  /개별 룸은 없는/,
  /프라이버시는 제한적이에요/,
  /룸은 \d+인 이상부터/,
  /차지비용 \d+만원/,
  /1인 1만원 예약금|인당 1만원의 예약금/,
  /예약을 받지 않고/,
  /사전 예약이 필수/,
  /전화로만 예약 가능/,
  /주차(는)? 불가/,
  /(전용|자체) 주차장이 없어|주차장 없어/,
  /주차 공간은 없어/,
  /주차공간이 협소/,
  /웨이팅이 (잦|많|길|자주|있)[^\s,.]*/,
  /대기가 (있을|많은|생길)[^\s,.]*/,
  /월요일은 휴무/,
  /주류 주문이 필수/,
  /브레이크타임\([^)]*\)/,
  /테이블 간격이 좁아/,
  /일부만 겹쳐요/,
  /예산을 넘을 수 있어요/,
  /콜키지 가능 여부는|콜키지 프리|콜키지는 유료/,
  /외부 주류 반입이 어려워요/,
];

/** 겹치지 않는 [시작, 끝] 구간을 앞에서부터 모은다 */
function findRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const re of KEY_PHRASES) {
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index;
    const end = start + m[0].length;
    if (ranges.some(([s, e]) => start < e && end > s)) continue;
    ranges.push([start, end]);
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}

/** startIndex: 목록 전체에서 몇 번째 형광펜인지(위에서부터 차례로 그어지게) */
export function HighlightText({ text, startIndex = 0 }: { text: string; startIndex?: number }) {
  const ranges = findRanges(text);
  if (ranges.length === 0) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], i) => {
    if (s > cursor) parts.push(text.slice(cursor, s));
    parts.push(
      <mark key={s} className="hl bg-transparent font-semibold text-ink" style={{ "--hl-i": startIndex + i } as React.CSSProperties}>
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export function countHighlights(text: string): number {
  return findRanges(text).length;
}
