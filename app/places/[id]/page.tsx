import { notFound } from "next/navigation";
import { getPlaceById } from "@/lib/places";
import { searchParamsToCondition } from "@/lib/condition-query";
import { scorePlace } from "@/lib/scoring";
import { generateDetailReason, genericReason } from "@/lib/reason";
import { buildCheckpoints } from "@/lib/checkpoints";
import { AREA_LABEL, FIT_TAG_VARIANT, formatFitScore, formatPrice } from "@/lib/labels";
import { MapLinks } from "@/components/MapLinks";
import { BookmarkButton } from "@/components/BookmarkButton";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { TrackOnMount } from "@/components/TrackOnMount";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { PlacePhotoCarousel } from "@/components/PlacePhotoCarousel";
import { PlaceDetailTabs } from "@/components/PlaceDetailTabs";
import { Tag } from "@/components/ui/Tag";
import { ClockIcon, MapPinIcon, WalletIcon } from "@heroicons/react/24/solid";

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
  const reasonCards = match
    ? generateDetailReason(condition!, match)
    : genericReason(place.curatedReason);
  const checkpoints = buildCheckpoints(place, condition);

  return (
    <div className="flex flex-col gap-6">
      <TrackOnMount
        event="place_detail_viewed"
        props={{ place_id: place.id, score: match?.score }}
      />

      <PlacePhotoCarousel place={place} />

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink text-balance">{place.name}</h1>
          {match && <Tag variant={FIT_TAG_VARIANT[match.fitLabel]}>{formatFitScore(match.fitRatio)}</Tag>}
        </div>
        {/* text-ink-faint(#A4A5A7)는 페이지 배경(#F5F5F7)과 명도差가 작아 거의 안 읽혔다
            — PlaceCard의 동일한 지역·카테고리 메타 줄과 같은 톤(ink-soft)으로 맞춘다 */}
        <p className="mt-1 text-sm text-ink-soft">
          {place.category} · {AREA_LABEL[place.area]}
        </p>

        {/* 메타 줄(카테고리·지역)과 아래 위치·영업시간·가격 블록 사이는 같은 "정보 묶음"
            안에서 살짝만 끊어주는 자리라, 대분류를 가르는 다른 구분 밴드(h-2)와 달리
            이 선만 유일하게 얇은 헤어라인(2px)으로 둔다 — bg-cream은 페이지 배경과
            완전히 같은 색이라 실제로는 안 보이는 선이었어서 line-strong으로 바꿨다 */}
        <div className="-mx-6 mt-3 h-0.5 bg-line-strong" />

        {/* 카드로 감싸지 않는다 — 보더+패딩이 있으면 이 줄들이 식당명보다 안쪽(우측)에서
            시작해 좌측 정렬이 안 맞았다. 주소·영업시간·가격 세 줄 다 같은 크기·굵기로 두고,
            가격만 색(accent)으로만 구분한다 — 크기를 키우면 "예산"이 다른 정보보다
            중요하다는 착시를 준다. 아이콘은 lucide 라인 스타일 대신 Heroicons solid로
            채워서 시각적으로도 더 또렷하게 읽히게 했다 */}
        <div className="mt-3 flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <MapPinIcon className="h-4 w-4 shrink-0 text-ink-faint" />
            {place.address}
          </p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <ClockIcon className="h-4 w-4 shrink-0 text-ink-faint" />
            {place.businessHours}
          </p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
            <WalletIcon className="h-4 w-4 shrink-0 text-accent" />
            1인 {formatPrice(place.priceMin, place.priceMax)}
          </p>
        </div>
      </div>

      {/* 탭 영역(추천 이유·체크포인트·주의사항)이 위 정보 블록과 같은 흰 배경에 바로
          이어붙어 있어 어디서 끊기는지 안 보였다 — 다른 대분류 사이에 쓴 것과 같은
          구분 밴드를 여기도 넣어서 "상단 정보 vs 탭 콘텐츠"를 뚜렷하게 가른다 */}
      <div className="-mx-6 h-2 bg-line-strong" />

      <PlaceDetailTabs checkpoints={checkpoints} reasonCards={reasonCards} cautionNote={place.cautionNote} />

      {/* 탭 콘텐츠와는 성격이 다른 블록(정보 출처 안내, 피드백 위젯)이라 구분선으로 한 번 끊어준다 */}
      <hr className="border-line" />

      <p className="text-xs text-ink-faint">
        리뷰, 메뉴, 예약 가능 여부는 지도 서비스에서 최신 정보를
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
              page="detail"
            />
          </div>
        </div>
      </StickyBottomBar>
    </div>
  );
}
