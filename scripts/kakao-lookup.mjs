// 식당 이름 목록을 카카오 로컬 API로 일괄 조회해, 스프레드시트에 손으로 옮겨 적을 수 있는
// 주소·정확한 좌표·카카오맵 링크를 CSV로 뽑아낸다. 예산·인원·분위기 같은 주관적 컬럼은
// 카카오 API에 아예 없는 정보라 이 스크립트가 채우지 않는다 — 그건 여전히 사람이 조사해서 넣는다.
//
// 실행: node --env-file=.env.local scripts/kakao-lookup.mjs

import { writeFile, mkdir } from "node:fs/promises";

const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
if (!REST_API_KEY) {
  console.error("KAKAO_REST_API_KEY가 없습니다. .env.local을 확인하거나 --env-file로 실행하세요.");
  process.exit(1);
}

// 여기에 실제 식당 이름을 채워 넣는다. "식당명 지역" 형태로 쓰면 동명이인 매장을 훨씬 잘 구분한다
// (예: "역삼동 은행나무집 강남역"). 지역 힌트가 없으면 카카오가 전국에서 가장 유명한 동명 업체를 먼저 줄 수 있다.
const QUERIES = [
  "심퍼티쿠시 용산점",
  "포이 키친 용산",
  "쇼니노 용산",
  "먼치 용산",
  "크리스탈제이드 용산아이파크몰점", // 사용자 표기는 "크리스탈제이드 상하이팰리스 용산아이파크몰점"이지만,
  // 카카오에는 이 지점만 "상하이팰리스" 없이 등록되어 있어 이름을 맞춰 검색했다
  "아그라 용산점",
  "한량주가 용산",
  "일일향 용산",
  "꿀꺽 용산",
  "미미옥 신용산점",
  "호우섬 용산 아이파크몰점",
  "마제스키야키 용산",
  "오목집 삼각지점",
  "쿠촐로 서울 용산",
  "용산 봉숭아",
  "버누드 용산",
  "양복점 용산점",
  "우나 용산 본점",
  "유한 용산",
];

// 카카오의 "음식점(FD6)" 대분류로 걸러봤더니, 실존하는 스타벅스 강남역점조차 카페(CE7)로
// 분류돼 있어 결과가 통째로 사라지는 오탐이 발생했다. 대분류 필터 없이 키워드로만 검색하고,
// 결과에 붙어 나오는 category_name을 사람이 눈으로 확인하는 편이 훨씬 안전하다
async function searchPlace(query) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`카카오 API 오류 (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.documents ?? [];
}

function toCsvField(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

async function main() {
  const rows = [
    ["검색어", "식당명(공식)", "도로명주소", "지번주소", "위도", "경도", "전화번호", "카테고리", "카카오맵 링크", "비고"],
  ];

  for (const query of QUERIES) {
    process.stdout.write(`조회 중: ${query} ... `);
    let documents;
    try {
      documents = await searchPlace(query);
    } catch (err) {
      console.log("실패");
      rows.push([query, "", "", "", "", "", "", "", "", `조회 실패: ${err.message}`]);
      continue;
    }

    if (documents.length === 0) {
      console.log("검색 결과 없음");
      rows.push([query, "", "", "", "", "", "", "", "", "카카오에 등록된 정보 없음 — 이름/지역을 다시 확인하세요"]);
      continue;
    }

    console.log(`${documents.length}건`);
    const top = documents[0];
    const note = documents.length > 1 ? `동명 후보 ${documents.length}건 중 첫 번째 — 직접 확인 필요` : "";

    rows.push([
      query,
      top.place_name,
      top.road_address_name,
      top.address_name,
      top.y, // 위도
      top.x, // 경도
      top.phone,
      top.category_name,
      top.place_url,
      note,
    ]);

    // 카카오 API 요청 제한에 여유를 두기 위한 짧은 간격
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const csv = rows.map((row) => row.map(toCsvField).join(",")).join("\n");
  const outDir = new URL("./output/", import.meta.url);
  await mkdir(outDir, { recursive: true });
  const outPath = new URL("kakao-lookup-result.csv", outDir);
  await writeFile(outPath, csv, "utf-8");

  console.log(`\n완료. 결과: ${outPath.pathname}`);
}

main();
