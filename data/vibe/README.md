# 분위기 분석 (사진 → 공간 속성)

식당 등록 사진으로 격식·좌석 간격·공간 분리감·활기를 1~5로 추정한다. 결과는 **해석 값**이라
`lib/places.ts`를 직접 바꾸지 않고, 사람이 검수한 뒤에만 반영한다.

| 파일 | 내용 |
|---|---|
| `schema.json` | 속성 정의와 분위기 카드(프리셋)의 목표 조합. 카드 이름이 바뀌면 여기 프리셋만 고친다 |
| `manual-2026-10-26.json` | Claude 비전으로 99장을 직접 보고 태깅한 1차 결과 (19곳) |
| `report-*.md` | 기존 데이터와 일치율, 검수 목록, 실내 사진이 필요한 곳 |
| `labels.csv` | 비교 기준 라벨. 2026-10-26 ChatGPT가 공개 사진·후기로 매긴 웹 기반 점수(원본: `yongsan_restaurant_ambience_labels_20261026.xlsx`) |
| `labels-sources.csv` | 웹 라벨의 식당별 근거·출처 URL·신뢰도 |
| `consensus-2026-10-26.json` | 사진 분석과 웹 라벨을 합친 값. 2단계 이상 어긋난 항목은 검수 표시 |

## 실행

```bash
# 1) 사진 분석 (ANTHROPIC_API_KEY를 .env.local에 넣어야 한다)
node --env-file=.env.local scripts/vibe/analyze.mjs
node --env-file=.env.local scripts/vibe/analyze.mjs --only "쿠촐로서울"
node scripts/vibe/analyze.mjs --dry-run      # API 호출 없이 보낼 사진만 확인

# 2) 평가 (결과 파일을 넣으면 report-*.md를 만든다)
node scripts/vibe/evaluate.mjs data/vibe/ai-2026-10-26.json
```

## 판단 원칙

- 음식 클로즈업·로고·외관은 공간 근거로 쓰지 않는다. 실내 사진이 없으면 전부 null.
- 소리는 사진에 없으니 소음은 추정하지 않는다. 활기는 참고 값이다.
- 추천 문구에는 근거(사진·조명)가 아니라 결론만 쓴다. 예: "좌석 간격이 넓어 옆 테이블 신경 쓰지 않고 이야기하기 좋아요"
