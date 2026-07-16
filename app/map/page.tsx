import { PLACES } from "@/lib/places";
import { KakaoMap } from "@/components/KakaoMap";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MapPage() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  return (
    <div className="flex flex-col gap-4">
      <TrackOnMount event="map_viewed" props={{ place_count: PLACES.length }} />

      <div>
        <h1 className="font-serif text-xl font-bold text-ink">지도에서 보기</h1>
        <p className="mt-1 text-sm text-ink-soft">
          강남역 · 신논현 · 논현 인근 {PLACES.length}곳을 한눈에 확인해보세요.
        </p>
      </div>

      {appKey ? (
        <KakaoMap places={PLACES} appKey={appKey} />
      ) : (
        <EmptyState
          title="지도를 표시하려면 API 키가 필요해요."
          description={
            "카카오 개발자 콘솔(developers.kakao.com)에서 JavaScript 키를 발급받아\n.env.local의 NEXT_PUBLIC_KAKAO_MAP_KEY에 넣어주세요."
          }
        />
      )}
    </div>
  );
}
