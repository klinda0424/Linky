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
2. `pnpm dev`로 375px 모바일 폭에서 수정 화면과 연결된 화면(캘린더 -> 날짜 시트 -> 지도 등)이 끊기지 않는지 확인.
3. main 최신 반영 후 push
   ```bash
   git fetch origin
   git merge origin/main      # 충돌 나면 아래 5번
   git push -u origin <브랜치명>
   ```
4. GitHub `klinda0424/Linky`에서 **Compare & pull request** → PR 생성.
   - 제목: 무엇을 바꿨는지 한 줄
   - 본문: 바꾼 화면, 변경 요약, Vercel 프리뷰 URL 또는 캡처
5. `pnpm build` 통과와 Vercel 프리뷰 확인이 끝나면 **작성자가 바로 머지**한다 (Merge pull request).
   - 리뷰는 필수가 아니다. 막히거나 공용 파일(`components/`, `MainApp.tsx`, `types.ts`, `:root`)을 크게 바꿨다면 팀 채팅에 알린다.
   - 머지 전에 `git merge origin/main`으로 최신 main을 반영해 충돌이 없는지 확인한다.
   - **main 직접 push/commit은 여전히 금지.** 반드시 PR을 거친다.

---

## 4. 절대 하지 말 것

- `main`에 직접 push / commit
- 남의 `screens/` 파일 수정 (필요하면 팀 채팅에 먼저 공유)
- `components/`, `MainApp.tsx`, `types.ts`, `lib/ledger.ts`, `index.css`의 `:root` 토큰을 말없이 변경
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

## 6. 담당 구분 (개편 후)

개편으로 화면 구조가 바뀌어 이전의 A/B/C 파일 분담표는 폐기했다. 담당은 팀 채팅에서 새로 정한다. 그 전까지는 아래 단위로 나눠 작업하고, 한 PR은 한 단위만 건드린다.

| 단위 | 파일 |
|---|---|
| 캘린더·날짜 시트 | `screens/calendar.tsx` `screens/search.tsx` |
| 지도 | `screens/map.tsx` |
| 앨범·기록 입력 | `screens/album.tsx` `screens/record.tsx` |
| 온보딩·마이페이지 | `screens/onboarding.tsx` `screens/profile.tsx` |
| 정산 | `screens/settlement.tsx` `lib/settlement.ts` |
| 공용 | `components/` `MainApp.tsx` `App.tsx` `types.ts` `lib/ledger.ts` `index.css`의 `:root` |

- 공용 파일은 수정이 필요하면 직접 고치지 말고 팀 채팅에 먼저 공유한다.
- `lib/ledger.ts`의 숫자를 바꾸면 캘린더·지도·앨범·검색·리포트가 같이 바뀐다. 바꾼 뒤에는 `pnpm build`와 화면 확인을 한다.
- 다른 파일이 export한 컴포넌트의 props 형태를 바꿀 때는 사전 공유 (예: `profile.tsx`가 `onboarding.tsx`의 `permissions`, `ToneOptions`를 사용).
- 화면 동작의 기준은 `CLAUDE.md`의 IA와 카피 규칙이다. `docs/`의 옛 유저플로우는 참고만 한다.

## 7. 막혔을 때

- 빌드 에러: 에러 메시지 전체를 읽고 담당 파일 안에서 먼저 해결. 공용 파일 문제면 사용자에게 보고.
- 화면 흐름·카피가 헷갈리면: `CLAUDE.md`의 "카피·인터랙션 규칙"과 "IA"를 기준으로 판단.
- 규칙과 요청이 충돌하면: 진행하지 말고 사용자에게 확인.
