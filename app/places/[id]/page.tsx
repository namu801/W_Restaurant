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
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { ConditionEditSheet } from "@/components/ConditionEditSheet";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { BackButton } from "@/components/BackButton";
import { Tag } from "@/components/ui/Tag";

const FIT_TAG_VARIANT = {
  "매우 잘 맞아요": "positive",
  "잘 맞아요": "accent",
  "일부 조건을 확인해보세요": "neutral",
} as const;

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
    <div className="flex flex-col gap-7">
      <TrackOnMount
        event="place_detail_viewed"
        props={{ place_id: place.id, score: match?.score }}
      />

      {/* 캐치테이블·네이버플레이스처럼 사진을 최상단에 크게 두고, 그 아래로 이름·요약·상세 순으로
          정보 위계를 낮춰간다. main의 상단 여백을 지우고 화면 폭 끝까지 이미지를 채운다 */}
      <div className="relative -mx-6 -mt-8">
        <PlaceThumbnail place={place} className="h-52" iconClassName="h-16 w-16" />
        <BackButton />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-serif text-2xl font-bold text-ink text-balance">{place.name}</h1>
            {match && <Tag variant={FIT_TAG_VARIANT[match.fitLabel]}>{match.fitLabel}</Tag>}
          </div>
          <p className="mt-1.5 text-sm text-ink-faint">
            {place.category} · {AREA_LABEL[place.area]} · {place.address}
          </p>
          <p className="mt-1.5 text-base font-bold text-ink">
            1인 {formatPrice(place.priceMin, place.priceMax)}
          </p>
        </div>

        {condition && (
          <div className="flex justify-end">
            <ConditionEditSheet condition={condition} />
          </div>
        )}
      </div>

      <section className="rounded-lg border border-accent/30 bg-accent-soft/50 p-5">
        <p className="text-xs font-semibold text-accent-strong">
          이 모임에 추천하는 이유
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{reason}</p>
      </section>

      <section>
        <p className="mb-3 text-sm font-semibold text-ink">청첩장 모임 체크포인트</p>
        <CheckpointList checkpoints={checkpoints} />
      </section>

      <section className="rounded-lg border border-clay/30 bg-clay-soft/40 p-5">
        <p className="text-xs font-semibold text-clay">주의할 점</p>
        <p className="mt-2 text-sm text-ink">{place.cautionNote}</p>
      </section>

      <p className="text-xs text-ink-faint">
        리뷰, 영업시간, 메뉴, 예약 가능 여부는 지도 서비스에서 최신 정보를
        확인해주세요. (정보 확인일 {place.lastVerifiedAt})
      </p>

      <FeedbackWidget placeId={place.id} />

      {/* 지도 이동은 이 서비스의 핵심 전환이라, 스크롤 위치와 무관하게 항상 엄지 반경 안에 둔다.
          저장하기는 별도 전체 폭 버튼 대신, 이 고정바 왼쪽에 아이콘으로 붙여 액션을 한데 모은다 */}
      <StickyBottomBar>
        <div className="flex items-center gap-2.5">
          <BookmarkButton
            placeId={place.id}
            page="detail"
            score={match?.score}
            className="h-[52px] w-[52px] shrink-0 justify-center px-0"
          />
          <div className="flex-1">
            <MapLinks
              placeId={place.id}
              mapUrlNaver={place.mapUrlNaver}
              mapUrlKakao={place.mapUrlKakao}
              score={match?.score}
            />
          </div>
        </div>
      </StickyBottomBar>
    </div>
  );
}
