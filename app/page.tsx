import { ArrowRight, MessageCircleHeart, ShieldCheck, Wallet } from "lucide-react";
import { SearchCta } from "@/components/SearchCta";
import { TrackOnMount } from "@/components/TrackOnMount";

const VALUE_POINTS = [
  {
    icon: MessageCircleHeart,
    title: "관계 중심 탐색",
    description: "친구, 동료, 선배, 가족 — 만나는 사람에 맞는 후보부터 좁혀드려요.",
  },
  {
    icon: ShieldCheck,
    title: "추천 이유와 확인할 점",
    description: "왜 적합한지, 예약·웨이팅 리스크는 없는지 함께 알려드려요.",
  },
  {
    icon: Wallet,
    title: "부담 없는 예산 매칭",
    description: "1인 예산과 대접감 사이, 딱 맞는 지점을 찾아드려요.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-10">
      <TrackOnMount event="landing_viewed" props={{ source: "direct" }} />

      <section className="pt-6 text-center">
        <p className="text-sm font-medium text-accent-strong">청첩자리</p>
        <h1 className="mt-3 text-2xl font-bold leading-snug text-ink sm:text-3xl">
          청첩장 모임,
          <br />
          어디서 해야 덜 고민될까요?
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
          만나는 사람, 예산, 분위기, 피하고 싶은 조건을 기준으로 청첩장
          모임에 맞는 장소를 찾아보세요.
        </p>

        <SearchCta
          source="landing"
          className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-card transition-colors hover:bg-ink/90"
        >
          모임 장소 찾아보기
          <ArrowRight className="h-4 w-4" />
        </SearchCta>
      </section>

      <section className="grid grid-cols-1 gap-3">
        {VALUE_POINTS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4"
          >
            <div className="rounded-full bg-accent-soft p-2 text-accent-strong">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-ink-faint">
        지금은 강남역 · 신논현 · 논현 인근 장소를 중심으로 서비스하고 있어요.
      </p>
    </div>
  );
}
