import { useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type ArchiveEvent,
  type MoodEntry,
  type YMD,
  archiveEvents,
  archiveMonths,
  archiveNow,
  daysUntil,
  eventSpend,
  eventStatus,
  keyOf,
  label,
  monthCells,
  pastMoods,
  periodLabel,
  sameDay,
  tiredEmojis,
  won,
  ymd,
} from "@/lib/archive"
import { dayTotal, days } from "@/lib/days"
import { type UTMode } from "@/lib/ut"
import { moods, type MoodEmoji } from "@/screens/report"

const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

// 월 달력 공통: 칸 안은 renderCell이 그린다. 달은 단계의 오늘이 있는 달에서 시작한다.
function MonthCalendar({
  now,
  selected,
  select,
  renderCell,
}: {
  now: YMD
  selected?: number
  select: (day: number) => void
  renderCell: (date: YMD, isToday: boolean) => ReactNode
}) {
  const initial = Math.max(
    0,
    archiveMonths.findIndex((item) => item.y === now.y && item.m === now.m),
  )
  const [index, setIndex] = useState(initial)
  const { y, m } = archiveMonths[index]
  return (
    <div className="main-card arc-calendar">
      <div className="arc-month-head">
        <Action
          className="arc-arrow"
          disabled={index === 0}
          label="이전 달"
          onClick={() => setIndex(index - 1)}
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Action>
        <strong>
          {y}년 {m}월
        </strong>
        <Action
          className="arc-arrow"
          disabled={index === archiveMonths.length - 1}
          label="다음 달"
          onClick={() => setIndex(index + 1)}
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
      </div>
      <div className="arc-weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="arc-grid">
        {monthCells(y, m).map((day, cellIndex) =>
          day === null ? (
            <span className="arc-cell blank" key={`blank-${cellIndex}`} />
          ) : (
            <Action
              className={cx(
                "arc-cell",
                sameDay(ymd(y, m, day), now) && "today",
                selected === keyOf(ymd(y, m, day)) && "selected",
              )}
              key={day}
              onClick={() => select(keyOf(ymd(y, m, day)))}
            >
              {renderCell(ymd(y, m, day), sameDay(ymd(y, m, day), now))}
            </Action>
          ),
        )}
      </div>
    </div>
  )
}

const kindLabel = { 시험기간: "시험", 여행: "여행", 약속: "약속" } as const

// ---------- 일정 보관함 ----------
export function ScheduleArchive({
  back,
  mode,
  schedules,
  openCost,
  openStory,
  openSettlement,
}: {
  back: () => void
  mode: UTMode
  // 여행 확정 단계에서는 일정 인식(U0)을 마친 일정만 보인다 (캡처 → 제주 여행, 링크 → 시험기간)
  schedules: { travel: boolean; exam: boolean }
  openCost: () => void
  openStory: () => void
  openSettlement: () => void
}) {
  const now = archiveNow[mode]
  const [selectedKey, setSelectedKey] = useState<number>()
  const [detail, setDetail] = useState<ArchiveEvent["id"]>()
  const events = archiveEvents.filter((event) =>
    mode !== "confirm"
      ? true
      : event.id === "exam"
        ? schedules.exam
        : event.id === "jeju"
          ? schedules.travel
          : false,
  )
  const covers = (event: ArchiveEvent, key: number) =>
    key >= keyOf(event.start) && key <= keyOf(event.end)
  const shown = selectedKey
    ? events.filter((event) => covers(event, selectedKey))
    : events
  const current = events.find((event) => event.id === detail)

  if (current) {
    const status = eventStatus(current, now)
    const spend = eventSpend(current, now)
    const isTrip = current.id === "jeju"
    return (
      <div className="main-page sub-page">
        <MainHeader back={() => setDetail(undefined)} title={current.title} />
        <div className="arc-content">
          <div className={cx("arc-hero", current.color)}>
            <span>
              {kindLabel[current.kind]} · {periodLabel(current)}
            </span>
            <strong>{current.title}</strong>
            <p>{current.memo}</p>
          </div>
          <div className="arc-stats">
            <div>
              <span>묶인 지출</span>
              <strong>{spend.count}건</strong>
            </div>
            <div>
              <span>{isTrip && status === "past" ? "합계" : "지금까지"}</span>
              <strong>{won(spend.total)}</strong>
            </div>
            {isTrip && status === "past" ? (
              <div>
                <span>내 몫</span>
                <strong>{won(Math.round(spend.total / 3))}</strong>
              </div>
            ) : (
              <div>
                <span>상태</span>
                <strong>
                  {status === "upcoming"
                    ? `D-${daysUntil(now, current.start)}`
                    : status === "ongoing"
                      ? "진행 중"
                      : "지남"}
                </strong>
              </div>
            )}
          </div>
          <p className="section-title">이 일정에 묶인 지출</p>
          {spend.rows.length === 0 ? (
            <div className="main-card arc-empty">
              아직 묶인 지출이 없어요. 일정이 시작되면 자동으로 모아둘게요.
            </div>
          ) : (
            <div className="main-card arc-rows">
              {spend.rows.map((row) => (
                <div key={row.title}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.sub}</span>
                  </div>
                  <p>{won(row.amount)}</p>
                </div>
              ))}
            </div>
          )}
          {isTrip && status === "ongoing" && (
            <Action className="secondary-button arc-action" onClick={openSettlement}>
              정산 대기함 보기
            </Action>
          )}
          {isTrip && status === "past" && (
            <div className="arc-actions">
              <Action className="secondary-button" onClick={openCost}>
                여행 비용 리포트
              </Action>
              <Action className="primary-button" onClick={openStory}>
                여행 이야기 보기
              </Action>
            </div>
          )}
        </div>
      </div>
    )
  }

  const group = (title: string, list: ArchiveEvent[]) =>
    list.length > 0 && (
      <>
        {title && <p className="section-title">{title}</p>}
        <div className="arc-list">
          {list.map((event) => {
            const status = eventStatus(event, now)
            const spend = eventSpend(event, now)
            return (
              <Action
                className="main-card arc-event"
                key={event.id}
                onClick={() => setDetail(event.id)}
              >
                <span className={cx("arc-bar", event.color)} />
                <div>
                  <div className="arc-event-title">
                    <strong>{event.title}</strong>
                    <i className={cx("arc-chip", status)}>
                      {status === "upcoming"
                        ? `D-${daysUntil(now, event.start)}`
                        : status === "ongoing"
                          ? "진행 중"
                          : "지남"}
                    </i>
                  </div>
                  <span>
                    {periodLabel(event)} ·{" "}
                    {spend.count > 0
                      ? `지출 ${spend.count}건 ${won(spend.total)}`
                      : "묶인 지출 없음"}
                  </span>
                </div>
                <ChevronRight size={17} strokeWidth={1.5} />
              </Action>
            )
          })}
        </div>
      </>
    )

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="일정 보관함" />
      <div className="arc-content">
        <MonthCalendar
          now={now}
          renderCell={(date) => {
            const key = keyOf(date)
            const hit = events.filter((event) => covers(event, key))
            const band = hit.find((event) => event.id !== "meokjuk")
            return (
              <>
                <b className={cx("arc-day", band?.color)}>{date.d}</b>
                {hit.some((event) => event.id === "meokjuk") && (
                  <i className="arc-dot" />
                )}
              </>
            )
          }}
          select={(key) => setSelectedKey(selectedKey === key ? undefined : key)}
          selected={selectedKey}
        />
        {events.length === 0 ? (
          <div className="main-card arc-empty">
            아직 연결한 일정이 없어요. 홈에서 단톡 캡처로 일정을 등록하면 여기에
            모아둘게요.
          </div>
        ) : selectedKey ? (
          <>
            <p className="section-title">
              {Math.floor((selectedKey % 10000) / 100)}월 {selectedKey % 100}일
              일정
            </p>
            {shown.length === 0 ? (
              <div className="main-card arc-empty">이 날은 연결한 일정이 없어요.</div>
            ) : (
              group("", shown)
            )}
          </>
        ) : (
          <>
            {group(
              "진행 중 · 예정",
              events.filter((event) => eventStatus(event, now) !== "past"),
            )}
            {group(
              "지난 일정",
              events.filter((event) => eventStatus(event, now) === "past"),
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------- 감정 보관함 ----------
export function EmotionArchive({
  back,
  mode,
  mood,
  openMood,
}: {
  back: () => void
  mode: UTMode
  // 오늘 사용자가 고른 기분 (없으면 아직 기록하지 않음)
  mood?: MoodEmoji
  openMood: () => void
}) {
  const now = archiveNow[mode]
  const day = days[mode]
  const moodInfo = moods.find((item) => item.emoji === mood)
  const todayEntry: MoodEntry | undefined = moodInfo
    ? {
        date: now,
        emoji: moodInfo.emoji,
        count: day.expenses.length,
        total: dayTotal(day),
        note: `${moodInfo.context}이에요 · 오늘 결제 ${day.expenses.length}건과 연결했어요`,
      }
    : undefined
  const entries = [
    ...pastMoods.filter((entry) => keyOf(entry.date) < keyOf(now)),
    ...(todayEntry ? [todayEntry] : []),
  ]
  const [selectedKey, setSelectedKey] = useState<number>()
  const byKey = new Map(entries.map((entry) => [keyOf(entry.date), entry]))
  const listed = (
    selectedKey ? entries.filter((entry) => keyOf(entry.date) === selectedKey) : entries
  )
    .slice()
    .sort((a, b) => keyOf(b.date) - keyOf(a.date))

  // 사실만: 지친 날과 그 외 날의 하루 평균 지출
  const tired = entries.filter((entry) => tiredEmojis.includes(entry.emoji))
  const others = entries.filter((entry) => !tiredEmojis.includes(entry.emoji))
  const average = (list: MoodEntry[]) =>
    Math.round(list.reduce((sum, entry) => sum + entry.total, 0) / list.length)

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="감정 보관함" />
      <div className="arc-content">
        <div className="arc-privacy">
          <ShieldCheck size={16} strokeWidth={1.5} />
          <p>감정 기록은 나만 볼 수 있고, 공유되지 않아요.</p>
        </div>
        {mood && moodInfo ? (
          <div className="main-card arc-today">
            <span className="arc-today-emoji">{moodInfo.emoji}</span>
            <div>
              <strong>오늘은 {moodInfo.label}</strong>
              <span>
                {label(now)} · 결제 {day.expenses.length}건과 연결했어요
              </span>
            </div>
          </div>
        ) : (
          <Action className="main-card arc-today" onClick={openMood}>
            <span className="arc-today-emoji">🫥</span>
            <div>
              <strong>오늘 기분을 아직 기록하지 않았어요</strong>
              <span>한 번 눌러 오늘 결제와 연결해요 · 건너뛰어도 괜찮아요</span>
            </div>
            <ChevronRight size={17} strokeWidth={1.5} />
          </Action>
        )}
        <MonthCalendar
          now={now}
          renderCell={(date) => {
            const entry = byKey.get(keyOf(date))
            return (
              <>
                <b className="arc-day">{date.d}</b>
                <span className="arc-emoji">{entry?.emoji ?? ""}</span>
              </>
            )
          }}
          select={(key) =>
            setSelectedKey(selectedKey === key ? undefined : key)
          }
          selected={selectedKey}
        />
        {tired.length > 0 && others.length > 0 ? (
          <div className="main-card arc-insight">
            <strong>기분과 소비의 흐름</strong>
            <p>
              지친 날({tired.length}일)엔 하루 평균 {won(average(tired))}, 그 외
              날({others.length}일)엔 평균 {won(average(others))}을 썼어요.
            </p>
          </div>
        ) : (
          <div className="main-card arc-insight">
            <strong>기분과 소비의 흐름</strong>
            <p>기록이 더 쌓이면 기분과 소비의 흐름을 보여드릴게요.</p>
          </div>
        )}
        <p className="section-title">
          {selectedKey ? "선택한 날의 기록" : "기분 기록"}
        </p>
        {listed.length === 0 ? (
          <div className="main-card arc-empty">
            {selectedKey ? "이 날은 남긴 기분이 없어요." : "아직 남긴 기분이 없어요."}
          </div>
        ) : (
          <div className="main-card arc-rows">
            {listed.map((entry) => (
              <div key={keyOf(entry.date)}>
                <span className="arc-row-emoji">{entry.emoji}</span>
                <div>
                  <strong>
                    {label(entry.date)} ·{" "}
                    {moods.find((item) => item.emoji === entry.emoji)?.label}
                  </strong>
                  <span>{entry.note}</span>
                </div>
                <p>
                  {entry.count}건
                  <small>{won(entry.total)}</small>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
