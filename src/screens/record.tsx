import { useEffect, useState, type ReactNode } from "react"
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
  ScanLine,
  Upload,
  Users,
  Video,
} from "lucide-react"
import {
  Action,
  EditableLine,
  PageTitle,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type RecognizedFields } from "@/types"

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
  openInput: (view: "quick" | "link" | "capture" | "food") => void
  mood: () => void
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
                      ? () => openInput("capture")
                      : item.key === "photo"
                        ? () => openInput("food")
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
            {["😆", "🙂", "😐", "😮‍💨", "😣"].map((item) => (
              <Action className="mood-button" key={item} onClick={mood}>
                {item}
              </Action>
            ))}
          </div>
        </div>
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
export function LinkRecord({ back }: { back: () => void }) {
  const [url, setUrl] = useState("")
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="링크 추가" />
      <div className="sub-content">
        <p className="sub-heading">링크를 붙여 넣어주세요</p>
        <EditableLine placeholder="https://" setValue={setUrl} value={url} />
        <p className="example-label">이런 링크를 가져올 수 있어요</p>
        <div className="suggestion-chips">
          {["학교 학사일정", "공연 예매 페이지"].map((item) => (
            <Action
              className={cx("suggestion-chip", url === item && "selected")}
              key={item}
              onClick={() => setUrl(item)}
            >
              {item}
            </Action>
          ))}
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" disabled={!url} onClick={back}>
          가져오기
        </Action>
      </div>
    </div>
  )
}
export function RecognitionSheet({ confirm }: { confirm: () => void }) {
  const [editing, setEditing] = useState(false)
  const [fields, setFields] = useState<RecognizedFields>({
    title: "기말고사 · 제주도 여행",
    date: "12월 9일~20일 · 12월 22일~24일",
    people: "3명 (나, 수현, 민지)",
    place: "제주도",
  })
  const rows: Array<{
    key: keyof RecognizedFields
    label: string
    icon: ReactNode
  }> = [
    {
      key: "title",
      label: "일정명",
      icon: <FileText size={18} strokeWidth={1.5} />,
    },
    {
      key: "date",
      label: "날짜",
      icon: <CalendarDays size={18} strokeWidth={1.5} />,
    },
    {
      key: "people",
      label: "인원",
      icon: <Users size={18} strokeWidth={1.5} />,
    },
    {
      key: "place",
      label: "장소",
      icon: <MapPin size={18} strokeWidth={1.5} />,
    },
  ]
  return (
    <div className="recognition-overlay">
      <div className="recognition-sheet">
        <div className="sheet-grip" />
        <div className="recognition-title">
          <span>
            <Check size={14} strokeWidth={2.2} />
          </span>
          <p>린이가 인식한 내용이에요</p>
        </div>
        <div className="recognition-rows">
          {rows.map((row) => (
            <div
              className={cx("recognition-row", editing && "editing")}
              key={row.key}
            >
              <span className="recognition-row-icon">{row.icon}</span>
              <div>
                <span>{row.label}</span>
                {editing ? (
                  <div
                    className="recognition-value"
                    contentEditable
                    onInput={(event) =>
                      setFields((current) => ({
                        ...current,
                        [row.key]: event.currentTarget.textContent || "",
                      }))
                    }
                    role="textbox"
                    suppressContentEditableWarning
                  >
                    {fields[row.key]}
                  </div>
                ) : (
                  <strong>{fields[row.key]}</strong>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="ai-confirm-buttons">
          <Action className="secondary-button" onClick={() => setEditing(true)}>
            수정
          </Action>
          <Action className="primary-button" onClick={confirm}>
            맞아요
          </Action>
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
  confirm: () => void
}) {
  const [state, setState] = useState<"idle" | "recognizing" | "recognized">(
    "idle",
  )
  useEffect(() => {
    if (state !== "recognizing") return
    const timer = window.setTimeout(() => setState("recognized"), 1500)
    return () => window.clearTimeout(timer)
  }, [state])
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="캡처 업로드" />
      <div className="capture-content">
        <PageTitle
          sub="카카오톡 대화방, 문자, 메모 어디서든 괜찮아요"
          title={"약속을 캡처해서\n올려주세요"}
        />
        <Action
          className={cx("capture-zone", state !== "idle" && "recognizing")}
          onClick={() => state === "idle" && setState("recognizing")}
        >
          <span className="capture-icon">
            {state === "idle" ? (
              <Upload size={24} strokeWidth={1.5} />
            ) : (
              <Camera size={24} strokeWidth={1.5} />
            )}
          </span>
          <strong>
            {state === "idle"
              ? "사진을 올려주세요"
              : "날짜·장소·인원을 찾는 중"}
          </strong>
          {state === "idle" ? (
            <span>탭해서 갤러리에서 선택</span>
          ) : (
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
          )}
        </Action>
        <div className="upload-example">
          <p>이런 이미지를 올려주세요</p>
          <div>
            {["카카오톡 약속 대화", "문자 예시", "메모장 캡처"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <Action
          className="calendar-import"
          onClick={() => state === "idle" && setState("recognizing")}
        >
          <CalendarDays size={15} strokeWidth={1.5} />
          또는 캘린더에서 가져오기
        </Action>
      </div>
      {state === "recognized" && <RecognitionSheet confirm={confirm} />}
    </div>
  )
}
export function ImportedCalendar({ home }: { home: () => void }) {
  const cells = [
    ...Array.from({ length: 6 }, () => ""),
    ...Array.from({ length: 31 }, (_, index) => String(index + 1)),
  ]
  return (
    <div className="main-page sub-page">
      <MainHeader title="캘린더" />
      <div className="calendar-toast">
        <Info size={14} strokeWidth={1.7} />이 기간 지출은 자동으로 묶어둘게요
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
          {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="month-grid">
          {cells.map((day, index) => (
            <span className={cx(!day && "blank")} key={`${day}-${index}`}>
              {day}
            </span>
          ))}
          <i className="month-event exam-one">시험기간</i>
          <i className="month-event exam-two" />
          <i className="month-event travel-one">제주 여행</i>
          <i className="month-event travel-two" />
        </div>
        <div className="calendar-legend">
          <span>
            <i className="exam-color" /> 시험기간 · 12월 9일~20일
          </span>
          <span>
            <i className="travel-color" /> 제주 여행 · 12월 22일~24일
          </span>
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
