"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Place } from "@/lib/types";
import { AREA_LABEL, formatPrice } from "@/lib/labels";
import { track } from "@/lib/analytics";

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

export function KakaoMap({ places, appKey }: { places: Place[]; appKey: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    loadKakaoMapsSdk(appKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const { kakao } = window;
        const bounds = new kakao.maps.LatLngBounds();
        places.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)));

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(places[0].lat, places[0].lng),
          level: 5,
        });
        map.setBounds(bounds);

        let openOverlay: any = null;

        places.forEach((p) => {
          const position = new kakao.maps.LatLng(p.lat, p.lng);
          const marker = new kakao.maps.Marker({ position, map, title: p.name });

          const content = document.createElement("div");
          content.innerHTML = `
            <div style="background:#FFFDF8;border:1px solid #E7D9C9;border-radius:12px;padding:10px 12px;box-shadow:0 8px 20px rgba(74,63,53,0.18);min-width:168px;font-family:inherit;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#4A3F35;">${p.name}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#A89A8A;">${p.category} · ${AREA_LABEL[p.area]}</p>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#4A3F35;">1인 ${formatPrice(p.priceMin, p.priceMax)}</p>
              <button type="button" data-place-id="${p.id}" style="margin-top:8px;width:100%;border:none;border-radius:999px;background:#E56C6C;color:#fff;font-size:12px;font-weight:700;padding:6px 0;cursor:pointer;">상세 보기</button>
            </div>
          `;
          const overlay = new kakao.maps.CustomOverlay({
            position,
            content,
            yAnchor: 1.4,
          });

          content.querySelector("button")?.addEventListener("click", () => {
            track("map_marker_clicked", { place_id: p.id });
            router.push(`/places/${p.id}`);
          });

          kakao.maps.event.addListener(marker, "click", () => {
            openOverlay?.setMap(null);
            overlay.setMap(map);
            openOverlay = overlay;
          });
        });

        kakao.maps.event.addListener(map, "click", () => {
          openOverlay?.setMap(null);
          openOverlay = null;
        });

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [places, appKey, router]);

  if (status === "error") {
    return (
      <div className="flex h-[440px] items-center justify-center rounded-lg border border-line bg-cream-soft px-6 text-center text-sm text-ink-faint">
        지도를 불러오지 못했어요. 카카오 개발자 콘솔에서 이 도메인이 플랫폼으로 등록되어 있는지 확인해주세요.
      </div>
    );
  }

  return (
    <div className="relative h-[440px] overflow-hidden rounded-lg border border-line bg-cream-soft">
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-soft text-sm text-ink-faint">
          지도를 불러오는 중이에요…
        </div>
      )}
    </div>
  );
}
