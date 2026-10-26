// 식당 등록 사진을 Claude 비전으로 읽어, data/vibe/schema.json의 속성(격식·좌석 간격·공간 분리감·활기)을
// 1~5 점수와 확신도로 뽑아낸다. 결과는 식당 데이터(lib/places.ts)를 덮어쓰지 않고 data/vibe/ai-<날짜>.json에
// "해석 값"으로만 저장한다 — 사람이 검수한 뒤에 반영한다.
//
// 실행: node --env-file=.env.local scripts/vibe/analyze.mjs
//       node --env-file=.env.local scripts/vibe/analyze.mjs --only "쿠촐로서울"
//       node scripts/vibe/analyze.mjs --dry-run   (API 호출 없이 보낼 사진 목록만 확인)

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MODEL = process.env.VIBE_MODEL ?? "claude-sonnet-5-5";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!dryRun && !API_KEY) {
  console.error("ANTHROPIC_API_KEY가 없습니다. .env.local에 넣고 --env-file=.env.local로 실행하세요.");
  process.exit(1);
}

const schema = JSON.parse(await readFile(path.join(ROOT, "data/vibe/schema.json"), "utf8"));

// lib/place-photos.ts는 TS라 import 대신 매핑 줄만 읽는다 ("식당명": ["/places/..", ...])
const photoSrc = await readFile(path.join(ROOT, "lib/place-photos.ts"), "utf8");
const places = [...photoSrc.matchAll(/^\s*"([^"]+)":\s*\[([^\]]*)\]/gm)].map(([, name, list]) => ({
  name: name.normalize("NFC"),
  photos: [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
}));

const MEDIA = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const MAX_BYTES = 4.5 * 1024 * 1024; // API 이미지 한 장 한도(5MB)보다 조금 작게

const attrLines = Object.entries(schema.attributes)
  .map(([key, a]) => `- ${key} (${a.label}): 1 = ${a.low}, 5 = ${a.high}${a.caution ? ` — ${a.caution}` : ""}`)
  .join("\n");

const PROMPT = `청첩장 모임 장소를 추천하는 서비스의 식당 등록 사진이에요. 사진에 실제로 보이는 것만으로 공간 속성을 평가해 주세요.

속성 (1~5 정수, 사진으로 판단할 수 없으면 null):
${attrLines}

규칙:
- 음식만 클로즈업한 사진, 로고, 외관 사진은 공간 판단 근거로 쓰지 않아요. 단 trendiness는 플레이팅·외관도 근거로 써요.
- 실내가 보이는 사진이 없으면 trendiness를 뺀 모든 속성을 null로 둬요. trendiness도 판단할 수 없으면 confidence는 "none"이에요.
- 소리는 사진에 담기지 않으니 조용함·소음은 추정하지 않아요.
- evidence에는 근거가 된 사진 번호(1부터)와 보이는 것을 짧게 적어요.

JSON 하나로만 답해 주세요:
{"interior_photos": 정수, "formality": n|null, "seat_spacing": n|null, "separation": n|null, "liveliness": n|null, "trendiness": n|null, "confidence": "high"|"medium"|"low"|"none", "evidence": "문장"}`;

async function analyze(place) {
  const content = [];
  for (const [i, p] of place.photos.entries()) {
    const file = path.join(ROOT, "public", p.normalize("NFC"));
    const ext = path.extname(file).toLowerCase();
    let buf;
    try { buf = await readFile(file); } catch { buf = await readFile(path.join(ROOT, "public", p.normalize("NFD"))); }
    if (!MEDIA[ext] || buf.length > MAX_BYTES) {
      console.warn(`  건너뜀: ${p} (${MEDIA[ext] ? `${(buf.length / 1e6).toFixed(1)}MB` : "지원하지 않는 형식"})`);
      continue;
    }
    content.push({ type: "text", text: `사진 ${i + 1}` });
    content.push({ type: "image", source: { type: "base64", media_type: MEDIA[ext], data: buf.toString("base64") } });
  }
  content.push({ type: "text", text: PROMPT });
  if (dryRun) return { name: place.name, photos_sent: content.filter((c) => c.type === "image").length };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.content.map((c) => c.text ?? "").join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  return { name: place.name, ...json };
}

const targets = only ? places.filter((p) => p.name === only.normalize("NFC")) : places;
const results = [];
for (const place of targets) {
  process.stdout.write(`${place.name} … `);
  try {
    const r = await analyze(place);
    results.push(r);
    console.log(dryRun ? `사진 ${r.photos_sent}장` : `${r.confidence} · 실내 ${r.interior_photos}장`);
  } catch (e) {
    console.log(`실패: ${e.message}`);
    results.push({ name: place.name, error: e.message });
  }
}

if (!dryRun) {
  const date = new Date().toISOString().slice(0, 10);
  const out = path.join(ROOT, `data/vibe/ai-${date}.json`);
  await writeFile(out, JSON.stringify({ method: `Claude API (${MODEL})`, date, places: results }, null, 2));
  console.log(`\n저장: ${path.relative(ROOT, out)}\n다음: node scripts/vibe/evaluate.mjs ${path.relative(ROOT, out)}`);
}
