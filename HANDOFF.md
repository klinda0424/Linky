# Linky 팀원 인계서 (AI용)

> 이 파일은 팀원이 자기 Claude Code에게 넘기는 **작업 시작 가이드**다.
> 프로젝트 맥락·디자인·UX 원칙은 `CLAUDE.md`에 있고 자동으로 읽힌다. 이 파일은 **협업 절차**만 다룬다.

---

## 0. 팀원이 AI에게 보낼 첫 메시지 (복붙용)

```
HANDOFF.md와 CLAUDE.md를 읽고 이 프로젝트 협업 규칙을 파악해줘.
내 담당 파일은 src/screens/<파일명>.tsx 이고, 이번에 할 작업은 <작업 내용>이야.
HANDOFF.md의 "작업 시작 절차"대로 브랜치부터 만들고 시작해줘.
```

---

## 1. 최초 1회 세팅

```bash
git clone https://github.com/klinda0424/Linky.git
cd Linky
npm i -g pnpm        # pnpm 없을 때만
pnpm install
pnpm dev             # http://localhost:8443
```
- Node 22 이상 필요 (`node -v`로 확인).
- **반드시 `Linky` 폴더 안에서** 명령어 실행. 홈 폴더에서 `git init`/`git add` 금지.

---

## 2. 작업 시작 절차 (매번)

AI는 아래 순서를 지킨다.

1. 최신 main 받기
   ```bash
   git checkout main
   git pull
   pnpm install
   ```
2. 작업 브랜치 생성 — 이름: `feat/<화면>-<내용>` (예: `feat/settlement-swipe`)
   ```bash
   git checkout -b feat/settlement-swipe
   ```
3. 담당 파일(`src/screens/*.tsx`)과 그 화면의 CSS 블록만 수정.
4. 수시로 커밋 (작게, 한 가지 변경 = 한 커밋)
   ```bash
   git add <수정한 파일>
   git commit -m "feat(settlement): 항목 스와이프 제외 인터랙션"
   ```

---

## 3. 작업 끝낼 때

1. `pnpm build` 통과 확인. 실패하면 고치고 다시.
2. `pnpm dev`로 375px 모바일 폭에서 수정 화면 + 핵심 시연 흐름이 끊기지 않는지 확인.
3. main 최신 반영 후 push
   ```bash
   git fetch origin
   git merge origin/main      # 충돌 나면 아래 5번
   git push -u origin <브랜치명>
   ```
4. GitHub `klinda0424/Linky`에서 **Compare & pull request** → PR 생성.
   - 제목: 무엇을 바꿨는지 한 줄
   - 본문: 바꾼 화면 ID(U3-1 등), 변경 요약, Vercel 프리뷰 URL 또는 캡처
5. `pnpm build` 통과와 Vercel 프리뷰 확인이 끝나면 **작성자가 바로 머지**한다 (Merge pull request).
   - 리뷰는 필수가 아니다. 막히거나 공용 파일(`components/`, `MainApp.tsx`, `types.ts`, `:root`)을 크게 바꿨다면 팀 채팅에 알린다.
   - 머지 전에 `git merge origin/main`으로 최신 main을 반영해 충돌이 없는지 확인한다.
   - **main 직접 push/commit은 여전히 금지.** 반드시 PR을 거친다.

---

## 4. 절대 하지 말 것

- `main`에 직접 push / commit
- 남의 `screens/` 파일 수정 (필요하면 팀 채팅에 먼저 공유)
- `components/`, `MainApp.tsx`, `types.ts`, `index.css`의 `:root` 토큰을 말없이 변경
- `.figma/`, `vite.config.ts`의 figma 플러그인 수정·삭제
- `git push --force`, `git reset --hard` (복구 불가)
- 새 라이브러리 설치 (필요하면 팀에 먼저 공유)
- 실제 API·백엔드 연동 (전부 목업 데이터)

---

## 5. 충돌(conflict) 났을 때

- AI는 충돌 파일을 열어 `<<<<<<<` 구간을 확인하고, **남의 변경을 지우지 않는 방향**으로 합친다.
- 어느 쪽을 살려야 할지 애매하면 추측하지 말고 사용자에게 물어본다.
- 해결 후: `git add <파일>` → `git commit` → `pnpm build` 재확인.

---

## 6. 역할별 담당 (3명)

| 역할 | 담당 파일 | 담당 화면 (docs/user-flows.md의 ID) | ★ 핵심 시연 |
|---|---|---|---|
| **A. 입력·인식** | `screens/record.tsx` `shopping.tsx` `diet.tsx` `health.tsx` | U0 일정 인식·캡처 업로드, U3 구매항목 복원·옷장, U4-1 냉장고·U4-3 식단 사진 인식, U6 건강 동의·카드 | U0-2, U3-1, U4-3, U6-1 |
| **B. 돈·정산·회고** | `screens/settlement.tsx` `report.tsx` `travel.tsx` `coach.tsx` `archive.tsx` | U5 기분 입력·하루 리포트, U7-2/3 인원 분할·지출 상세, U8~U9 정산, U10 여행 이야기·비용 리포트·목표 달성, U4-2 코치 대화, U11 비정형 검색 | U5-2, U9-4, U10-1A, U11-1 |
| **C. 홈·설정·통합** | `screens/home.tsx` `onboarding.tsx` `profile.tsx` + 공용 (`components/` `MainApp.tsx` `types.ts` `index.css`의 `:root`) | 홈, 온보딩, 목표 모드·톤 설정, U7-1 그룹 지출 알림, 화면 연결·통합 점검, PR 머지 | U1-1, U7-1 |

- 공용 파일(`components/`, `MainApp.tsx`, `types.ts`, `:root` 토큰)은 **C 담당**. A·B가 수정이 필요하면 직접 고치지 말고 C에게 요청.
- 다른 역할 파일이 export한 컴포넌트의 props 형태를 바꿀 때는 사전 공유 (예: `home.tsx`가 `health.tsx`의 `HealthCard`를 사용, `profile.tsx`가 `onboarding.tsx`의 `ToneOptions`를 사용).
- 화면 동작의 기준은 `docs/user-flows.md`. 담당 ID의 "사용자 액션 / 시스템 반응 / 분기"가 실제로 동작해야 한다.

## 7. 막혔을 때

- 빌드 에러: 에러 메시지 전체를 읽고 담당 파일 안에서 먼저 해결. 공용 파일 문제면 사용자에게 보고.
- 화면 흐름·카피가 헷갈리면: `CLAUDE.md`의 "제품 원칙"과 "시연 시나리오"를 기준으로 판단.
- 규칙과 요청이 충돌하면: 진행하지 말고 사용자에게 확인.
