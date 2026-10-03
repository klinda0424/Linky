# Linky (링키) — 프로토타입 코드베이스

> 지출을 앵커로 감정·일정·건강·쇼핑 기록을 자동 연결해 주는 AI 라이프 아카이빙 앱의 **모바일 웹 프로토타입**.
> KHUX 산학 팀프로젝트. Figma Make에서 시작해 GitHub + Vercel + Claude Code로 팀 협업 중.

@AGENTS.md
@HANDOFF.md
> ⚠️ AGENTS.md는 Figma Make 환경 기준 문서다. "dev 서버가 이미 실행 중"이라는 내용은 **로컬에서는 해당 없음** → `pnpm dev`로 직접 실행한다. 스택·스타일 규칙(Tailwind v4, default export 등)만 참고.

## 실행
```bash
pnpm install     # Node 22, pnpm 10 (.mise.toml 참고)
pnpm dev         # http://localhost:8443 (PORT 환경변수로 변경 가능)
pnpm build       # Vercel과 동일한 빌드. PR 올리기 전 반드시 통과 확인
```
- `.figma/`, `vite.config.ts` 안의 `figma*` 플러그인은 Figma Make 연동용. **수정·삭제하지 않는다.**

## 코드 구조
```
src/
├─ App.tsx              온보딩 ↔ 메인 앱 전환 (최상위 상태)
├─ MainApp.tsx          탭/화면 라우팅 + 공유 상태 (화면 추가 시 여기에 연결)
├─ types.ts             Tone, MainTab, MainView 등 공용 타입
├─ components/
│  ├─ common.tsx        Action, Toggle, Badge, Screen, StatusBar 등 공용 UI
│  └─ layout.tsx        MainHeader, BottomTabs, HomeSegments
├─ screens/             ← 플로우 단계별 담당 파일
│  ├─ onboarding.tsx  home.tsx  report.tsx  coach.tsx  record.tsx
│  ├─ shopping.tsx  diet.tsx  health.tsx  settlement.tsx  travel.tsx
│  └─ archive.tsx  profile.tsx
└─ index.css            디자인 토큰(:root) + 화면별 클래스 (아직 1파일, ~76KB)
```
- import는 `@/` 별칭 사용 (예: `import { Action } from "@/components/common"`).
- 화면 컴포넌트는 named export. `App`만 default export.
- **새 화면**은 담당 `screens/*.tsx`에 추가하거나 새 파일을 만들고, `MainApp.tsx`에는 연결 코드만 최소로 추가한다.
- `index.css` 수정은 자기 화면 클래스 블록에만 한다(충돌 방지). 토큰(`:root`) 변경은 팀 공유 후.

## 디자인 시스템 (확정)
- 포인트 컬러: **라임** (`--primary: #d6f07a`, strong `#8aa824`). 밝은 베이스 + 포인트 1개.
- 폰트: **Pretendard** (`--font-sans`). 아이콘: **lucide-react** (아웃라인).
- 모바일 기준 폭 375px, 좌우 패딩 `--page-padding: 20px`. 색상·간격은 하드코딩하지 말고 `src/index.css`의 CSS 변수를 사용.
- 서비스명 표기: "Linky" (L만 대문자) / 한글 "링키". 앱 안에서 AI가 말하는 주체도 "링키"로 부른다 (예: "링키가 정리해요", "링키의 일간 리포트"). "린이"는 쓰지 않는다.

## 제품 원칙 (UX 카피·인터랙션 작성 시 반드시 지킬 것)
멘탈모델 **"동반자"**: 나를 평가하는 가계부가 아니라, 내가 놓치는 순간을 대신 알아채고 필요한 순간에만 말을 거는 동반자.
1. **판단 없는 사실부터** — 초기 톤은 평가·훈계 금지. ("지출이 많아요!" ✕ / "오늘 3건, 4.8만원이에요" ○)
2. **관찰 문장, 답 요구 없음** — 질문·강요 대신 "~했어요" 관찰형. 건너뛰기 항상 가능.
3. **넛지는 옵트인** — 신뢰가 쌓인 뒤에만, 사용자가 켠 경우에만 노출.
4. **톤 분기는 렌더링만** — 같은 데이터를 Persona A(서사/코칭 카드) vs Persona B(리포트/수치 카드)로 다르게 보여줌. 앱 내 `Tone` 값으로 분기.
5. **개인 데이터는 개인 전용** — 건강·감정 데이터 수집은 항상 동의 모달 선행, 공유 기능 없음.
6. **입력 부담 최소화** — 추가 입력을 요구하는 화면을 만들지 않는다(원탭, 자동 인식 후 "맞나요?" 확인).

## IA (하단 탭 5개)
`홈 · 놀이터 · [+] · 보관함 · 커뮤니티` — 중앙 +는 탭바 통합형(플로팅 아님).
- 홈: 캘린더 → 지출 요약(정산 대기 뱃지) → 리포트. 우측 상단: AI 코치 / 프로필. 목표모드 뱃지는 있을 때만.
- 보관함: 상단 비정형 검색 + 일정/감정/건강/쇼핑 보관함.
- 놀이터(`screens/fun.tsx`): 링키 포인트(출석·미션), 오늘의 운세, 기록 퀴즈, 지난 하루 다시 보기. 커뮤니티는 프로토타입에서 빈 탭(`EmptyTab`).

## 시연 시나리오 (프로토타입 범위)
"제주 가서 예쁜 원피스 입으려고 버티는 한 달" — 주인공 김소연, 29화면. **★ 핵심 시연 10개**를 끝까지 끊김 없이 탈 수 있어야 함:
U0-2 일정 인식 → U1-1 목표 모드 ON → U3-1 구매항목 복원 → U4-3 식단 사진 인식 → U5-2 하루 리포트 → U6-1 건강 동의 모달 → U7-1 그룹 지출 제안 → U9-4 정산 결과 → U10-1A 여행 이야기 카드 → U11-1 비정형 검색

화면 ID ↔ 현재 컴포넌트 (함수명 기준 매핑, 어긋나면 수정할 것)
| 단계 | ID | 컴포넌트 (파일) |
|---|---|---|
| 0 여행 확정 | U0-1 / U0-2 / U0-3 | `CaptureUpload` / `RecognitionSheet` / `ImportedCalendar` (`screens/record.tsx`) |
| 1 다이어트 | U1-1 | `GoalModeSettings` (`screens/profile.tsx`) |
| 3 쇼핑 | U3-1 / U3-2 | `ExpenseDetail` / `ClosetPage` (`screens/shopping.tsx`) |
| 4 식단 | U4-1 / U4-2 / U4-3 | `FridgePage`, `FoodRecognition` (`screens/diet.tsx`) / `CoachChat` (`screens/coach.tsx`) |
| 5 리포트 | U5-1 / U5-2 | `MoodPrompt` / `DailyReport` (`screens/report.tsx`) |
| 6 건강 | U6-1 / U6-2 | `HealthConsent` / `HealthCard` (`screens/health.tsx`) |
| 7 그룹 지출 | U7-1 / U7-2 / U7-3 | `GroupSuggestion` (`screens/home.tsx`) / `GroupSplitSheet`, `GroupExpenseDetail` (`screens/settlement.tsx`) |
| 8~9 정산 | U8-2 / U9-1~4 | `SettlementInbox` `SettlementTable` `SettlementEdit` `SettlementConfirm` `SettlementResult` (`screens/settlement.tsx`) |
| 10 회고 | U10-1A / 1B / U10-2 | `TravelStory`, `TravelCostReport` (`screens/travel.tsx`) / `GoalAchievement` (`screens/coach.tsx`) |
| 11 재방문 | U11-1 / U11-2 | `ArchiveSearch`, `ArchiveSearchResults` (`screens/archive.tsx`) |

## 분업 규칙
- 담당 단위는 **`screens/` 파일(위 표의 단계)**. 자기 파일만 수정한다.
- 브랜치: `feat/<단계>-<화면>` (예: `feat/settlement-table`). **main 직접 push 금지**, PR을 올린 뒤 `pnpm build` 통과와 Vercel 프리뷰를 확인하고 **작성자가 바로 머지**한다(리뷰는 필요할 때만 요청).
- PR마다 Vercel 프리뷰 URL이 생성됨 → PR 설명에 캡처 또는 URL 첨부.
- 공통 요소(`components/`, `MainApp.tsx`)와 `:root` 토큰 변경은 팀 채팅에 먼저 공유.
- 커밋 전: `pnpm build` 통과 + 375px 모바일 폭에서 눈으로 확인.
- 데이터는 전부 **목업**(하드코딩). 실제 API/백엔드 연동 없음. 시연 스토리(김소연, 제주, 금액 등)와 숫자가 어긋나지 않게 유지.

## 기획 문서
- `docs/user-flows.md` — **통합 유저플로우 (화면별 사용자 액션 / 시스템 반응 / 분기).** 화면 동작의 기준 문서. 화면을 수정하기 전에 담당 ID 부분을 반드시 읽는다.
- 페르소나·멘탈모델·IA 원문은 Claude 프로젝트 "KHUX AXZ 산학"에 있음 (요약은 이 파일의 "제품 원칙", "IA" 참고).
