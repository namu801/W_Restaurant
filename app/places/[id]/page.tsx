import { notFound } from "next/navigation";
import { getPlaceById } from "@/lib/places";
import { searchParamsToCondition } from "@/lib/condition-query";
import { scorePlace } from "@/lib/scoring";
import { generateDetailReason, genericReason } from "@/lib/reason";
import { buildCheckpoints } from "@/lib/checkpoints";
import { AREA_LABEL, formatPrice } from "@/lib/labels";
import { CheckpointList } from "@/components/CheckpointList";
import { MapLinks } from "@/components/MapLinks";
import { BookmarkButton } from "@/components/BookmarkButton";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { TrackOnMount } from "@/components/TrackOnMount";

export default async function PlaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const place = getPlaceById(id);
  if (!place) notFound();

  const sp = await searchParams;
  const condition = searchParamsToCondition(sp);
  const match = condition ? scorePlace(condition, place) : null;
  const reason = match
    ? generateDetailReason(condition!, match)
    : genericReason(place.curatedReason);
  const checkpoints = buildCheckpoints(place, condition);

  return (
    <div className="flex flex-col gap-6">
      <TrackOnMount
        event="place_detail_viewed"
        props={{ place_id: place.id, score: match?.score }}
      />

      <div>
        {match && (
          <p className="text-xs font-medium text-accent-strong">
            {match.fitLabel} · {match.score}점
          </p>
        )}
        <h1 className="mt-1 text-xl font-bold text-ink">{place.name}</h1>
        <p className="mt-1 text-sm text-ink-faint">
          {place.category} · {AREA_LABEL[place.area]} · {place.address}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          1인 {formatPrice(place.priceMin, place.priceMax)}
        </p>
      </div>

      <section className="rounded-2xl border border-accent/30 bg-accent-soft/50 p-4">
        <p className="text-xs font-semibold text-accent-strong">
          이 모임에 추천하는 이유
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{reason}</p>
      </section>

      <section>
        <p className="mb-2.5 text-sm font-semibold text-ink">청첩장 모임 체크포인트</p>
        <CheckpointList checkpoints={checkpoints} />
      </section>

      <section className="rounded-2xl border border-clay/30 bg-clay-soft/40 p-4">
        <p className="text-xs font-semibold text-clay">주의할 점</p>
        <p className="mt-1.5 text-sm text-ink">{place.cautionNote}</p>
      </section>

      <section>
        <p className="mb-2 text-xs text-ink-faint">
          리뷰, 영업시간, 메뉴, 예약 가능 여부는 지도 서비스에서 최신 정보를
          확인해주세요. (정보 확인일 {place.lastVerifiedAt})
        </p>
        <MapLinks
          placeId={place.id}
          mapUrlNaver={place.mapUrlNaver}
          mapUrlKakao={place.mapUrlKakao}
          score={match?.score}
        />
      </section>

      <BookmarkButton
        placeId={place.id}
        page="detail"
        score={match?.score}
        labeled
        className="w-full justify-center py-3"
      />

      <FeedbackWidget placeId={place.id} />
    </div>
  );
}
