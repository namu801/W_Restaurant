import { clsx } from "clsx";
import { Check, Minus, TriangleAlert } from "lucide-react";
import { CHECKPOINT_GROUP_ORDER, type Checkpoint } from "@/lib/checkpoints";

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

/** 캐치테이블·네이버지도의 "정보" 섹션처럼, 카드 나열 대신 그룹별 아이콘+라벨+값 목록으로 보여준다.
 *  플랫 11개 카드 그리드보다 위계가 한 단계 줄어서 스캔하기 쉽다 */
export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const grouped = CHECKPOINT_GROUP_ORDER.map((group) => ({
    group,
    items: checkpoints.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage">{group}</p>
          <ul className="divide-y divide-line rounded-md border border-line bg-cream-soft">
            {items.map((c) => {
              const ToneIcon = TONE_ICON[c.tone];
              return (
                <li key={c.label} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-strong text-base" aria-hidden>
                    {c.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink-faint">{c.label}</p>
                    <p className="text-sm text-ink">{c.value}</p>
                  </div>
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
