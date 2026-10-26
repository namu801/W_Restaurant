// 분위기 분석 결과(data/vibe/*.json)를 두 기준과 비교한다.
//  1) 기존 식당 데이터(lib/places.ts의 seatType·formalityTags·noiseLevel) — "일치율". 기존 데이터도 사람이
//     추정해서 넣은 값이라 정답은 아니다. 어긋난 곳은 검수 목록으로 뽑는다.
//  2) 사람이 직접 단 정답(data/vibe/labels.csv) — 채워져 있을 때만 "정확도"를 계산한다.
//
// 실행: node scripts/vibe/evaluate.mjs data/vibe/manual-2026-10-26.json

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const srcArg = process.argv[2];
if (!srcArg) { console.error("결과 파일 경로를 넣어 주세요."); process.exit(1); }
const result = JSON.parse(await readFile(path.resolve(ROOT, srcArg), "utf8"));

// --- 기존 식당 데이터 읽기 (id가 name 앞에 오므로 name부터 다음 name 전까지가 한 식당의 나머지 필드다)
const src = await readFile(path.join(ROOT, "lib/places.ts"), "utf8");
const starts = [...src.matchAll(/\n\s{4}name: "/g)].map((m) => m.index);
const existing = {};
starts.forEach((s, i) => {
  const block = src.slice(s, starts[i + 1] ?? src.length);
  const get = (k) => block.match(new RegExp(`${k}: ([^\\n]+)`))?.[1];
  const name = block.match(/name: "([^"]+)"/)[1].normalize("NFC");
  existing[name] = {
    seatType: get("seatType")?.match(/"([^"]+)"/)?.[1],
    formalityTags: [...(get("formalityTags") ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    noiseLevel: get("noiseLevel")?.match(/"([^"]+)"/)?.[1],
  };
});

// 기존 값을 같은 1~5 척도로 옮긴다. 1단계 차이까지는 일치로 본다
const SEAT = { room: 5, "semi-private": 4, wide: 2, open: 1 };
const FORMAL = { formal: 5, hospitable: 4, balanced: 3, casual: 1.5 };
const NOISE = { quiet: 1.5, moderate: 3, lively: 4.5 };
const close = (a, b) => Math.abs(a - b) <= 1;

const checks = {
  separation: { label: "공간 분리감 ↔ seatType", ref: (e) => SEAT[e.seatType] },
  formality: { label: "격식 ↔ formalityTags", ref: (e) => e.formalityTags.map((t) => FORMAL[t]).filter(Boolean) },
  liveliness: { label: "활기 ↔ noiseLevel (참고)", ref: (e) => NOISE[e.noiseLevel] },
};

const stats = {}; const review = [];
for (const p of result.places) {
  const e = existing[p.name.normalize("NFC")];
  if (!e) continue;
  for (const [key, c] of Object.entries(checks)) {
    const mine = p[key]; const ref = c.ref(e);
    if (mine == null || ref == null || (Array.isArray(ref) && !ref.length)) continue;
    const ok = Array.isArray(ref) ? ref.some((r) => close(mine, r)) : close(mine, ref);
    (stats[key] ??= { n: 0, ok: 0 }).n++;
    if (ok) stats[key].ok++;
    else review.push({ name: p.name, key, mine, existing: key === "separation" ? e.seatType : key === "formality" ? e.formalityTags.join("/") : e.noiseLevel, evidence: p.evidence });
  }
}

// --- 사람이 단 정답이 있으면 정확도
let accuracy = null;
try {
  const rows = (await readFile(path.join(ROOT, "data/vibe/labels.csv"), "utf8")).trim().split("\n").map((l) => l.split(","));
  const [head, ...body] = rows;
  const labeled = body.filter((r) => r.slice(1).some((v) => v.trim()));
  if (labeled.length) {
    accuracy = {};
    for (const key of ["formality", "seat_spacing", "separation", "liveliness"]) {
      const col = head.indexOf(key);
      for (const r of labeled) {
        const truth = Number(r[col]); const p = result.places.find((x) => x.name === r[0]);
        if (!r[col]?.trim() || !p || p[key] == null) continue;
        (accuracy[key] ??= { n: 0, exact: 0, within1: 0 }).n++;
        if (p[key] === truth) accuracy[key].exact++;
        if (close(p[key], truth)) accuracy[key].within1++;
      }
    }
  }
} catch { /* labels.csv 없음 */ }

const total = result.places.length;
const judged = result.places.filter((p) => p.confidence !== "none").length;
const interior = result.places.reduce((s, p) => s + (p.interior_photos ?? 0), 0);
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "-");

let md = `# 분위기 분석 평가 — ${path.basename(srcArg)}\n\n`;
md += `- 분석 방식: ${result.method}\n- 식당 ${total}곳 중 판단 가능 ${judged}곳 (${pct(judged, total)})\n`;
if (result.photos_total) md += `- 사진 ${result.photos_total}장 중 실내 사진 ${interior}장 (${pct(interior, result.photos_total)})\n`;
md += `\n## 기존 데이터와 일치율 (1단계 차이까지 일치)\n\n| 속성 | 비교 가능 | 일치 | 일치율 |\n|---|---|---|---|\n`;
for (const [key, c] of Object.entries(checks)) { const s = stats[key] ?? { n: 0, ok: 0 }; md += `| ${c.label} | ${s.n} | ${s.ok} | ${pct(s.ok, s.n)} |\n`; }
md += `\n## 사람 정답 기준 정확도\n\n`;
if (accuracy) { md += `| 속성 | 표본 | 정확히 일치 | 1단계 이내 |\n|---|---|---|---|\n`; for (const [k, a] of Object.entries(accuracy)) md += `| ${k} | ${a.n} | ${pct(a.exact, a.n)} | ${pct(a.within1, a.n)} |\n`; }
else md += `data/vibe/labels.csv가 비어 있어 계산하지 않았어요.\n`;
md += `\n## 검수가 필요한 곳 (${review.length}건)\n\n| 식당 | 속성 | 분석 | 기존 | 근거 |\n|---|---|---|---|---|\n`;
for (const r of review) md += `| ${r.name} | ${r.key} | ${r.mine} | ${r.existing} | ${r.evidence} |\n`;
const need = result.places.filter((p) => p.confidence === "none" || (p.interior_photos ?? 0) === 0).map((p) => p.name);
md += `\n## 실내 사진이 필요한 곳 (${need.length}곳)\n\n${need.map((n) => `- ${n}`).join("\n")}\n`;

const out = path.join(ROOT, "data/vibe", `report-${path.basename(srcArg, ".json")}.md`);
await writeFile(out, md);
console.log(md);
console.log(`저장: ${path.relative(ROOT, out)}`);
