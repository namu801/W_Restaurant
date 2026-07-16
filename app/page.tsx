import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SearchCta } from "@/components/SearchCta";
import { TrackOnMount } from "@/components/TrackOnMount";
import { OnboardingModal } from "@/components/OnboardingModal";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { getTopRatedPlaces } from "@/lib/places";
import { AREA_LABEL, formatPrice } from "@/lib/labels";

export default function LandingPage() {
  const topPlaces = getTopRatedPlaces(5);

  return (
    <div className="flex flex-col gap-9">
      <TrackOnMount event="landing_viewed" props={{ source: "direct" }} />
      <OnboardingModal />

      {/*
        코랄 원색을 배경 전체에 깔면 채도가 과해 촌스러워 보인다.
        그렇다고 그라디언트 끝을 페이지 배경색(cream)까지 옅게 빼면 그 지점에서 배너가
        페이지에 녹아 없어져 버린다. 블러쉬→골드 두 톤 다 페이지보다 또렷하게 유지하고,
        테두리를 더해 카드 경계를 분명히 하면서 코랄은 CTA 버튼에 온전히 남긴다.
      */}
      <section className="rounded-lg border border-accent/15 bg-gradient-to-br from-accent-soft to-gold-soft px-6 py-7">

        <h1 className="font-serif text-2xl font-bold leading-snug text-ink">
          우리 청모에 맞는
          <br />
          장소를 찾아볼까요?
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
          당신만의 기준에 딱 맞는 장소를 추천해드릴게요.
        </p>
        {/* 배너 자체가 rounded-lg라, CTA도 완전히 둥근 필 대신 같은 계열(rounded-lg)로 맞춰서
            버튼이 배너와 다른 디자인 언어처럼 튀어 보이지 않게 한다 */}
        <SearchCta
          source="landing"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent-strong px-5 py-3.5 text-sm font-bold text-white shadow-card transition-colors hover:bg-accent active:bg-accent"
        >
          청모 장소 추천받기
          <ArrowRight className="h-4 w-4" />
        </SearchCta>
      </section>

      {/*
        조회수·저장수 같은 실집계 데이터가 아직 없어서, "실시간 랭킹"이라고 과장하지 않고
        지금 갖고 있는 큐레이션 점수 기준임을 그대로 밝힌다 (lib/places.ts getTopRatedPlaces 참고).
        순번은 참고용일 뿐이라 강조색 없이 옅게 두고, 사진 대신 음식 종류 아이콘 썸네일로
        장소를 시각적으로 구분한다.
      */}
      <section>
        <h2 className="font-serif text-lg font-bold text-ink">믿고 골라본 장소</h2>
        <p className="mt-1 text-xs text-ink-faint">분위기와 서비스가 좋은 곳으로 골랐어요</p>

        {/* 이름 옆에 가격까지 한 줄에 욱여넣으면 가격이 길 때 이름이 잘린다.
            가격을 아래 줄로 내려서, 이름은 절대 잘리지 않고 필요하면 자연스럽게 줄바꿈된다.
            줄 사이 간격이 너무 좁아 답답해 보였던 걸 카드 패딩·썸네일 크기·줄 간격을 함께 넓혀서 풀었다 */}
        <div className="mt-4 flex flex-col gap-3">
          {topPlaces.map((place, index) => (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="flex items-center gap-4 rounded-md border border-line bg-cream-soft p-4 transition-colors hover:border-line-strong active:bg-cream-strong"
            >
              <span className="w-4 shrink-0 text-center font-serif text-base font-bold text-ink">
                {index + 1}
              </span>
              <PlaceThumbnail place={place} className="h-16 w-16 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-ink">{place.name}</p>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {place.category} · {AREA_LABEL[place.area]}
                </p>
                <p className="mt-1.5 text-xs font-bold text-ink">
                  {formatPrice(place.priceMin, place.priceMax)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-ink-faint">
        지금은 강남역 · 신논현 · 논현 인근 장소만 다루고 있어요.
      </p>
    </div>
  );
}
