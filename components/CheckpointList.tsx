import { clsx } from "clsx";
import { Check, Minus, TriangleAlert } from "lucide-react";
import { CHECKPOINT_GROUP_ORDER, type Checkpoint } from "@/lib/checkpoints";
import { ICON_COLOR, ICON_MAP } from "@/components/checkpoint-icon-map";

const TONE_ICON: Record<Checkpoint["tone"], typeof Check> = {
  positive: Check,
  neutral: Minus,
  warning: TriangleAlert,
};

const TONE_STYLE: Record<Checkpoint["tone"], string> = {
  positive: "text-sage",
  neutral: "text-ink-faint",
  warning: "text-clay",
};

/** 캐치테이블·네이버지도의 "정보" 섹션처럼, 카드 나열 대신 그룹별 아이콘+한줄 목록으로 보여준다.
 *  라벨/값을 따로 두 줄로 쓰던 걸 한 줄로 합쳐서 더 빠르게 훑을 수 있게 했다. 아이콘·색은
 *  조건입력 위저드의 CategoryIcon과 같은 세트를 재사용해 서비스 전체 톤을 하나로 맞춘다 */
export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const grouped = CHECKPOINT_GROUP_ORDER.map((group) => ({
    group,
    items: checkpoints.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ group, items }) => (
        <div key={group}>
          {/* 이전엔 이 그룹 라벨(모임 조건/식사 조건 등)이 text-sage였다 — sage는 우리
              시스템에서 체크포인트 "긍정" 톤 전용 의미색인데, 여기는 그냥 섹션 캡션이라
              의미가 안 맞았다(어느 디자인 md 규칙도 아니고 예전에 남은 실수). 캡션은
              중성 톤(ink-soft)으로 통일한다.
              레퍼런스(쏘카 "대여조건")처럼 이 라벨이 하위 항목들을 실제로 묶어주는
              소제목으로 읽혀야 위계가 산다 — 예전의 작은 대문자 캡션(text-xs uppercase)
              대신 본문급 굵은 제목(text-sm font-bold)으로 키웠다 */}
          <p className="mb-2 text-sm font-bold text-ink">{group}</p>
          <ul className="divide-y divide-line rounded-md border border-line bg-cream-soft">
            {items.map((c, i) => {
              const ToneIcon = TONE_ICON[c.tone];
              const CategoryIcon = ICON_MAP[c.icon];
              return (
                <li key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-strong">
                    <CategoryIcon className={clsx("h-4 w-4", ICON_COLOR[c.icon])} strokeWidth={1.8} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-ink">{c.text}</p>
                  <ToneIcon className={clsx("h-4 w-4 shrink-0", TONE_STYLE[c.tone])} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
