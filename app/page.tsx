import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
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
        레퍼런스(수거 서비스 앱 홈)처럼 배너를 페이지 배경(연회색 cream)과 구분되는
        흰 카드로 그룹핑한다 — 헤드라인 → 일러스트 → 전체 폭 CTA 순서, CTA는 카드 안에서도
        메인 컬러로 확실히 튀게 한다.
      */}
      <section className="rounded-lg border border-line bg-cream-soft p-6">
        <h1 className="text-[26px] font-bold leading-[1.35] tracking-tight text-ink text-balance">
          청첩장 모임 장소,
          <br />
          <span className="text-accent">고민 없이</span> 골라드려요
        </h1>
        <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">
          용산역·신용산역·삼각지 인근에서
          <br />
          관계와 분위기에 맞는 곳을 찾아드려요.
        </p>

        <Image
          src="/hero-banner.png"
          alt="청첩장이 담긴 봉투 일러스트"
          width={708}
          height={517}
          className="mx-auto my-4 h-40 w-auto"
          priority
        />

        {/* 이 홈 화면에서 타이틀 다음으로 중요한 요소라 본문(text-sm)보다 한 단계 키웠다 */}
        <SearchCta
          source="landing"
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-3.5 text-base font-semibold text-white transition-all hover:bg-accent-strong"
        >
          청모 장소 추천받기
          <ArrowRight className="h-4 w-4" />
        </SearchCta>
      </section>

      {/*
        조회수·저장수 같은 실집계 데이터가 아직 없어서, "실시간 랭킹"이라고 과장하지 않고
        지금 갖고 있는 큐레이션 점수 기준임을 그대로 밝힌다 (lib/places.ts getTopRatedPlaces 참고).
        카드는 그림자 대신 헤어라인 보더로 분리하고, 가격은 숫자만 굵게 써서 한눈에 읽히게 한다.
        순위 번호는 박스로 구분하고, 1위만 포인트 컬러로 강조해 눈에 먼저 들어오게 한다.
      */}
      <section>
        <h2 className="text-lg font-bold tracking-tight text-ink">믿고 가는 청모 장소</h2>
        <p className="mt-1 text-xs text-ink-faint">분위기와 서비스가 좋은 곳으로 골랐어요</p>

        <div className="mt-4 flex flex-col gap-3">
          {topPlaces.map((place, index) => (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="flex items-center gap-4 rounded-md border border-line bg-cream-soft p-4 transition-all hover:bg-cream-strong active:bg-cream-strong"
            >
              <span
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                  index === 0 ? "bg-accent text-white" : "bg-cream-strong text-ink-soft",
                )}
              >
                {index + 1}
              </span>
              <PlaceThumbnail place={place} className="h-16 w-16 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug tracking-tight text-ink">{place.name}</p>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {place.category} · {AREA_LABEL[place.area]}
                </p>
                <p className="mt-1.5 text-xs font-semibold text-accent">
                  {formatPrice(place.priceMin, place.priceMax)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-ink-faint">
        지금은 용산역 · 신용산역 · 삼각지 인근 장소만 다루고 있어요.
      </p>
    </div>
  );
}
