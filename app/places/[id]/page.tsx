import { notFound } from "next/navigation";
import { clsx } from "clsx";
import { ChevronDown, Clock, MapPin, Wallet } from "lucide-react";
import { getPlaceById } from "@/lib/places";
import { searchParamsToCondition } from "@/lib/condition-query";
import { scorePlace } from "@/lib/scoring";
import { generateBookingFacts, generateDetailSummary, generateReservationAsk } from "@/lib/reason";
import { buildCheckpoints } from "@/lib/checkpoints";
import { AREA_LABEL, formatPrice, splitBusinessHoursLines, todayBusinessHours } from "@/lib/labels";
import { MapLinks } from "@/components/MapLinks";
import { BookmarkButton } from "@/components/BookmarkButton";
import { TrackOnMount } from "@/components/TrackOnMount";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { PlacePhotoCarousel } from "@/components/PlacePhotoCarousel";
import { PlaceDetailTabs } from "@/components/PlaceDetailTabs";

/** "룸은 4인 이상부터 가능해요." 와 "룸은 4인 이상부터 가능해요" 를 같은 문장으로 본다 */
const normalize = (text: string) => text.replace(/[.\s]/g, "");

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

  // 목록에서 넘겨받은 윗줄(번호·문구). 목록과 같은 모양으로 보여줘서 "방금 누른 그 식당"임을 잇는다
  const rank = typeof sp.r === "string" ? Number(sp.r) || undefined : undefined;
  const labelText = typeof sp.l === "string" ? sp.l : undefined;
  const tone = sp.t === "m" ? "muted" : rank === 1 ? "accent" : "default";

  const summary = generateDetailSummary(condition, match, place);
  const checkpoints = buildCheckpoints(place, condition);
  // 예약 전 확인: 조건과 맞는 점(✓)과 확인할 점(!)만 남긴다. 위 추천 이유가 이미 말한 주제
  // (룸·응대·조용함·역 접근)는 문장이 달라도 같은 말이라 ✓에서 뺀다
  const summaryText = summary.bullets.join(" ");
  const TOPICS = [/룸/, /응대|대접/, /조용|대화/, /역에서/, /칸막이/, /주차/];
  const coveredTopics = TOPICS.filter((re) => re.test(summaryText));
  const matchedPoints = checkpoints
    .filter((c) => c.tone === "positive")
    .map((c) => c.text)
    .filter((t) => !coveredTopics.some((re) => re.test(t)));
  const seen = new Set<string>();
  // 같은 주제(웨이팅·주차·전화 예약)는 출처가 달라도 한 번만 말한다. 먼저 나온(더 구체적인) 문장을 남긴다
  const ONCE_TOPICS = [/웨이팅|대기/, /주차/, /전화.*예약/];
  const seenTopics = new Set<number>();
  // 매장 메모는 여러 사실을 한 문단에 이어 써서 한 항목이 네 줄씩 됐다 — 문장 단위로 나눠 한 줄에 한 사실만 둔다.
  // 출처마다 마침표가 있다 없다 해서 목록 안에서 들쭉날쭉했다 — 짧은 목록 문장은 마침표 없이 맞춘다
  const pointsToCheck = [
    ...generateBookingFacts(place, condition).flatMap((t) => t.split(/(?<=요)\.\s+/)),
    ...checkpoints
      .filter((c) => c.tone === "warning" || (c.tone === "neutral" && c.group === "운영 조건"))
      .map((c) => c.text),
  ]
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter((t) => {
      const key = normalize(t);
      if (!t || seen.has(key)) return false;
      seen.add(key);
      const topics = ONCE_TOPICS.map((re, i) => (re.test(t) ? i : -1)).filter((i) => i >= 0);
      if (topics.length > 0 && topics.every((i) => seenTopics.has(i))) return false;
      topics.forEach((i) => seenTopics.add(i));
      return true;
    });

  // 편의 태그는 데이터로 확인된 것만 둔다
  const amenities = [
    place.privateRoomAvailable && "룸 있음",
    place.reservationMethod === "available" && "예약 가능",
    place.reservationMethod === "phone" && "전화 예약",
    place.parkingAvailable && "주차 가능",
  ].filter((v): v is string => Boolean(v));

  return (
    // 결과 목록과 같은 흰 바닥. 섹션 사이는 회색 띠로만 나눈다.
    // 하단 고정바 밑까지 흰 바닥이 이어지도록 MainArea의 아래 여백(pb-32)을 덮는다
    <div className="-mx-6 -mb-32 -mt-8 flex min-h-full flex-col bg-cream-soft px-6 pb-36 pt-4">
      <TrackOnMount event="place_detail_viewed" props={{ place_id: place.id, score: match?.score }} />

      <PlacePhotoCarousel place={place} />

      <div className="mt-5">
        {(rank || labelText) && (
          <p className="mb-1 flex items-center gap-1.5 text-caption font-semibold">
            {rank && (
              <span
                className={clsx(
                  "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-micro font-bold text-white",
                  tone === "accent" ? "bg-accent" : tone === "muted" ? "bg-ink-faintest" : "bg-ink",
                )}
              >
                {rank}
              </span>
            )}
            {labelText && (
              <span className={tone === "accent" ? "font-bold text-accent" : "text-ink-soft"}>{labelText}</span>
            )}
          </p>
        )}
        <h1 className="text-h1 font-bold text-ink">{place.name}</h1>
        <p className="mt-1 text-label text-ink-soft">
          {AREA_LABEL[place.area]} · {place.category}
        </p>

        <div className="mt-4 h-px bg-line" />

        {/* 정보 줄: 목록 카드와 같은 선 아이콘. 영업시간은 오늘 구간만 먼저 보여주고 눌러서 전체를 편다 */}
        <div className="mt-4 flex flex-col gap-3 text-label text-ink">
          <p className="flex items-start gap-2">
            <MapPin className="mt-px h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1">{place.address}</span>
          </p>
          <p className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            <span className="font-semibold">1인 {formatPrice(place.priceMin, place.priceMax)}</span>
          </p>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <Clock className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
              오늘 {todayBusinessHours(place.businessHours)}
              <ChevronDown
                className="h-4 w-4 text-ink-faint transition-transform group-open:rotate-180"
                strokeWidth={1.75}
                aria-hidden
              />
            </summary>
            <ul className="mt-2 flex flex-col gap-1 pl-6 text-caption text-ink-soft">
              {splitBusinessHoursLines(place.businessHours).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        </div>

        {amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <span key={a} className="rounded-sm bg-cream-strong px-2 py-1 text-caption font-medium text-ink-soft">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="-mx-6 mt-6 h-2 bg-cream" />

      <PlaceDetailTabs
        menu={place.menu}
        summaryTitle={summary.title}
        summaryBullets={summary.bullets}
        matchedPoints={matchedPoints}
        pointsToCheck={pointsToCheck}
        reservationAsk={generateReservationAsk(condition)}
      />

      <p className="mt-8 border-t border-line pt-5 pb-4 text-caption text-ink-faint">
        리뷰, 예약 가능 여부는 지도 서비스에서 최신 정보를 확인해주세요. 메뉴·가격은 변동될 수 있어요.
        (정보 확인일 {place.lastVerifiedAt})
      </p>

      {/* 추천 만족도 설문. 페이지를 다 읽은 뒤 답하도록 맨 아래에 둔다 */}
      <div className="mt-2">
        <FeedbackWidget placeId={place.id} />
      </div>

      {/* 지도 이동은 핵심 전환이라 항상 엄지 반경 안에 둔다. 저장은 아이콘으로 붙여 액션을 한데 모은다 */}
      <StickyBottomBar>
        <div className="flex items-stretch gap-2">
          <BookmarkButton
            placeId={place.id}
            page="detail"
            score={match?.score}
            iconClassName="h-[22px] w-[22px]"
            className="!h-[52px] !w-[52px] shrink-0 !justify-center !rounded-lg !px-0"
          />
          <div className="min-w-0 flex-1">
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
