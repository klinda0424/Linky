# UT 모드 재구현 인수인계서 (브랜치 `ut/new-flow`)

> 이 문서는 UT 모드(앱 안에서 과제를 한 장씩 안내하고 자동 기록하는 기능)를 **최신 main 위에 새로 만드는 작업**을 팀원이 이어받기 위한 것이다.
> 작성일 2026-10-08 · 기준 main `0e25e4d` · 작성: 혜린(A담당) 세션

## 0. 한 줄 요약

`ut/new-flow` 브랜치에 UT 모드를 새로 만든다. **이 브랜치는 main에 머지하지 않는다**(옛 PR #35와 같은 "UT 전용 · 머지 금지" 방식). 주소에 `?ut=1`이 있을 때만 켜지고, 이 브랜치의 Vercel 미리보기 주소가 UT 배포 링크가 된다.

## 1. 배경과 결정 사항

- 예전 UT 모드(`?ut=1`, 과제 안내·자동 기록·CSV)는 개편 때 main에서 빠졌다. 옛 구현은 PR #35(`feat/ut-six-tasks`, 닫힘)에 있지만 **개편 이전 구조 + main보다 398커밋 뒤**라 그대로 쓸 수 없다.
- 현재 앱에는 과제 안내가 없어서, 참가자가 `docs/ut-participant-kit.md`를 따로 보며 진행해야 한다. 그걸 앱 안 안내로 바꾸는 것이 이 작업이다.
- **결정(혜린 확정):** 별도 브랜치에 두고 머지하지 않는다. 프로토타입 본체(main)는 건드리지 않는다.
- 과제 내용·성공 지점·관찰 포인트는 **`docs/ut-guide.md`의 표가 기준**이다(이미 새 흐름으로 갱신·머지됨). 문구를 바꾸고 싶으면 먼저 혜린에게 묻는다.
- 앱 흐름의 기준은 `docs/user-flows.md`다(F0~F4).

## 2. 시작하기

```bash
git fetch origin
git checkout ut/new-flow     # 이 문서만 들어 있는 상태에서 시작
pnpm install
pnpm dev                     # http://localhost:8443
```

- 이 브랜치는 main에서 갈라졌다. main이 바뀌면 `git merge origin/main`으로 따라가되, **이 브랜치를 main에 머지하지 않는다.**
- PR은 만들어도 되지만 **Draft + 제목 "[UT 전용 · 머지 금지] …"** 로 연다. Vercel 미리보기 주소를 얻는 용도다.

## 3. 옛 구현 참고 (그대로 가져다 고쳐 쓴다)

옛 코드는 아래 명령으로 읽는다. 파일을 통째로 체크아웃하지 말고 **읽고 새 구조에 맞게 옮긴다.**

```bash
git show origin/feat/ut-six-tasks:src/lib/ut.ts          # 277줄: 과제 정의, 기록, CSV
git show origin/feat/ut-six-tasks:src/components/ut.tsx  # 424줄: 안내 카드(UTLayer), 세션 훅(useUTSession)
git show origin/feat/ut-six-tasks:src/App.tsx            # UT 연결 방식 (parseUT, UTLayer)
git show origin/feat/ut-six-tasks:src/index.css | sed -n '6000,6200p'   # .ut-* 스타일
```

옛 구조에서 **살릴 것**
- `lib/ut.ts`의 기록 모델: `UTEvent`(`start/screen/tap/miss/dead/milestone/complete/giveup/ease`), `beginTask/endTask/logEvent`, localStorage 저장(`linky-ut-log`), `eventsCsv()`·`summaryCsv()`·`downloadText()`(엑셀 한글 깨짐 방지 BOM 포함).
- `parseUT(search)`: `?ut=1`, `p`(참가자 번호, 없으면 sessionStorage에 `P####` 생성), `task`(시작 과제), `share`(끝난 화면에서 기록 파일 받기, `share=0`이면 숨김).
- `components/ut.tsx`: 단계(`brief → running → complete → finished`), 탭 기록(반응 요소=`tap`, 준비 중 버튼=`dead`, 빈 곳=`miss`), 난이도 1~5 입력, 끝난 화면의 CSV 받기·복사, 진행자용 점프(`jumps`)와 숨김 제스처.

옛 구조에서 **버릴 것**
- `UTMode`(과제마다 데이터 상태를 바꾸는 모드)와 `tone`(서사/수치 톤). 새 앱은 데이터가 하나(김소연, 10/31)이고 톤 선택이 없다.
- 옛 과제 6개(U0-2, U3-1, …)와 관련 마일스톤 이름(`u02_exam` 등).

## 4. 새로 정의할 과제 (`docs/ut-guide.md` 표와 1:1)

`UT_TASKS`를 아래 11개(T1~T10 + T4B)로 만든다. `situation`은 참가자에게 읽어 주는 문구이며 **버튼 이름이나 위치를 알려 주지 않는다.** 문구는 `docs/ut-participant-kit.md`의 과제 카드를 그대로 쓴다.

| id | 상황(요약) | 성공 마일스톤 | 걸어 둘 위치(힌트) |
|---|---|---|---|
| T1 | 사진은 필요한 것만 쓰게 설정 | `t1_privacy` | `screens/onboarding.tsx` 개인정보 고지 "동의하고 계속"(거절 후 계속도 성공, detail에 갤러리 동의 여부) |
| T2 | 꼭 필요한 약관만 동의하고 불러오기 | `t2_terms` | 온보딩 4단계 `phase === "done"`(detail: `required_only` / `with_optional`) |
| T3 | 낮에 쓴 택시·포토이즘 확인하고 맞으면 확인 | `t3_both_confirmed` | 두 결제 id가 `state.restoreConfirmed`에 모두 들어감(id는 `mock/scenario.ts`) |
| T4 | 고깃집 12만원, 내가 실제로 쓴 돈으로 정리 | `t4_settled` | 정산 시트 "정산 완료"(`MainApp.tsx`의 `GroupSuggestSheet complete`). "개인 지출"은 `t4_declined`로 별도 기록 |
| T4B(선택) | 3명이었다고 가정하고 인원 수정 | `t4b_headcount3` | `screens/groupSuggest.tsx` 인원 수정에서 3명으로 "확인". 콜백을 optional prop으로 추가 |
| T5 | 어제 밤 김지은 18,000원이 뭐였는지 확인 | `t5_transfer_yes` (`t5_transfer_no`도 완료로 처리) | `MainApp.tsx`의 `confirmTransfer` / `declineTransfer` |
| T6 | 샐러디 기록 없음 → 앨범에서 사진 붙이기 | `t6_attached` | `MainApp.tsx`의 `attach`(결제 id `o85`) |
| T7 | 지도에서 결제 핀 하나 열기 | `t7_pin_open` | `screens/map.tsx` 결제 핀 선택(미리보기 카드가 뜨는 시점, 결제 핀만) |
| T8 | 방금 정산한 고깃집이 정산 내역에서 어떻게 보이는지 | `t8_settlement_list` | 리포트 > 정산함(`view === "settlementList"`). **T4를 끝낸 뒤에만 의미 있음** |
| T9 | 다음 주 약속이 있는지 확인 | `t9_report_seen` | 리포트 탭의 "다음 주 예고" 노출 |
| T10 | 10~11월에 성수에서 쓴 돈 찾기 | `t10_search_results` | `screens/search.tsx`에서 결과가 나온 시점(질의에 "성수" 포함, 질의 원문을 detail에 기록) |

### 구현 방식 권장

- **마일스톤은 모듈 전역 함수로** 둔다: `ut.ts`에서 `export const utMilestone = (name: string, detail = "") => …`(UT 꺼져 있으면 아무 일도 안 함). 옛 구현처럼 `UTApi`를 props로 내려 보내면 `MainApp.tsx`·화면 파일을 많이 건드린다. 전역 함수면 호출 한 줄씩만 넣으면 된다.
- 가능하면 **상태가 바뀌는 시점(핸들러)** 에 호출하되, T3처럼 "둘 다 확인"은 `useEffect`로 원장 상태를 보고 조건이 만족될 때 한 번만 호출한다.
- 읽기만 하는 과제(T7·T8·T9)는 "화면에 닿음"이 성공이다. 참가자는 그다음 안내 카드의 **"다 했어요"** 를 눌러 끝낸다(자동으로 넘기지 않는다).
- 화면 전환(`screen` 이벤트)은 `view`/`tab`/시트 열림이 바뀔 때 `useEffect`로 한 줄 기록한다.

## 5. 새로고침과 상태 (이게 제일 까다롭다)

- 앱은 상태를 저장하지 않는다. **새로고침하면 온보딩 1단계부터 다시 시작**하고, 정산·송금 같은 처리 상태도 초기화된다.
- 따라서 UT 세션(참가자 번호, 현재 과제, 기록)은 **localStorage/sessionStorage**에만 두고, 새로고침 뒤에는 "이어서 하기"가 아니라 **그 과제를 처음 상태에서 다시** 하게 해야 한다.
- 점프(`?task=T5` 등)로 시작하는 진행자용 진입이 필요하면:
  - T3~T10은 온보딩을 건너뛰어야 한다. 온보딩의 "개발자용 · 온보딩 건너뛰기"(`App.tsx`)와 같은 경로를 `?ut=1&task=…`에서 자동으로 타게 한다.
  - **T8은 T4가 끝난 상태가 선행 조건**이다. `?task=T8`로 점프할 때는 정산이 완료된 상태(정산 확정 + `settled`)로 원장을 미리 채워야 한다. 이 방법을 정해서 문서에 한 줄 남긴다.
  - T4B는 T4 시트 안에서만 가능하다(T4 시작 후 선택).
- 참가자 번호는 `?p=P01`로 받고, 없으면 자동 생성(옛 방식 유지).

## 6. 안내 카드 화면 (UTLayer)

- 과제 시작 전 **브리핑 카드**(상황 문구 + "시작"), 과제 중에는 화면 위쪽에 작은 칩(과제 번호·남은 안내 보기·포기), 성공 마일스톤이 찍히면 **완료 카드**(난이도 1~5 선택 → 다음 과제), 마지막에 **끝난 화면**(기록 CSV 받기·복사, `share=0`이면 숨김).
- 안내 카드는 375px 폭에서 앱 하단 탭·시트를 가리지 않아야 한다(칩은 상단, 카드는 가운데 오버레이). 정산 시트 등 `z-index: 40` 위로 올라와야 한다.
- 포기: 3분이 넘거나 참가자가 원하면 "못 하겠어요"로 기록하고 다음으로 간다(옛 `giveup`).
- 문구는 한국어, 관찰형 톤. 서비스명은 "Linky"(L만 대문자)/"링키". 평가·훈계 톤 금지.

## 7. 기록 형식

- 이벤트 CSV: `participant, task, attempt, t_ms, type, detail, at` (옛 형식 유지).
- 요약 CSV: `participant, task, attempt, result(성공/포기/미완료), duration_s, taps, misses, dead_taps, screens, ease_1to5`. 옛 `tone` 열은 뺀다.
- 파일명: `ut-summary-<P번호>.csv`, `ut-events-<P번호>.csv`.
- 참가자 이름 대신 **P번호만** 쓴다. 실제 개인정보를 기록하지 않는다.

## 8. 건드리면 안 되는 것 / 규칙

- **main에 머지하지 않는다.** main 직접 push 금지.
- `.figma/`, `vite.config.ts`의 figma 플러그인은 수정·삭제하지 않는다.
- `docs/handover.md`, `.claude/`는 커밋하지 않는다.
- 이 브랜치에서는 `MainApp.tsx`·`App.tsx`·`types.ts` 등 공용 파일을 건드려도 되지만(머지 안 함), **UT가 꺼져 있을 때(`?ut=1` 없음) 앱 동작이 main과 같아야 한다.** 호출은 전부 `utMilestone(...)`처럼 UT 꺼짐 시 무동작이어야 한다.
- 카피 규칙(`CLAUDE.md`)을 지킨다. 눌러서 갈 곳 없는 버튼을 만들지 않는다.
- 코드 식별자는 영어, 주석은 한국어(Why 중심), 커밋은 `feat(ut): 설명(한국어)` 형식.
- 새 라이브러리는 설치하지 않는다.
- Vercel은 하루 배포 한도(약 100회)가 있다. 커밋을 잘게 자주 푸시하지 말고 모아서 푸시한다. 한도에 걸리면 "Deployment rate limited — retry in 24 hours"로 실패하며 코드 문제가 아니다.

## 9. 검증 체크리스트

1. `pnpm build` 통과, `tsc --noEmit` 통과.
2. **UT 꺼짐**(`/`)에서 앱이 main과 똑같이 동작한다(안내 카드·칩이 없다).
3. **UT 켜짐**(`/?ut=1&p=P01`)에서 375px 폭으로 T1부터 T10까지 한 번씩 끝까지 진행해 본다: 브리핑 → 성공 마일스톤 → 난이도 → 다음 과제.
4. T4 → T8 순서(정산 후 정산 내역), T5(송금)가 각각 한 번만 가능함을 확인하고, 새로고침으로 초기화되는 동작을 확인한다.
5. 포기 버튼, 빈 곳 탭(`miss`), 준비 중 버튼(`dead`) 기록이 CSV에 남는지 본다.
6. 끝난 화면에서 이벤트 CSV·요약 CSV가 받아지고 엑셀에서 한글이 깨지지 않는지 본다. `share=0`이면 받기 버튼이 숨는지 본다.
7. 배포 주소를 **시크릿 창/폰(와이파이 끈 상태)** 에서 열어 로그인 없이 뜨는지 확인한다(Vercel 보호가 켜져 있으면 참가자가 못 연다. 옛 PR #35 때는 "Vercel 보호 해제 설정"을 반영했었다).

## 10. 배포와 전달

1. 브랜치를 푸시하고 Draft PR을 연다("[UT 전용 · 머지 금지] …").
2. PR의 Vercel 미리보기 주소가 UT 링크다. **커밋마다 주소가 바뀌므로** 최종 커밋 기준 주소를 쓴다.
3. 참가자에게 줄 링크: `<미리보기 주소>/?ut=1` (원격이면 `share` 기본값 켜짐, 한 기기를 돌려 쓰면 `&share=0`). 참가자 번호를 미리 줄 때는 `&p=P01`.
4. `docs/ut-participant-kit.md`의 접속 주소를 이 링크로 교체하는 PR은 **main에 올리는 별도 문서 PR**로 한다(이 브랜치가 아니라 `docs/…` 브랜치). 지금 그 문서의 주소는 앱만 있는 주소(`linky-ahya0q6dg-…`)다.
5. 주소를 바꾸면 이미 진행 중인 참가자는 이전 주소로 끝까지 하게 하고, 새 참가자부터 새 주소를 쓴다.

## 11. 현재 상태 한눈에

| 항목 | 상태 |
|---|---|
| main | `0e25e4d`, UT 문서·정산 시트·송금 이름 복원 반영 완료 |
| `docs/ut-guide.md` | 새 흐름 기준 과제 10개(+4-B) 확정 |
| `docs/ut-participant-kit.md` | 원격 진행용 안내서(주소는 앱 전용 주소, `<제출 방법>` 미정) |
| `ut/new-flow` | 이 문서만 있음. **구현은 아직 시작 안 함** |
| 옛 UT 모드 | PR #35(닫힘), 브랜치 `feat/ut-six-tasks`, 옛 미리보기 `linky-egv18fvi6-…` (사용 금지) |

## 12. 팀원 Claude에게 줄 첫 메시지 (복붙용)

```
CLAUDE.md, HANDOFF.md, docs/ut-mode-handover.md, docs/ut-guide.md를 읽어줘.
브랜치는 ut/new-flow야. 이 브랜치는 main에 머지하지 않아.
docs/ut-mode-handover.md의 4~7절대로 UT 모드를 새로 구현해줘.
옛 구현은 git show origin/feat/ut-six-tasks:src/lib/ut.ts 와 src/components/ut.tsx를 참고하되,
UTMode·tone은 빼고 과제는 T1~T10(+T4B)로 새로 정의해줘.
마일스톤은 모듈 전역 함수 utMilestone으로 호출하고, ?ut=1이 없으면 앱은 main과 똑같이 동작해야 해.
끝나면 9절 체크리스트로 검증하고, Draft PR("[UT 전용 · 머지 금지] …")을 열어줘.
```

## 13. 막히면

- 과제 문구·성공 판정이 애매하면: 임의로 바꾸지 말고 혜린에게 묻는다(`docs/ut-guide.md`가 기준).
- 흐름이 헷갈리면: `docs/user-flows.md`와 `CLAUDE.md`의 IA를 본다.
- 공용 파일 변경은 이 브랜치 안에서만 한다. main에 들어갈 변경이 필요하면(예: 앱 버그 발견) **별도 브랜치·PR**로 분리한다.
