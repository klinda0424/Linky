import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react"
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Info,
  Link2,
  MapPin,
  MonitorUp,
  RotateCcw,
  ScanLine,
  Square,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react"
import {
  Action,
  EditableLine,
  PageTitle,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type MoodEmoji, moods } from "@/screens/report"

export const recordTiles: Array<{
  key: string
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    key: "photo",
    label: "사진",
    description: "음식·영수증·옷",
    icon: <Image size={19} strokeWidth={1.5} />,
  },
  {
    key: "capture",
    label: "캡처",
    description: "카톡 약속·예약 문자",
    icon: <Camera size={19} strokeWidth={1.5} />,
  },
  {
    key: "link",
    label: "웹 링크",
    description: "학사일정·공지",
    icon: <Link2 size={19} strokeWidth={1.5} />,
  },
  {
    key: "text",
    label: "텍스트",
    description: "한 줄이면 충분해요",
    icon: <FileText size={19} strokeWidth={1.5} />,
  },
  {
    key: "video",
    label: "영상",
    description: "짧은 클립",
    icon: <Video size={19} strokeWidth={1.5} />,
  },
  {
    key: "record",
    label: "화면 녹화",
    description: "시작하면 자동 수집",
    icon: <ScanLine size={19} strokeWidth={1.5} />,
  },
]
export function RecordSheet({
  close,
  openInput,
  mood,
}: {
  close: () => void
  openInput: (
    view: "quick" | "link" | "captureImport" | "food" | "screenRecording",
  ) => void
  // 고른 기분을 지금 홈 단계의 오늘 결제와 연결한다 (U5-1, 하루 리포트와 같은 다섯 가지)
  mood: (mood: MoodEmoji) => void
}) {
  return (
    <div className="main-overlay" onClick={close}>
      <div
        className="record-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-grip" />
        <p className="sheet-title">무엇을 남길까요?</p>
        <p className="sheet-sub">올리기만 하면 린이가 정리해요</p>
        <div className="record-tiles">
          {recordTiles.map((item) => (
            <Action
              className="record-tile"
              key={item.key}
              onClick={
                item.key === "text"
                  ? () => openInput("quick")
                  : item.key === "link"
                    ? () => openInput("link")
                    : item.key === "capture"
                      ? () => openInput("captureImport")
                      : item.key === "photo"
                        ? () => openInput("food")
                        : item.key === "record"
                          ? () => openInput("screenRecording")
                          : undefined
              }
            >
              <span className="record-icon">{item.icon}</span>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Action>
          ))}
        </div>
        <div className="mood-block">
          <p>오늘 기분은요?</p>
          <div>
            {moods.map((item) => (
              <Action
                className="mood-button"
                key={item.emoji}
                label={item.label}
                onClick={() => mood(item.emoji)}
              >
                {item.emoji}
              </Action>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CaptureImport({ back }: { back: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState("")
  const [fileName, setFileName] = useState("")
  const [state, setState] = useState<"select" | "loading" | "complete">(
    "select",
  )

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  useEffect(() => {
    if (state !== "loading") return

    const timer = window.setTimeout(() => setState("complete"), 1200)

    return () => window.clearTimeout(timer)
  }, [state])

  const openPicker = () => {
    if (inputRef.current) inputRef.current.value = ""
    inputRef.current?.click()
  }

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]

    if (!file) return

    if (preview) URL.revokeObjectURL(preview)

    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    setState("select")
  }

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="캡처 가져오기" />
      <div className="capture-content capture-import-content">
        <PageTitle
          sub="결제 내역이나 일정, 주문 화면 등의 캡처를 올려주세요"
          title="캡처에서 기록을 가져올게요"
        />
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-label="캡처 파일 선택"
          className="capture-file-input"
          onChange={selectFile}
          ref={inputRef}
          type="file"
        />
        {state === "loading" ? (
          <div className="capture-zone recognizing">
            <span className="capture-icon">
              <ScanLine size={24} strokeWidth={1.5} />
            </span>
            <strong>캡처 내용을 살펴보고 있어요...</strong>
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : state === "complete" ? (
          <div className="capture-import-complete">
            <span>
              <Check size={25} strokeWidth={2} />
            </span>
            <strong>캡처에서 기록을 가져왔어요</strong>
            <p>찾은 내용은 보관함에서 다시 확인할 수 있어요</p>
          </div>
        ) : preview ? (
          <>
            <div className="capture-preview">
              <img alt="선택한 캡처 미리보기" src={preview} />
              <span>{fileName}</span>
            </div>
            <div className="capture-import-question">
              <strong>이 캡처를 기록으로 가져올까요?</strong>
              <p>확인하면 린이가 필요한 내용을 찾아볼게요</p>
            </div>
          </>
        ) : (
          <Action className="capture-zone" onClick={openPicker}>
            <span className="capture-icon">
              <Upload size={24} strokeWidth={1.5} />
            </span>
            <strong>캡처 선택하기</strong>
            <span>JPG · PNG · WEBP</span>
          </Action>
        )}
      </div>
      {state === "select" && preview && (
        <div className="main-footer capture-import-actions">
          <Action className="secondary-button" onClick={openPicker}>
            다시 선택
          </Action>
          <Action className="primary-button" onClick={() => setState("loading")}>
            가져오기
          </Action>
        </div>
      )}
      {state === "complete" && (
        <div className="main-footer">
          <Action className="primary-button" onClick={back}>
            홈으로 돌아가기
          </Action>
        </div>
      )}
    </div>
  )
}

const recordingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

export function ScreenRecording({ back }: { back: () => void }) {
  const [state, setState] = useState<
    "ready" | "recording" | "review" | "processing" | "complete"
  >("ready")
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (state !== "recording") return

    const timer = window.setInterval(
      () => setSeconds((current) => current + 1),
      1000,
    )

    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (state !== "processing") return

    const timer = window.setTimeout(() => setState("complete"), 1200)

    return () => window.clearTimeout(timer)
  }, [state])

  const start = () => {
    setSeconds(0)
    setState("recording")
  }

  return (
    <div className="main-page screen-recording-page">
      <div className="screen-recording-top">
        <Action
          className="recording-close"
          label="화면 녹화 취소"
          onClick={back}
        >
          <X size={21} strokeWidth={1.7} />
        </Action>
        {state === "recording" ? (
          <span className="recording-live">
            <i /> REC {recordingTime(seconds)}
          </span>
        ) : (
          <strong>화면 녹화</strong>
        )}
        <span className="recording-top-spacer" />
      </div>

      <div className="screen-recording-content">
        {state === "ready" && (
          <>
            <span className="recording-visual">
              <MonitorUp size={38} strokeWidth={1.3} />
            </span>
            <h1>화면을 기록해볼까요?</h1>
            <p>
              앱이나 웹을 사용하는 과정을 남기면 Linky가 필요한 기록을
              찾아드려요
            </p>
          </>
        )}
        {state === "recording" && (
          <>
            <span className="recording-visual active">
              <ScanLine size={38} strokeWidth={1.3} />
            </span>
            <h1>지금 화면을 기록하고 있어요</h1>
            <p>필요한 장면을 모두 담았다면 아래 버튼으로 멈춰주세요</p>
          </>
        )}
        {state === "review" && (
          <>
            <span className="recording-visual complete">
              <Check size={38} strokeWidth={1.7} />
            </span>
            <h1>화면 녹화를 완료했어요</h1>
            <p>Linky가 기록할 내용을 살펴볼게요</p>
            <span className="recording-duration">
              녹화 시간 {recordingTime(seconds)}
            </span>
          </>
        )}
        {state === "processing" && (
          <>
            <span className="recording-visual active">
              <ScanLine size={38} strokeWidth={1.3} />
            </span>
            <h1>녹화 내용을 살펴보고 있어요...</h1>
            <p>필요한 기록을 찾는 중이에요</p>
          </>
        )}
        {state === "complete" && (
          <>
            <span className="recording-visual complete">
              <Check size={38} strokeWidth={1.7} />
            </span>
            <h1>화면 녹화를 기록으로 가져왔어요</h1>
            <p>찾은 내용은 보관함에서 다시 확인할 수 있어요</p>
          </>
        )}
      </div>

      <div className="screen-recording-controls">
        {state === "ready" && (
          <Action className="record-control" label="녹화 시작" onClick={start}>
            <span />
          </Action>
        )}
        {state === "recording" && (
          <Action
            className="record-control recording"
            label="녹화 종료"
            onClick={() => setState("review")}
          >
            <Square size={24} fill="currentColor" strokeWidth={0} />
          </Action>
        )}
        {state === "review" && (
          <div className="recording-review-actions">
            <Action className="recording-secondary" onClick={start}>
              <RotateCcw size={17} strokeWidth={1.7} />
              다시 녹화
            </Action>
            <Action
              className="recording-primary"
              onClick={() => setState("processing")}
            >
              사용하기
            </Action>
          </div>
        )}
        {state === "complete" && (
          <Action className="recording-primary wide" onClick={back}>
            홈으로 돌아가기
          </Action>
        )}
      </div>
    </div>
  )
}

export function QuickRecord({ back }: { back: () => void }) {
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(false)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="한 줄 기록" />
      <div className="sub-content">
        <p className="sub-heading">오늘 있었던 일을 알려주세요</p>
        <EditableLine
          placeholder="예: 시험 끝나고 친구랑 저녁 먹었어요"
          setValue={setValue}
          value={value}
        />
        <div className="suggestion-chips">
          {["시험 끝남", "친구랑 저녁", "병원 다녀옴"].map((item) => (
            <Action
              className={cx("suggestion-chip", value === item && "selected")}
              key={item}
              onClick={() => setValue(item)}
            >
              {item}
            </Action>
          ))}
        </div>
        {saved && (
          <div className="connect-card">
            <span className="connect-icon">
              <Link2 size={19} strokeWidth={1.5} />
            </span>
            <p>관련 지출 2건과 연결할까요?</p>
            <span>같은 시간대의 결제를 찾았어요</span>
            <div className="confirm-buttons">
              <Action className="secondary-button" onClick={back}>
                아니요
              </Action>
              <Action className="primary-button" onClick={back}>
                연결하기
              </Action>
            </div>
          </div>
        )}
      </div>
      {!saved && (
        <div className="main-footer">
          <Action
            className="primary-button"
            disabled={!value}
            onClick={() => setSaved(true)}
          >
            저장
          </Action>
        </div>
      )}
    </div>
  )
}
// U0 여행 확정: 일정 등록은 두 갈래다.
// 단톡 캡처 → 제주 여행(장소·날짜·인원) / 학사일정 웹 링크 → 시험기간(일정명·날짜)
export type ScheduleKind = "travel" | "exam"
const scheduleLink = "학교 학사일정 · 2024-2학기"

export function LinkRecord({
  back,
  confirm,
}: {
  back: () => void
  // 시험기간을 확인(맞아요)하면 캘린더(U0-3)로
  confirm: () => void
}) {
  const [state, setState] = useState<"idle" | "recognizing" | "recognized">(
    "idle",
  )
  const [url, setUrl] = useState("")
  const hasLink = Boolean(url.trim())
  useEffect(() => {
    if (state !== "recognizing") return
    const timer = window.setTimeout(() => setState("recognized"), 1500)
    return () => window.clearTimeout(timer)
  }, [state])
  const recognizing = state !== "idle"
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="링크 업로드" />
      <div className="capture-content">
        <PageTitle
          sub="시험·방학 같은 학교 일정을 가져올게요"
          title={"학사일정 링크를\n붙여 넣어주세요"}
        />
        {recognizing ? (
          <div className="capture-zone recognizing">
            <span className="capture-icon">
              <ScanLine size={24} strokeWidth={1.5} />
            </span>
            <strong>페이지에서 기간을 찾는 중</strong>
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : (
          <>
            <div className={cx("capture-link", hasLink && "attached")}>
              <div className="capture-link-field">
                <Link2 size={16} strokeWidth={1.6} />
                <input
                  aria-label="학사일정 링크"
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://"
                  value={url}
                />
              </div>
              {!hasLink && (
                <Action
                  className="suggestion-chip"
                  onClick={() => setUrl(scheduleLink)}
                >
                  복사한 링크 붙여넣기
                </Action>
              )}
            </div>
            <div className="upload-example">
              <p>이런 링크를 가져올 수 있어요</p>
              <div>
                {["학교 학사일정", "학과 공지", "시험 시간표"].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {!recognizing && (
        <div className="main-footer">
          <Action
            className="primary-button"
            disabled={!hasLink}
            onClick={() => setState("recognizing")}
          >
            기간 찾기
          </Action>
        </div>
      )}
      {state === "recognized" && (
        <RecognitionSheet confirm={confirm} kind="exam" />
      )}
    </div>
  )
}
type ScheduleDraft = {
  examName: string
  examDate: string
  tripPlace: string
  tripDate: string
  people: number
}
const recognizedSchedule: ScheduleDraft = {
  examName: "기말고사",
  examDate: "12월 9일~20일",
  tripPlace: "제주도",
  tripDate: "12월 22일~24일",
  people: 3,
}
const tripMembers = ["나", "수현", "민지"]
const kindFields: Record<ScheduleKind, Array<keyof ScheduleDraft>> = {
  exam: ["examName", "examDate"],
  travel: ["tripPlace", "tripDate", "people"],
}

export function RecognitionSheet({
  confirm,
  kind,
}: {
  confirm: () => void
  // 캡처는 여행만, 학사일정 링크는 시험기간만 인식한다
  kind: ScheduleKind
}) {
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(false)
  const [draft, setDraft] = useState<ScheduleDraft>(recognizedSchedule)
  const [saved, setSaved] = useState<ScheduleDraft>(recognizedSchedule)
  const shown = editing ? draft : saved
  const peopleLabel = (count: number) =>
    count === tripMembers.length
      ? `${count}명 (${tripMembers.join(", ")})`
      : `${count}명`
  const complete = kindFields[kind].every((key) => {
    const value = draft[key]
    return typeof value === "string" ? value.trim() : value > 0
  })
  const group: {
    title: string
    source: string
    rows: Array<{
      key: Exclude<keyof ScheduleDraft, "people">
      label: string
      icon: ReactNode
    }>
  } =
    kind === "exam"
      ? {
          title: "시험기간",
          source: "학사일정 링크에서",
          rows: [
            {
              key: "examName",
              label: "일정명",
              icon: <FileText size={18} strokeWidth={1.5} />,
            },
            {
              key: "examDate",
              label: "날짜",
              icon: <CalendarDays size={18} strokeWidth={1.5} />,
            },
          ],
        }
      : {
          title: "여행",
          source: "단톡 캡처에서",
          rows: [
            {
              key: "tripPlace",
              label: "장소",
              icon: <MapPin size={18} strokeWidth={1.5} />,
            },
            {
              key: "tripDate",
              label: "날짜",
              icon: <CalendarDays size={18} strokeWidth={1.5} />,
            },
          ],
        }
  const startEdit = () => {
    setDraft(saved)
    setEditing(true)
  }
  const finishEdit = () => {
    setSaved(draft)
    setEdited(true)
    setEditing(false)
  }
  return (
    <div className="recognition-overlay">
      <div className="recognition-sheet">
        <div className="sheet-grip" />
        <div className="recognition-title">
          <span>
            <Check size={14} strokeWidth={2.2} />
          </span>
          <p>
            {editing
              ? "틀린 부분만 고쳐주세요"
              : edited
                ? "고친 내용으로 바꿨어요"
                : "린이가 인식한 내용이에요"}
          </p>
        </div>
        {!editing && (
          <p className="recognition-question">
            {kind === "exam"
              ? `${saved.examDate} ${saved.examName} 맞나요?`
              : `${saved.tripDate} ${saved.tripPlace} ${saved.people}명 맞나요?`}
          </p>
        )}
        <div className="recognition-groups">
          <div className="recognition-group">
            <p className="recognition-group-title">
              {group.title}
              <span>{group.source}</span>
            </p>
            <div className="recognition-rows">
              {group.rows.map((row) => (
                <div
                  className={cx("recognition-row", editing && "editing")}
                  key={row.key}
                >
                  <span className="recognition-row-icon">{row.icon}</span>
                  <div>
                    <span>{row.label}</span>
                    {editing ? (
                      <input
                        aria-label={`${group.title} ${row.label}`}
                        className="recognition-value"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [row.key]: event.target.value,
                          }))
                        }
                        value={draft[row.key]}
                      />
                    ) : (
                      <strong>{shown[row.key]}</strong>
                    )}
                  </div>
                </div>
              ))}
              {kind === "travel" && (
                <div className={cx("recognition-row", editing && "editing")}>
                  <span className="recognition-row-icon">
                    <Users size={18} strokeWidth={1.5} />
                  </span>
                  <div>
                    <span>인원</span>
                    {editing ? (
                      <div className="recognition-people">
                        {[2, 3, 4, 5].map((count) => (
                          <Action
                            className={cx(
                              "suggestion-chip",
                              draft.people === count && "selected",
                            )}
                            key={count}
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                people: count,
                              }))
                            }
                          >
                            {count}명
                          </Action>
                        ))}
                      </div>
                    ) : (
                      <strong>{peopleLabel(shown.people)}</strong>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="ai-confirm-buttons">
          {editing ? (
            <>
              <Action
                className="secondary-button"
                onClick={() => setEditing(false)}
              >
                취소
              </Action>
              <Action
                className="primary-button"
                disabled={!complete}
                onClick={finishEdit}
              >
                완료
              </Action>
            </>
          ) : (
            <>
              <Action className="secondary-button" onClick={startEdit}>
                수정
              </Action>
              <Action className="primary-button" onClick={confirm}>
                맞아요
              </Action>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function CaptureUpload({
  back,
  confirm,
}: {
  back: () => void
  // 제주 여행을 확인(맞아요)하면 캘린더(U0-3)로
  confirm: () => void
}) {
  const [state, setState] = useState<"idle" | "recognizing" | "recognized">(
    "idle",
  )
  const [captured, setCaptured] = useState(false)
  useEffect(() => {
    if (state !== "recognizing") return
    const timer = window.setTimeout(() => setState("recognized"), 1500)
    return () => window.clearTimeout(timer)
  }, [state])
  const recognizing = state !== "idle"
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="캡처 업로드" />
      <div className="capture-content">
        <PageTitle
          sub="날짜·장소·인원은 린이가 찾아둘게요"
          title={"여행 약속을 캡처해서\n올려주세요"}
        />
        {recognizing ? (
          <div className="capture-zone recognizing">
            <span className="capture-icon">
              <ScanLine size={24} strokeWidth={1.5} />
            </span>
            <strong>날짜·장소·인원을 찾는 중</strong>
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : (
          <>
            <Action
              className={cx("capture-zone", captured && "attached")}
              onClick={() => setCaptured(true)}
            >
              <span className="capture-icon">
                {captured ? (
                  <Check size={24} strokeWidth={2} />
                ) : (
                  <Upload size={24} strokeWidth={1.5} />
                )}
              </span>
              <strong>
                {captured ? "카카오톡 캡처 1장" : "단톡 캡처를 올려주세요"}
              </strong>
              <span>
                {captured
                  ? "여행 약속 대화를 올렸어요"
                  : "탭해서 갤러리에서 선택"}
              </span>
            </Action>
            {!captured && (
              <div className="upload-example">
                <p>이런 이미지를 올려주세요</p>
                <div>
                  {["카카오톡 약속 대화", "문자 예시", "메모장 캡처"].map(
                    (item) => (
                      <span key={item}>{item}</span>
                    ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {!recognizing && (
        <div className="main-footer">
          <Action
            className="primary-button"
            disabled={!captured}
            onClick={() => setState("recognizing")}
          >
            날짜·장소·인원 찾기
          </Action>
        </div>
      )}
      {state === "recognized" && (
        <RecognitionSheet confirm={confirm} kind="travel" />
      )}
    </div>
  )
}

// U0-3: 2024년 12월. 모든 캘린더처럼 일요일에 시작한다(12월 1일이 일요일).
// 등록한 일정만 막대로 보여준다.
export function ImportedCalendar({
  home,
  schedules,
  added,
}: {
  home: () => void
  schedules: Record<ScheduleKind, boolean>
  // 방금 등록한 일정
  added: ScheduleKind
}) {
  const cells = Array.from({ length: 31 }, (_, index) => String(index + 1))
  return (
    <div className="main-page sub-page">
      <MainHeader title="캘린더" />
      <div className="calendar-toast">
        <Info size={14} strokeWidth={1.7} />
        {added === "exam"
          ? "시험기간 지출은 자동으로 묶어둘게요"
          : "제주 여행 기간 지출은 자동으로 묶어둘게요"}
      </div>
      <div className="month-content">
        <div className="month-heading">
          <Action className="month-arrow">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </Action>
          <strong>2024년 12월</strong>
          <Action className="month-arrow">
            <ChevronRight size={18} strokeWidth={1.5} />
          </Action>
        </div>
        <div className="weekday-row">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="month-grid">
          {cells.map((day) => (
            <span key={day}>{day}</span>
          ))}
          {schedules.exam && (
            <>
              <i className="month-event exam-one">시험기간</i>
              <i className="month-event exam-two" />
            </>
          )}
          {schedules.travel && (
            <i className="month-event travel-one">제주 여행</i>
          )}
        </div>
        <div className="calendar-legend">
          {schedules.exam && (
            <span>
              <i className="exam-color" /> 시험기간 · 12월 9일~20일
            </span>
          )}
          {schedules.travel && (
            <span>
              <i className="travel-color" /> 제주 여행 · 12월 22일~24일
            </span>
          )}
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={home}>
          홈으로
        </Action>
      </div>
    </div>
  )
}
