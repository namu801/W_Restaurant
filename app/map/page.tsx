"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";
import { clsx } from "clsx";
import { PLACES } from "@/lib/places";
import { KakaoMap, type KakaoMapHandle } from "@/components/KakaoMap";
import { isWithinServiceArea } from "@/lib/service-area";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { Tag } from "@/components/ui/Tag";
import { AREA_LABEL, CUISINE_LABEL, SEAT_TYPE_LABEL, formatPrice } from "@/lib/labels";
import { CUISINE_ICON } from "@/lib/option-icons";
import { track } from "@/lib/analytics";
import type { CuisineKey } from "@/lib/types";

type FilterableCuisine = Exclude<CuisineKey, "any">;

const CUISINE_FILTERS = (Object.keys(CUISINE_LABEL) as CuisineKey[]).filter(
  (k): k is FilterableCuisine => k !== "any",
);

export default function MapPage() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [cuisineFilter, setCuisineFilter] = useState<FilterableCuisine | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const mapHandleRef = useRef<KakaoMapHandle>(null);
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const stripRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // 핀 클릭으로 카드를 자동 스크롤시키는 동안, 그 스크롤 자체를 "사용자가 스와이프했다"고
  // 옵저버가 오해해서 selectedId를 다시 덮어써버리는 루프를 막기 위한 잠금장치
  const suppressScrollSyncRef = useRef(false);
  const scrollSyncTimeoutRef = useRef<number | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const places = useMemo(() => {
    return PLACES.filter((p) => !cuisineFilter || p.cuisineTags.includes(cuisineFilter));
  }, [cuisineFilter]);

  const filterEdges = useScrollEdges(filterRef);
  const stripEdges = useScrollEdges(stripRef, places.length);

  /** 화살표로 카드를 한 장씩 넘긴다. 선택 상태는 스크롤이 멈추면 handleStripScroll이 맞춘다 */
  function stepCard(dir: 1 | -1) {
    const idx = places.findIndex((p) => p.id === selectedId);
    const next = places[Math.min(Math.max((idx < 0 ? 0 : idx) + dir, 0), places.length - 1)];
    if (!next) return;
    setSelectedId(next.id);
    cardRefs.current[next.id]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  useEffect(() => {
    if (selectedId && !places.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [places, selectedId]);

  // 스크롤 디바운스·토스트 자동 닫힘 타이머가 화면을 떠난 뒤에도 남아 있다가
  // 언마운트된 컴포넌트에 setState를 걸지 않도록 정리한다
  useEffect(() => {
    return () => {
      if (scrollSyncTimeoutRef.current) window.clearTimeout(scrollSyncTimeoutRef.current);
      if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  function selectFromPin(id: string) {
    suppressScrollSyncRef.current = true;
    setSelectedId(id);
    track("map_marker_clicked", { place_id: id });
    cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    window.setTimeout(() => {
      suppressScrollSyncRef.current = false;
    }, 500);
  }

  // 카드를 가로로 스와이프하면, 왼쪽 시작선에 가장 가깝게 걸린 카드를 선택 상태로 보고 지도가 그 위치로 따라간다.
  // 스크롤 이벤트마다 바로 지도를 옮기면 스와이프 도중 지도가 계속 흔들리므로, 스크롤이
  // 잠깐 멈췄을 때(디바운스) 한 번만 계산해서 반영한다
  function handleStripScroll(e: React.UIEvent<HTMLDivElement>) {
    if (suppressScrollSyncRef.current) return;
    const strip = e.currentTarget;
    if (scrollSyncTimeoutRef.current) window.clearTimeout(scrollSyncTimeoutRef.current);
    scrollSyncTimeoutRef.current = window.setTimeout(() => {
      // 카드는 왼쪽 정렬로 멈추므로, 왼쪽 시작선(안쪽 여백 16px)에 가장 가까운 카드를 선택으로 본다
      const stripStart = strip.getBoundingClientRect().left + 16;
      let closestId: string | null = null;
      let closestDistance = Infinity;
      for (const [id, el] of Object.entries(cardRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.left - stripStart);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = id;
        }
      }
      setSelectedId((prev) => (closestId && closestId !== prev ? closestId : prev));
    }, 120);
  }

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(null), 2800);
  }

  function handleLocate() {
    const handle = mapHandleRef.current;
    if (!handle?.isReady()) return;
    track("map_locate_clicked", {});

    if (!navigator.geolocation) {
      showNotice("이 브라우저는 위치 확인을 지원하지 않아요. 용산권으로 이동할게요.");
      handle.panToServiceCenter();
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (isWithinServiceArea(latitude, longitude)) {
          handle.showMeMarker(latitude, longitude);
          handle.panTo(latitude, longitude);
        } else {
          showNotice("서비스 지역 밖이에요. 용산권으로 이동할게요.");
          handle.panToServiceCenter();
        }
      },
      () => {
        setLocating(false);
        showNotice("위치를 확인할 수 없어요. 용산권으로 이동할게요.");
        handle.panToServiceCenter();
      },
      { timeout: 6000 },
    );
  }

  return (
    <div className="relative h-full w-full">
      <TrackOnMount event="map_viewed" props={{ place_count: PLACES.length }} />

      {appKey ? (
        <KakaoMap
          ref={mapHandleRef}
          places={places}
          appKey={appKey}
          selectedId={selectedId}
          onSelectPlace={selectFromPin}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-6">
          <EmptyState
            title="지도를 표시하려면 API 키가 필요해요."
            description={
              "카카오 개발자 콘솔(developers.kakao.com)에서 JavaScript 키를 발급받아\n.env.local의 NEXT_PUBLIC_KAKAO_MAP_KEY에 넣어주세요."
            }
          />
        </div>
      )}

      {/* 상단 플로팅 필터: 지도 위에 뜨는 독립된 칩들이라 각자 배경·그림자를 갖는다 */}
      <div className="absolute inset-x-0 top-0 z-10">
      <div ref={filterRef} className="scrollbar-hide flex gap-2 overflow-x-auto p-4">
        <span className="shrink-0 whitespace-nowrap rounded-full bg-cream-soft px-3.5 py-2 text-micro font-semibold text-ink-soft shadow-card">
          용산권 {places.length}곳
        </span>
        <button
          type="button"
          onClick={() => setCuisineFilter(null)}
          className={clsx(
            "shrink-0 whitespace-nowrap rounded-full border border-transparent px-3.5 py-2 text-micro font-semibold shadow-card transition-all",
            cuisineFilter === null
              ? "bg-accent-soft font-semibold text-accent-strong"
              : "bg-cream-soft text-ink-soft hover:bg-cream-strong active:bg-cream-strong",
          )}
        >
          전체
        </button>
        {CUISINE_FILTERS.map((key) => {
          const { Icon, color } = CUISINE_ICON[key];
          const active = cuisineFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCuisineFilter(active ? null : key)}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-3.5 py-2 text-micro font-semibold shadow-card transition-all",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "bg-cream-soft text-ink-soft hover:bg-cream-strong active:bg-cream-strong",
              )}
            >
              <Icon className={clsx("h-3.5 w-3.5", active ? "text-accent-strong" : color)} strokeWidth={1.8} />
              {CUISINE_LABEL[key]}
            </button>
          );
        })}
      </div>
        {/* 칩이 화면 밖으로 이어진다는 걸 화살표로 알려주고, 눌러서 넘길 수도 있게 한다 */}
        {filterEdges.canLeft && (
          <ArrowButton dir="left" className="left-2 top-1/2 h-8 w-8" onClick={() => scrollByPage(filterRef, -1)} />
        )}
        {filterEdges.canRight && (
          <ArrowButton dir="right" className="right-2 top-1/2 h-8 w-8" onClick={() => scrollByPage(filterRef, 1)} />
        )}
      </div>

      {/* 필터 줄(위쪽 p-4 + 칩 한 줄) 높이가 대략 68px라 top-16(64px)에 두면 토스트가 칩과 겹친다.
          넉넉하게 그 아래로 내려서 배치한다 */}
      {notice && (
        <div className="absolute left-1/2 top-24 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-caption font-medium text-white shadow-card">
          {notice}
        </div>
      )}

      {places.length === 0 && (
        <div className="absolute inset-x-4 top-20 z-10 rounded-lg bg-cream-soft p-4 text-center text-body-sm text-ink-soft shadow-card">
          이 조건에 맞는 식당이 없어요. 필터를 바꿔보세요.
        </div>
      )}

      {/* 현위치 버튼과 카드 스트립을 같은 flex 컬럼에 담아서, 카드 높이가 몇 px이든 버튼이
          항상 카드 바로 위에 자동으로 붙게 한다. 각각 절대좌표를 따로 추측해서 맞추면
          카드 내용(이름 줄바꿈 등)에 따라 버튼과 카드가 겹칠 수 있다 */}
      {/* 하단 탭바(약 64px) 바로 위에 붙인다. 카드와 탭바 사이 여백은 예전(약 40px)의 절반으로 줄였다 */}
      <div className="absolute inset-x-0 bottom-[94px] z-10 flex flex-col items-end gap-3">
        {appKey && (
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            aria-label="현재 위치로 이동"
            className="mr-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-cream-soft shadow-card transition-colors hover:bg-cream-strong active:bg-cream-strong disabled:opacity-50"
          >
            <LocateFixed className={clsx("h-5 w-5 text-ink-soft", locating && "animate-pulse")} strokeWidth={1.8} />
          </button>
        )}

        {places.length > 0 && (
          <div className="relative w-full">
          <div
            ref={stripRef}
            onScroll={handleStripScroll}
            className="scrollbar-hide flex w-full scroll-px-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4"
          >
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                ref={(el) => {
                  cardRefs.current[place.id] = el;
                }}
                onClick={() => track("place_card_clicked", { place_id: place.id, page: "map" })}
                className={clsx(
                  // 왼쪽 정렬로 한 장을 두고 다음 카드가 절반쯤 보이게 한다(넘겨볼 게 있다는 신호).
                  // 이름이 길면 줄을 넘기지 않고 말줄임 — 220px 고정폭일 땐 두세 줄로 접혀 카드 밖으로 넘쳤다
                  "flex w-[66%] shrink-0 snap-start items-center gap-3 rounded-lg border bg-cream-soft p-3 shadow-card transition-colors hover:bg-cream-strong active:bg-cream-strong",
                  selectedId === place.id ? "border-accent-strong" : "border-transparent",
                )}
              >
                <PlaceThumbnail place={place} className="h-16 w-16 shrink-0 rounded-md" iconClassName="h-6 w-6" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-title-sm font-bold text-ink">{place.name}</h3>
                  {/* 좁아진 카드에서 "지역 · 가격"을 한 줄에 두면 가격이 잘려서, 가격은 따로 한 줄을 주고
                      지역은 좌석 태그와 같은 줄로 내렸다 */}
                  <p className="mt-0.5 whitespace-nowrap text-caption font-semibold text-ink">
                    {formatPrice(place.priceMin, place.priceMax)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="whitespace-nowrap text-caption text-ink-soft">{AREA_LABEL[place.area]}</span>
                    <Tag variant="neutral">{SEAT_TYPE_LABEL[place.seatType]}</Tag>
                  </div>
                </div>
              </Link>
            ))}
          </div>
            {/* 카드 세로 가운데에 걸친 동그란 화살표로 한 장씩 넘긴다(스와이프도 그대로 된다) */}
            {stripEdges.canLeft && (
              <ArrowButton dir="left" className="left-1.5 top-1/2 h-9 w-9" onClick={() => stepCard(-1)} />
            )}
            {stripEdges.canRight && (
              <ArrowButton dir="right" className="right-1.5 top-1/2 h-9 w-9" onClick={() => stepCard(1)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 가로 스크롤 영역이 왼쪽·오른쪽으로 더 넘어갈 수 있는지. 끝에 닿은 쪽 화살표는 숨긴다 */
function useScrollEdges(ref: React.RefObject<HTMLDivElement | null>, contentKey?: unknown) {
  const [edges, setEdges] = useState({ canLeft: false, canRight: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({
        canLeft: el.scrollLeft > 4,
        canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, contentKey]);
  return edges;
}

function scrollByPage(ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) {
  const el = ref.current;
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
}

function ArrowButton({ dir, className, onClick }: { dir: "left" | "right"; className: string; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "이전" : "다음"}
      className={clsx(
        "absolute z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-line bg-cream-soft text-ink shadow-card transition-colors hover:bg-cream-strong active:scale-95",
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}
