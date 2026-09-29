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
5. 팀원 1명 이상 확인 후 머지. **자기 PR 혼자 머지 금지.**

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

## 6. 담당 파일 한눈에

| 파일 | 내용 |
|---|---|
| `screens/onboarding.tsx` | 온보딩, 톤 선택, AI 코치 소개 |
| `screens/home.tsx` | 홈 (캘린더·지출 카드·리포트 미리보기·그룹 지출 제안) |
| `screens/record.tsx` | + 기록 입력, 캡처 업로드, 일정 인식 |
| `screens/report.tsx` | 원탭 기분 입력, 하루 리포트 |
| `screens/shopping.tsx` | 지출 상세, 쇼핑 보관함, 옷장 |
| `screens/diet.tsx` | 냉장고, 식단 사진 인식 |
| `screens/health.tsx` | 건강 동의 모달, 건강 카드, 건강 보관함 |
| `screens/settlement.tsx` | 인원 분할, 그룹 지출, 정산 대기함~정산 결과 |
| `screens/travel.tsx` | 여행 이야기 카드, 여행 비용 리포트 |
| `screens/coach.tsx` | AI 코치 허브·대화, 목표 달성 관리 |
| `screens/archive.tsx` | 보관함, 비정형 검색·결과 |
| `screens/profile.tsx` | 프로필, 목표 모드 설정, 리포트 톤 설정 |

공용: `components/common.tsx`(버튼·토글 등), `components/layout.tsx`(헤더·탭바), `MainApp.tsx`(화면 연결)

---

## 7. 막혔을 때

- 빌드 에러: 에러 메시지 전체를 읽고 담당 파일 안에서 먼저 해결. 공용 파일 문제면 사용자에게 보고.
- 화면 흐름·카피가 헷갈리면: `CLAUDE.md`의 "제품 원칙"과 "시연 시나리오"를 기준으로 판단.
- 규칙과 요청이 충돌하면: 진행하지 말고 사용자에게 확인.
