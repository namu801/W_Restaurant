import type { ReactNode } from "react";
import Link from "next/link";
import { Info, Sparkles } from "lucide-react";

/**
 * 결과 목록 맨 위의 큐레이터 메시지. 흐릿한 요약 한 줄 대신, 큐레이터가 이 모임을 어떻게 이해하고
 * 무엇을 먼저 챙겼는지 말을 걸고(제목), 바로 이어서 해볼 만한 다음 요청을 칩으로 건넨다.
 * 칩은 실제로 결과가 달라지는 조건 변경만 보여주고, 바뀐 뒤의 곳 수를 같이 적는다.
 *
 * 2px 진한 테두리 + 주황 그림자는 납작한 식당 목록 위에서 혼자 떠 보였다. 레퍼런스(캐치테이블
 * "AI가 요약했어요")처럼 1px 그라디언트 선 + 안쪽에 아주 옅은 틴트만 깔고 그림자는 뺐다.
 * 선은 양 끝 모두 같은 진하기로 둔다 — 한쪽을 투명하게 빼면 선이 끊긴 듯 지저분해 보였다.
 */
export function CurationAgentCard({
  subject,
  rest,
  suggestions,
}: {
  subject: string;
  rest: string;
  suggestions: { text: string; href: string; count: number }[];
}) {
  return (
    <CuratorFrame>
      <p className="flex items-center gap-1.5 text-caption font-semibold text-ink">
        <Sparkles className="h-4 w-4 text-accent" strokeWidth={2} fill="currentColor" aria-hidden />
        청모픽 큐레이터
      </p>
      <h2 className="mt-2 text-title font-bold text-ink">
        <span className="text-accent">{subject}</span>
        {rest}
      </h2>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-soft/80 px-3.5 py-2 text-label font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-cream-strong active:scale-[0.98]"
            >
              {s.text}
              <span className="text-caption text-ink-faint">{s.count}곳</span>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1 text-micro text-ink-faint">
        고른 조건과 식당 데이터로 정리한 결과예요
        <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </p>
    </CuratorFrame>
  );
}

/** 큐레이터가 말하는 자리(결과 상단 카드, 상세의 추천 이유)에만 쓰는 테두리. 이 모양이 보이면
 *  "청모픽이 정리한 내용"이라는 신호가 되도록 다른 곳에는 쓰지 않는다 */
export function CuratorFrame({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg bg-gradient-to-br from-accent-light/60 via-accent/35 to-accent/60 p-px">
      <div className="rounded-[15px] bg-cream-soft bg-gradient-to-br from-transparent from-40% to-accent-soft/50 px-4 py-4">
        {children}
      </div>
    </section>
  );
}
