"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Place } from "@/lib/types";
import { SERVICE_AREA } from "@/lib/service-area";

declare global {
  interface Window {
    kakao: any;
  }
}

let sdkLoadPromise: Promise<void> | null = null;

/** 카카오맵 JS SDK를 한 번만 로드한다. 여러 컴포넌트가 동시에 마운트돼도 스크립트 태그는 하나만 남는다 */
function loadKakaoMapsSdk(appKey: string): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("카카오맵 SDK를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

const PIN_SIZE = 26;
const PIN_SIZE_SELECTED = 36;
const HATCH_PATTERN_ID = "service-area-hatch";
const MASK_ID = "service-area-mask";

/** 선택 여부에 따라 핀 하나의 스타일만 바꾼다. 지도를 통째로 다시 그리지 않아 선택 전환이 매끄럽다 */
function applyPinStyle(el: HTMLDivElement, selected: boolean) {
  const size = selected ? PIN_SIZE_SELECTED : PIN_SIZE;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.background = selected ? "#006BF9" : "#FFFFFF";
  el.style.border = selected ? "3px solid #FFFFFF" : "2px solid #006BF9";
  el.style.boxShadow = selected
    ? "0 8px 18px rgba(10,11,12,0.35)"
    : "0 2px 6px rgba(10,11,12,0.18)";
  el.style.zIndex = selected ? "10" : "1";
  const dot = el.firstElementChild as HTMLDivElement | null;
  if (dot) {
    const dotSize = selected ? 10 : 7;
    dot.style.width = `${dotSize}px`;
    dot.style.height = `${dotSize}px`;
    dot.style.background = selected ? "#FFFFFF" : "#006BF9";
  }
}

/** 카카오 기본 빨간 마커 대신, 서비스 톤(블루 링 + 도트)에 맞춘 커스텀 핀 DOM을 만든다.
 *  지도 밖(React 트리 밖)에 얹는 순수 DOM이라 role/tabIndex/키보드 핸들러를 직접 붙여야 한다 */
function createPinElement(name: string, onActivate: () => void): HTMLDivElement {
  const el = document.createElement("div");
  el.style.borderRadius = "999px";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.style.transition = "width 0.15s ease, height 0.15s ease, background 0.15s ease";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", name);
  el.addEventListener("click", onActivate);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  });

  const dot = document.createElement("div");
  dot.style.borderRadius = "999px";
  el.appendChild(dot);

  applyPinStyle(el, false);
  return el;
}

/** "내 위치" 점 마커. 블루 핀과 헷갈리지 않도록 잉크색 단색 도트로, 서비스 지역 안일 때만 찍힌다 */
function createMeElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "999px";
  el.style.background = "#0A0B0C";
  el.style.border = "3px solid #FFFFFF";
  el.style.boxShadow = "0 0 0 4px rgba(10,11,12,0.16), 0 4px 10px rgba(10,11,12,0.3)";
  return el;
}

export interface KakaoMapHandle {
  isReady: () => boolean;
  panTo: (lat: number, lng: number) => void;
  panToServiceCenter: () => void;
  showMeMarker: (lat: number, lng: number) => void;
}

export const KakaoMap = forwardRef<
  KakaoMapHandle,
  {
    places: Place[];
    appKey: string;
    selectedId: string | null;
    onSelectPlace: (id: string) => void;
  }
>(function KakaoMap({ places, appKey, selectedId, onSelectPlace }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pinsRef = useRef<Record<string, { el: HTMLDivElement; position: any; overlay: any }>>({});
  const meMarkerRef = useRef<{ el: HTMLDivElement; overlay: any } | null>(null);
  const maskCircleRef = useRef<SVGCircleElement>(null);
  const ringCircleRef = useRef<SVGCircleElement>(null);
  const onSelectPlaceRef = useRef(onSelectPlace);
  onSelectPlaceRef.current = onSelectPlace;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // 서비스 가능 지역 원을 지금 지도 축척에 맞는 화면 픽셀 좌표로 다시 계산해서 빗금 마스크에 반영한다.
  // 팬·줌이 끝날 때(idle)마다 다시 불러 화면이 바뀌어도 경계가 항상 제자리에 맞게 그려지게 한다
  function syncServiceAreaOverlay() {
    const map = mapRef.current;
    if (!map || !maskCircleRef.current || !ringCircleRef.current) return;
    const { kakao } = window;
    const projection = map.getProjection();
    const center = projection.containerPointFromCoords(
      new kakao.maps.LatLng(SERVICE_AREA.centerLat, SERVICE_AREA.centerLng),
    );
    const edge = projection.containerPointFromCoords(
      new kakao.maps.LatLng(SERVICE_AREA.centerLat + SERVICE_AREA.radiusDeg, SERVICE_AREA.centerLng),
    );
    const radius = Math.abs(center.y - edge.y);
    [maskCircleRef.current, ringCircleRef.current].forEach((el) => {
      el.setAttribute("cx", String(center.x));
      el.setAttribute("cy", String(center.y));
      el.setAttribute("r", String(radius));
    });
  }

  // 지도(kakao.maps.Map)는 SDK 로드 후 딱 한 번만 만든다. places가 검색·필터로 자주 바뀌는데
  // 그때마다 같은 컨테이너에 지도를 새로 얹으면 이전 지도가 정리되지 않고 쌓인다. 그래서 지도
  // 생성과 핀 갱신을 별도 이펙트로 분리했다
  useEffect(() => {
    let cancelled = false;

    loadKakaoMapsSdk(appKey)
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const { kakao } = window;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(SERVICE_AREA.centerLat, SERVICE_AREA.centerLng),
          level: 5,
        });
        mapRef.current = map;
        kakao.maps.event.addListener(map, "idle", syncServiceAreaOverlay);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // places가 바뀔 때마다 지도는 그대로 두고 핀만 지웠다가 다시 그린다
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    const { kakao } = window;

    Object.values(pinsRef.current).forEach(({ overlay }) => overlay.setMap(null));

    if (places.length === 0) {
      pinsRef.current = {};
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    const pins: typeof pinsRef.current = {};

    places.forEach((p) => {
      const position = new kakao.maps.LatLng(p.lat, p.lng);
      bounds.extend(position);
      const el = createPinElement(p.name, () => onSelectPlaceRef.current(p.id));
      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });
      overlay.setMap(map);
      pins[p.id] = { el, position, overlay };
    });

    pinsRef.current = pins;
    map.setBounds(bounds);
    syncServiceAreaOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, status]);

  // 선택된 장소가 바뀌면(핀 클릭 또는 하단 카드 스크롤) 핀 스타일만 갱신하고 그 위치로 부드럽게 이동한다
  useEffect(() => {
    const pins = pinsRef.current;
    Object.entries(pins).forEach(([id, pin]) => applyPinStyle(pin.el, id === selectedId));
    if (selectedId && pins[selectedId] && mapRef.current) {
      mapRef.current.panTo(pins[selectedId].position);
    }
  }, [selectedId, places]);

  useImperativeHandle(
    ref,
    () => ({
      isReady: () => status === "ready" && Boolean(mapRef.current),
      panTo: (lat, lng) => {
        if (!mapRef.current) return;
        mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
      },
      panToServiceCenter: () => {
        if (!mapRef.current) return;
        mapRef.current.panTo(new window.kakao.maps.LatLng(SERVICE_AREA.centerLat, SERVICE_AREA.centerLng));
      },
      showMeMarker: (lat, lng) => {
        const map = mapRef.current;
        if (!map) return;
        const { kakao } = window;
        const position = new kakao.maps.LatLng(lat, lng);
        if (meMarkerRef.current) {
          meMarkerRef.current.overlay.setPosition(position);
          return;
        }
        const el = createMeElement();
        const overlay = new kakao.maps.CustomOverlay({
          position,
          content: el,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 20,
        });
        overlay.setMap(map);
        meMarkerRef.current = { el, overlay };
      },
    }),
    [status],
  );

  if (status === "error") {
    return (
      <div className="flex h-full items-center justify-center bg-cream-soft px-6 text-center text-sm text-ink-faint">
        지도를 불러오지 못했어요. 카카오 개발자 콘솔에서 이 도메인이 플랫폼으로 등록되어 있는지 확인해주세요.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-cream-soft">
      <div ref={containerRef} className="h-full w-full" />

      {/* 서비스 가능 지역 밖을 빗금으로 어둡게 표시한다. 지도 축척이 바뀔 때마다 syncServiceAreaOverlay가
          원의 화면 좌표를 다시 계산해 이 두 <circle>의 cx/cy/r만 갱신한다 */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id={HATCH_PATTERN_ID}
            width="8"
            height="8"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="#0A0B0C" strokeOpacity={0.3} strokeWidth={3} />
          </pattern>
          <mask id={MASK_ID}>
            <rect width="100%" height="100%" fill="white" />
            <circle ref={maskCircleRef} cx={0} cy={0} r={0} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${HATCH_PATTERN_ID})`} mask={`url(#${MASK_ID})`} />
        <circle
          ref={ringCircleRef}
          cx={0}
          cy={0}
          r={0}
          fill="none"
          stroke="#006BF9"
          strokeWidth={2}
          strokeDasharray="7 6"
        />
      </svg>

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-soft text-sm text-ink-faint">
          지도를 불러오는 중이에요…
        </div>
      )}
    </div>
  );
});
