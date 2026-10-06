# 시나리오 교체 3인 분업안

> 기준 문서: [LINKY_HANDOFF.md](LINKY_HANDOFF.md)(IA·유스케이스·유저플로우). 색상은 문서 §1의 블루가 아니라 **라임**(`CLAUDE.md` 디자인 시스템)을 따른다.
> 현재 앱은 IA 골격(탭 3개, 상단 프로필 아이콘, 홈 카드, 리포트 탭)까지 반영되어 있다. 이번 라운드는 **시나리오와 데이터 교체**다.

## 0. 먼저 합의할 것: 시나리오 사실(단일 원천)

모든 담당자가 같은 숫자·이름을 쓴다. 아래 값은 `mock/scenario.ts`(A가 작성)에만 두고, 화면에 직접 적지 않는다.

| 항목 | 값 |
|---|---|
| 주인공 | 김소연, 월 120만원 |
| 기준일(오늘) | 2026-10-31 |
| 택시 | 11:35 "카카오모빌리티" 12,400원 → **압구정로데오역 2번출구 인근 택시 탑승** (직전 체류지 압구정로데오 09:30~11:20) |
| 포토이즘 | 13:10 "(주)포토이즘코리아" 4,000원 → **포토이즘 강남역점 · 강남역 11번출구** + 그날 사진 |
| 대표 결제 | 19:20 (주)한돈명가 강남역점 120,000원, 4명. 입금 3건(30,000원씩) → **내 몫 30,000 / 받을 돈 90,000** |
| 송금 | 10/30 21:30 "김지은" 18,000원 출금(가맹점 없음). 연남동 체류 19:12~21:05, 일정 "지은이랑 저녁" 20:00, 사진 "파스타·2인" → **식비 18,000원** 재분류 |
| 온보딩 | 결제내역 불러오기 → 시작 (복원 결과는 시작 후 홈·캘린더에서 확인. "N건을 채웠어요" 문구는 쓰지 않는다) |

핵심 시연 7개: F0-3 결제내역 불러오기·시작 / F1-2 포토이즘 / F1-4 택시 / F2-1→F2-4 정산 / F2-5→F2-6 링키가 찾았어요 / F4-3 다음 주 예고 / F3-4 검색.

## 1. 선행 작업 (A, 다른 사람이 시작하기 전 머지)

B·C가 같은 타입을 보고 작업하도록 **데이터 계약 PR**을 먼저 머지한다. 계약이 머지되기 전에는 B·C가 UI 골격만 만들고, 데이터 연결은 계약 머지 후에 한다.

```ts
// lib/ledger.ts 추가 (A만 수정)
Payment += {
  kind?: "card" | "transfer"            // 송금이면 가맹점 대신 상대가 있다
  counterparty?: string                  // 송금 상대 ("김지은")
  restored?: { label: string; spot?: string }  // 복원 결과: 포토이즘 강남역점 / 강남역 11번출구
  transit?: { from: string }             // 이동 복원: 탑승 지점
  deposits?: { from: string; amount: number; time: string }[]  // 정산 근거 입금
}
Photo += { content?: string }            // 내용 인식 문구 ("파스타 · 2인 세팅")
LedgerState += { restoreConfirmed: string[]; transferMatched: string[] }  // 맞아요 확정
// 함수
restoredOf(payment, state)   // 복원 결과와 근거 목록
transferGuess(payment, state) // 송금 → 정산 후보 (사진·일정·위치 근거 포함)
```

- 목업 데이터는 `mock/scenario.ts`로 분리하고 `ledger.ts`에서 합친다.
- 10월 합계 검증(`verifyOctober` 등)은 새 시나리오에 맞게 갱신하거나 끈다. 이전 핸드오버의 "10월 합계 고정" 결정은 이번 문서로 대체된다.
- 기존 10/4 대학 동기 모임 정산은 위 "대표 결제"로 교체한다(`lib/settlement.ts`의 원천 변경은 C와 합의).

## 2. 담당 분배

파일 소유를 나눠 같은 파일을 두 명이 건드리지 않게 한다. 공용 파일(`components/`, `MainApp.tsx`, `types.ts`, `lib/ledger.ts`, `index.css`의 `:root`)은 **A만 수정**하고, B·C는 필요한 변경을 A에게 요청한다.

### A (혜린) — 복원 코어 + 링키가 찾았어요
| 항목 | 유저플로우 | 파일 |
|---|---|---|
| 데이터 계약·시나리오 목업 | 위 §1 | `lib/ledger.ts` `mock/scenario.ts` `types.ts` |
| 지출 내역 복원 표현(원본 → 복원 결과, 근거, 맞아요/수정) | F1-2, F1-3, F1-4 | `screens/calendar.tsx`(결제 카드) |
| 링키가 찾았어요 제안 카드 + 송금 맥락 확인 + 재분류 | F2-5, F2-6, F2-7 | `screens/home.tsx`(알림 카드) 신규 `screens/transfer.tsx` |
| 홈 오늘의 동선 지도·사진에 새 시나리오 반영 | F1-5, F1-6 | `screens/home.tsx` `screens/map.tsx` |
| 연결 코드 | — | `MainApp.tsx` |

### B (박준태) — 리포트·검색·권한 고지
| 항목 | 유저플로우 | 파일 |
|---|---|---|
| 다음 주 예고 고도화(다음 주 일정 N건과 목록. 식비 평균 비교는 제외) | F4-3 | `screens/report.tsx` `lib/report.ts` |
| 주간·내 지출 패턴·칭찬·월간 리포트 문구와 데이터 점검 | F4-1~F4-5 | 위 동일 |
| 비정형 검색(장소·사진·일정 역색인, "성수에서 쓴 돈" "지난주 연남동") | F3-4 | `screens/search.tsx` |
| 개인정보 & 권한 고지(위치는 체류 지점만, 사진 온디바이스, 카톡 미열람) | UC-15 | `screens/profile.tsx` |

### C (강예빈) — 온보딩 분석 + 정산
| 항목 | 유저플로우 | 파일 |
|---|---|---|
| 온보딩 3단계: 개인 정보 → 서비스 권한 연동(연락처 추가) → 결제내역 불러오기 → 시작 | F0-1~F0-3 | `screens/onboarding.tsx` |
| 홈 정산 알림 → 그룹 결제 확인("한돈명가 12만원, 그룹 지출 같아요" + 입금 3건 근거) | F2-1, F2-2 | `screens/settlement.tsx` |
| 정산표·정산 완료("총 결제 12만원 → 내가 실제 쓴 돈 3만원") | F2-3, F2-4 | `screens/settlement.tsx` `lib/settlement.ts` |
| 정산 내역(리포트 탭에서 진입) | F2-8 | 위 동일 |

## 3. 순서

1. A: 데이터 계약 PR 머지(이틀 이내 목표). 그동안 B·C는 계약 없이 가능한 작업만 한다(B: 리포트 문구·검색 구조, C: 온보딩 화면 구성).
2. B·C: 계약 머지 후 `main`을 받아 데이터 연결.
3. A: 복원 표현과 링키가 찾았어요. 완료 후 7개 핵심 시연을 처음부터 끝까지 한 번 통과시킨다.
4. 마지막에 전원이 Vercel 프리뷰로 시연 흐름을 확인한다.

## 4. 모두 지킬 규칙

- 브랜치 `feat/<화면>-<내용>`, `main` 직접 push 금지, PR은 작은 단위로 올린다. `pnpm build` 통과와 375px 확인 후 머지한다.
- 새 라이브러리 설치 금지, 눌러서 갈 곳 없는 버튼·라우트 금지.
- AI 추정 화면에는 **[맞아요 / 수정]과 근거**를 함께 보인다. 평가·훈계 문구 금지, 데이터가 없으면 "기록 없음".
- 품목(옷·화장품) 단위 표현 금지. 복원 범위는 가맹점·장소까지다.
- 숫자는 `lib/ledger.ts`·`mock/scenario.ts`·`lib/report.ts`·`lib/settlement.ts`에서만 가져온다. 화면에 직접 적지 않는다.
- 코드·주석·문서·커밋에 페르소나 문구 금지. 커밋은 Conventional Commits + 한국어 설명.
- `feat/ut-six-tasks`(PR #35 Draft)는 수정·머지·닫기 금지.

## 5. 각자 AI에게 보낼 첫 메시지

### A
```
docs/LINKY_HANDOFF.md, docs/team-split.md, CLAUDE.md를 읽고 내 담당(A)을 파악해줘.
먼저 team-split.md §1의 데이터 계약(타입·mock/scenario.ts·restoredOf·transferGuess)을 구현해 PR로 올려줘.
그다음 지출 내역 복원 표현(F1-2~F1-4)과 링키가 찾았어요(F2-5~F2-7) 순서로 진행해줘.
브랜치는 feat/ledger-scenario 부터.
```

### B
```
docs/LINKY_HANDOFF.md, docs/team-split.md, CLAUDE.md를 읽고 내 담당(B)을 파악해줘.
내 파일은 screens/report.tsx, lib/report.ts, screens/search.tsx, screens/profile.tsx 이고
작업은 리포트 문구·다음 주 예고(일정 N건 목록, 식비 평균 제외), 비정형 검색(F3-4), 개인정보 & 권한 고지(UC-15)야.
공용 파일(ledger.ts, MainApp.tsx, types.ts, components/, :root)은 직접 고치지 말고 A에게 요청해야 해.
A의 데이터 계약 PR이 머지되기 전에는 계약 없이 가능한 작업만 하고, 머지되면 main을 받아 연결해줘.
브랜치는 feat/report-search 부터.
```

### C
```
docs/LINKY_HANDOFF.md, docs/team-split.md, CLAUDE.md를 읽고 내 담당(C)을 파악해줘.
내 파일은 screens/onboarding.tsx, screens/settlement.tsx, lib/settlement.ts 이고
작업은 온보딩(F0-1~F0-3, 결제내역 불러오기→시작), 정산 알림→그룹 결제 확인→정산표→완료(F2-1~F2-4)야.
공용 파일(ledger.ts, MainApp.tsx, types.ts, components/, :root)은 직접 고치지 말고 A에게 요청해야 해.
A의 데이터 계약 PR이 머지되기 전에는 화면 구성만 하고, 머지되면 main을 받아 연결해줘.
브랜치는 feat/onboarding-settlement 부터.
```
