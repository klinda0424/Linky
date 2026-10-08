/**
 * Linky 사용성 테스트 제출용 구글폼 자동 생성 스크립트
 *
 * 사용법
 * 1. https://script.google.com 접속 → "새 프로젝트"
 * 2. 기본 코드를 모두 지우고 이 파일 내용을 통째로 붙여넣기
 * 3. 위쪽 함수 선택이 createLinkyUTForm 인지 확인 → "실행"
 * 4. 처음 한 번 권한 허용 창이 뜨면 본인 계정으로 허용
 * 5. 아래 "실행 로그"에 나오는 편집 주소 / 참가자용 주소를 확인
 *
 * 내용은 docs/ut-participant-kit.md(자가 기록표, 마치고 답해 주세요, 제출하기)와 같다.
 * CSV는 파일 업로드 대신 "붙여넣기" 칸으로 받는다.
 * (구글폼 파일 업로드는 응답자가 구글 로그인을 해야 해서 참가자가 막힐 수 있다.)
 */
function createLinkyUTForm() {
  const form = FormApp.create("Linky 사용성 테스트 제출")
  form.setDescription(
    "테스트를 마친 뒤 작성해 주세요. 이름 대신 참가자 번호(P__)만 적어 주세요.\n" +
      "보내 주신 내용은 이 앱을 개선하는 데에만 쓰고, 팀 공유 폴더 밖으로 내보내지 않아요.",
  )
  form.setCollectEmail(false)
  form.setLimitOneResponsePerUser(false)
  form.setProgressBar(true)

  // ---------- 1. 기본 정보 ----------
  form
    .addTextItem()
    .setTitle("참가자 번호")
    .setHelpText("안내받은 번호를 적어 주세요. 예: P01")
    .setRequired(true)
  form.addDateItem().setTitle("테스트한 날짜").setRequired(true)
  form
    .addMultipleChoiceItem()
    .setTitle("사용한 기기")
    .setChoiceValues(["폰", "노트북"])
    .setRequired(true)

  // ---------- 2. 자가 기록표 ----------
  // 과제 이름은 앱 UT 안내 카드(lib/ut.ts의 label)와 똑같이 쓴다
  const tasks = [
    "과제 1 · 개인정보 범위 설정",
    "과제 2 · 필수 약관만 동의",
    "과제 3 · 결제 맥락 확인",
    "과제 4 · 그룹 지출 정산",
    "과제 4-B (선택) · 정산 인원 수정",
    "과제 5 · 송금 맥락 확인",
    "과제 6 · 앨범에서 기록 연결",
    "과제 7 · 동선 지도 확인",
    "과제 8 · 완료된 정산 확인",
    "과제 9 · 다음 주 일정 확인",
    "과제 10 · 장소 지출 검색",
  ]
  form
    .addPageBreakItem()
    .setTitle("자가 기록표")
    .setHelpText("과제마다 한 줄씩 골라 주세요. 정확하지 않아도 괜찮아요. 하지 않은 과제는 비워 두세요.")
  form
    .addGridItem()
    .setTitle("결과")
    .setRows(tasks)
    .setColumns(["끝냈어요", "못 끝냈어요", "잘 모르겠어요"])
  form
    .addGridItem()
    .setTitle("헤맨 정도")
    .setRows(tasks)
    .setColumns(["바로 했어요", "조금 헤맸어요", "많이 헤맸어요"])
  form
    .addGridItem()
    .setTitle("쉬웠나요?")
    .setHelpText("1 매우 어려워요 ~ 5 매우 쉬워요 (앱 안 난이도 질문과 같은 방향이에요)")
    .setRows(tasks)
    .setColumns(["1", "2", "3", "4", "5"])
  form
    .addParagraphTextItem()
    .setTitle("메모")
    .setHelpText(
      "멈췄던 화면, 눌러도 아무 일 없던 곳, 이해가 안 된 문구를 화면에 쓰여 있는 그대로 적어 주세요.\n" +
        "과제 번호를 앞에 붙여 주세요. 예: 4) '정산 완료' 버튼을 못 찾았어요",
    )

  // ---------- 3. 마치고 답해 주세요 ----------
  form
    .addPageBreakItem()
    .setTitle("마치고 답해 주세요")
    .setHelpText("정답은 없어요. 느낀 그대로 짧게 적어 주세요.")
  const questions = [
    "결제 옆에 붙은 위치·일정·사진은 무엇이라고 생각했나요?",
    "\"링키가 찾았어요\"에서 보여 준 근거를 보고 어떤 생각이 들었나요?",
    "송금 이름이 \"지은이랑 연남동 저녁\"으로 바뀐 것을 어떻게 느꼈나요? 바뀐 걸 알아챘나요?",
    "그룹 지출을 정산할 때 화면이 한 장씩 올라오는 방식은 어땠나요? 어느 단계가 가장 헷갈렸나요?",
    "정산 결과의 \"결제 총액 → 내가 실제로 쓴 돈\"은 무슨 뜻이라고 이해했나요?",
    "지도의 결제 핀은 어디를 가리킨다고 생각했나요?",
    "\"기록 없음\"이라고 적힌 곳을 봤을 때 어떤 느낌이었나요?",
    "사진·위치를 쓰는 범위를 설명한 화면에서 기억나는 게 있나요?",
    "리포트의 \"다음 주 예고\"는 어떤 도움이 된다고 느꼈나요?",
    "이 앱에서 다시 쓰고 싶은 기능과 쓰고 싶지 않은 기능은요?",
  ]
  questions.forEach((question, index) =>
    form.addParagraphTextItem().setTitle(`${index + 1}. ${question}`),
  )

  // ---------- 4. 기록 파일(CSV) ----------
  form
    .addPageBreakItem()
    .setTitle("앱 기록 붙여넣기")
    .setHelpText(
      "앱에서 마지막 과제까지 끝내면 '수고하셨어요!' 화면에 버튼이 나와요.\n" +
        "① '1. 요약 파일 받기' ② '2. 상세 기록 파일 받기'를 모두 눌러 파일 2개를 받아 주세요.\n" +
        "받은 파일을 메모장(또는 엑셀)으로 열어 전체 선택 → 복사 → 아래 칸에 붙여넣어 주세요.\n" +
        "파일이 안 받아지면 '두 기록 한 번에 복사하기'를 누르고, 복사된 내용을 '요약 기록' 칸에 통째로 붙여넣어 주세요.",
    )
  form
    .addParagraphTextItem()
    .setTitle("요약 기록 (ut-summary)")
    .setHelpText("ut-summary-P__.csv 내용")
  form
    .addParagraphTextItem()
    .setTitle("상세 기록 (ut-events)")
    .setHelpText("ut-events-P__.csv 내용 (길어도 그대로 붙여넣어 주세요. 너무 길어 안 들어가면 아래 링크 칸을 써 주세요)")
  form
    .addParagraphTextItem()
    .setTitle("파일·녹화 링크 (선택)")
    .setHelpText(
      "기록이 너무 길어 붙여넣기가 안 되거나 녹화·녹음을 했다면, 구글 드라이브 등에 올린 뒤 공유 링크를 적어 주세요.",
    )

  form.setConfirmationMessage("제출해 주셔서 감사합니다!")

  // 응답을 모아 볼 스프레드시트도 함께 만든다
  const sheet = SpreadsheetApp.create("Linky 사용성 테스트 응답")
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId())

  Logger.log("편집 주소: " + form.getEditUrl())
  Logger.log("참가자용 주소: " + form.getPublishedUrl())
  Logger.log("응답 시트: " + sheet.getUrl())
}
