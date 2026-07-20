import { clsx } from "clsx";
import type { Checkpoint } from "@/lib/checkpoints";
import { ICON_COLOR, ICON_MAP } from "@/components/checkpoint-icon-map";

/** 예전엔 체크(✓)/대시(—)/경고(⚠) 아이콘 하나로만 "이게 충족인지, 정보 부족인지,
 *  중요하지 않은지"를 표현해야 해서 판단이 잘 안 섰다 — 아이콘 대신 그룹 자체를
 *  "잘 맞아요/무난해요/확인이 필요해요"라는 판단 언어로 나눠서, 어느 묶음에 있는지만
 *  봐도 바로 감이 오게 한다. 원래 쓰던 모임정보/식사조건/분위기·공간/운영조건 같은
 *  대분류 대신, tone(긍정/보통/주의) 기준으로 다시 묶는다 */
const TONE_ORDER: Checkpoint["tone"][] = ["positive", "neutral", "warning"];

const TONE_LABEL: Record<Checkpoint["tone"], string> = {
  positive: "잘 맞아요",
  neutral: "무난해요",
  warning: "확인이 필요해요",
};

const TONE_HEADING_STYLE: Record<Checkpoint["tone"], string> = {
  positive: "text-sage",
  neutral: "text-ink-soft",
  warning: "text-clay",
};

export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const grouped = TONE_ORDER.map((tone) => ({
    tone,
    items: checkpoints.filter((c) => c.tone === tone),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ tone, items }) => (
        <div key={tone}>
          <p className={clsx("mb-2 text-sm font-bold", TONE_HEADING_STYLE[tone])}>{TONE_LABEL[tone]}</p>
          <ul className="divide-y divide-line rounded-md border border-line bg-cream-soft">
            {items.map((c, i) => {
              const CategoryIcon = ICON_MAP[c.icon];
              return (
                <li key={i} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-strong">
                    <CategoryIcon className={clsx("h-4 w-4", ICON_COLOR[c.icon])} strokeWidth={1.8} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-ink">{c.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
