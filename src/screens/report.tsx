import { ChevronLeft, ChevronRight, TrendingDown, X } from "lucide-react"
import { useState } from "react"
import { Action, cx } from "@/components/common"
import {
  TODAY,
  categoryOf,
  eventsOn,
  label,
  man,
  paymentsOn,
  shareOf,
  weekday,
  won,
  ymd,
  type LedgerState,
  type YMD,
} from "@/lib/ledger"
import {
  addDays,
  monthlyReport,
  nextWeekPreview,
  patternReport,
  weeklyChange,
  weeklyReport,
} from "@/lib/report"
import { reportDemoFacts } from "@/mock/report"

type ReportView = "weekly" | "monthly"

function Columns({ items }: { items: { label: string; dateLabel: string; value: number; today?: boolean }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const top = items.findIndex((item) => item.value === max)
  return (
    <div className="rpt-columns">
      {items.map((item, index) => (
        <div className={cx("rpt-col", item.today && "today")} key={item.label}>
          <em>{item.value > 0 ? man(item.value) : ""}</em>
          <span className="rpt-col-track">
            <i
              className={cx(index === top && item.value > 0 && "top", item.value === 0 && "zero")}
              style={{ height: item.value === 0 ? 2 : Math.max(4, (item.value / max) * 100) + "%" }}
            />
          </span>
          <b>{item.label}</b>
          <small>{item.dateLabel}</small>
        </div>
      ))}
    </div>
  )
}

function ReportSwitch({ value, change }: { value: ReportView; change: (view: ReportView) => void }) {
  return (
    <div aria-label="리포트 보기" className="rpt-switch" role="tablist">
      <button
        aria-selected={value === "weekly"}
        className={cx("rpt-switch-option", value === "weekly" && "active")}
        onClick={() => change("weekly")}
        role="tab"
        type="button"
      >
        주간 보기
      </button>
      <button
        aria-selected={value === "monthly"}
        className={cx("rpt-switch-option", value === "monthly" && "active")}
        onClick={() => change("monthly")}
        role="tab"
        type="button"
      >
        월간 보기
      </button>
    </div>
  )
}

function PeriodNav({
  label: periodLabel,
  previous,
  next,
  nextDisabled,
}: {
  label?: string
  previous: () => void
  next: () => void
  // 오늘이 속한 기간에서는 다음(미래)으로 넘어가지 않는다
  nextDisabled?: boolean
}) {
  return (
    <div className={cx("rpt-period", !periodLabel && "compact")}>
      <button aria-label="이전 기간" className="rpt-period-button" onClick={previous} type="button">
        <ChevronLeft size={16} strokeWidth={1.8} />
      </button>
      {periodLabel && <span>{periodLabel}</span>}
      <button
        aria-label="다음 기간"
        className="rpt-period-button"
        disabled={nextDisabled}
        onClick={next}
        type="button"
      >
        <ChevronRight size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}

function MetricRows({
  rows,
}: {
  // [이름, 값, 클래스, 누르면 이동] — 이동할 곳이 있는 줄만 버튼이 된다
  rows: Array<[string, string | undefined, string?, (() => void)?]>
}) {
  return (
    <dl className="rpt-metrics">
      {rows.map(([name, value, className, onClick]) =>
        onClick && value ? (
          <Action className={cx("rpt-metric-link", className)} key={name} onClick={onClick}>
            <dt>{name}</dt>
            <dd>
              {value}
              <ChevronRight size={15} strokeWidth={1.8} />
            </dd>
          </Action>
        ) : (
          <div className={className} key={name}>
            <dt>{name}</dt>
            <dd>{value || "기록 없음"}</dd>
          </div>
        ),
      )}
    </dl>
  )
}

const moveMonth = (date: YMD, amount: number) => {
  const moved = new Date(date.y, date.m - 1 + amount, 1)
  return ymd(moved.getFullYear(), moved.getMonth() + 1, 1)
}

export function ReportTab({
  state,
  openSettlement,
  openWeekMap,
}: {
  state: LedgerState
  openSettlement: () => void
  // 가장 많이 쓴 곳 → 그 주의 동선 지도
  openWeekMap?: (date: YMD) => void
}) {
  const [view, setView] = useState<ReportView>("weekly")
  const [weekAnchor, setWeekAnchor] = useState<YMD>(TODAY)
  const [monthAnchor, setMonthAnchor] = useState<YMD>(ymd(TODAY.y, TODAY.m, 1))
  const [topDaySheetOpen, setTopDaySheetOpen] = useState(false)
  const [topDaySheetClosing, setTopDaySheetClosing] = useState(false)
  const weekly = weeklyReport(state, weekAnchor)
  // 이번 주에서는 다음(미래) 주로 넘어가지 않는다.
  const thisWeek = weeklyReport(state, TODAY)
  const weeksAgo = Math.round(
    (new Date(thisWeek.from.y, thisWeek.from.m - 1, thisWeek.from.d).getTime() -
      new Date(weekly.from.y, weekly.from.m - 1, weekly.from.d).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  )
  const weekName = weeksAgo === 0 ? "이번 주" : weeksAgo === 1 ? "지난주" : `${weeksAgo}주 전`
  const isThisMonth = monthAnchor.y === TODAY.y && monthAnchor.m === TODAY.m
  const changed = weeklyChange(state, weekAnchor)
  const monthly = monthlyReport(state, monthAnchor)
  const pattern = patternReport(state, monthAnchor)
  const preview = nextWeekPreview(state)
  const previewTo = preview ? addDays(preview.from, 6) : undefined
  const topDay = weekly.daily.reduce((best, day) => (day.value > best.value ? day : best), weekly.daily[0])
  const topDayPayments = paymentsOn(topDay.date)
  const topDayEvents = eventsOn(topDay.date, state)
  const closeTopDaySheet = () => {
    setTopDaySheetClosing(true)
    window.setTimeout(() => {
      setTopDaySheetOpen(false)
      setTopDaySheetClosing(false)
    }, 220)
  }

  return (
    <>
      <div className="main-simple-header rp-head">
        <p>리포트</p>
        <Action className="report-settle-btn" onClick={openSettlement}>
          정산함
        </Action>
      </div>
      <div className="report-scroll">
        <div className={cx("report-zoom", view === "monthly" && "monthly")}>
          <ReportSwitch change={setView} value={view} />

          {view === "weekly" ? (
            <>
              {/* 지난주와 달라진 점: 홈 알림처럼 한 줄 */}
              <section className="rp-note">
                <span className="rp-note-icon">
                  <TrendingDown size={20} strokeWidth={1.7} />
                </span>
                <div>
                  <strong>지난주와 달라진 점</strong>
                  <small>
                    {changed ? `${changed.category} 지출이 ${won(changed.diff)} 줄었어요` : "기록 없음"}
                  </small>
                </div>
              </section>

              {/* 다음 주 예고: 날짜 블록 + 일정 이름·시각 + 내 기록에서 찾은 사실 */}
              <section className="rp-card">
                <div className="rp-card-head">
                  <strong>다음 주 예고</strong>
                  {preview && previewTo && (
                    <span>
                      {label(preview.from)} ~ {label(previewTo)}
                    </span>
                  )}
                </div>
                {preview && preview.events.length > 0 ? (
                  <div className="rp-events">
                    {preview.events.map((event) => (
                      // 2열 격자: [날짜 | 일정] / [ | 링키 말풍선] — 오른쪽 내용은 한 선에서 시작해 카드 끝까지
                      <div className="rp-event" key={`${event.date.y}-${event.date.m}-${event.date.d}-${event.start}`}>
                        <div className="rp-date">
                          <b>{event.date.d}</b>
                          <small>{weekday(event.date)}</small>
                        </div>
                        <div className="rp-event-text">
                          <strong>{event.title}</strong>
                          <small>{event.start}</small>
                        </div>
                        {(event.title.includes("지은") || event.repeatedFact) && (
                          <p className="rp-say">
                              {event.title.includes("지은") ? (
                                <>
                                  지난 지은이랑 약속에선 평균 <b>{won(reportDemoFacts.jieunAppointmentAverage)}</b>을
                                  썼어요
                                </>
                              ) : (
                                event.repeatedFact
                              )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="report-line">다음 주 일정 기록 없음</p>
                )}
              </section>

              <section className="main-card rpt-report-card rp-card">
                <div className="rpt-card-heading">
                  <strong>주간 리포트</strong>
                  <PeriodNav
                    next={() => setWeekAnchor((date) => addDays(date, 7))}
                    nextDisabled={weeksAgo === 0}
                    previous={() => setWeekAnchor((date) => addDays(date, -7))}
                  />
                </div>
                {weekly.count === 0 ? (
                  <p className="report-line">기록 없음</p>
                ) : (
                  <>
                    <div className="rpt-total">
                      <span>{weekName} 지출</span>
                      <b>{won(weekly.total)}</b>
                    </div>
                    <Columns
                      items={weekly.daily.map((day) => ({
                        label: day.weekday,
                        dateLabel: `${day.date.m}/${day.date.d}`,
                        value: day.value,
                        today: day.today,
                      }))}
                    />
                    <MetricRows
                      rows={[
                        ["결제 건수", `${weekly.count}건`],
                        [
                          "가장 많이 쓴 날",
                          `${topDay.weekday}요일 · ${won(topDay.value)}`,
                          undefined,
                          topDay.value > 0 ? () => setTopDaySheetOpen(true) : undefined,
                        ],
                        [
                          "가장 많이 쓴 곳",
                          weekly.places[0] ? `${weekly.places[0][0]} · ${won(weekly.places[0][1])}` : undefined,
                          undefined,
                          openWeekMap && weekly.places[0] ? () => openWeekMap(weekly.from) : undefined,
                        ],
                      ]}
                    />
                  </>
                )}
              </section>

            </>
          ) : (
            <>
              {/* 내 지출 패턴: 파란 인사이트 카드 — 핵심 숫자 + 평일/주말 막대·2열 숫자 + 요일 막대 */}
              <section className="rp-card rpt-pattern-card rpt-insight-card">
                <div className="rp-card-head">
                  <strong>내 지출 패턴</strong>
                  <span>{pattern ? `${pattern.month}월` : `${monthly.month}월`}</span>
                </div>
                {pattern ? (
                  <>
                    <div className="rp-hero">
                      <span>주말 지출 비중</span>
                      <b>{pattern.weekendPercent}%</b>
                    </div>
                    <div className="rp-split" aria-label={`평일 ${100 - pattern.weekendPercent}%, 주말 ${pattern.weekendPercent}%`}>
                      <i style={{ flexGrow: 100 - pattern.weekendPercent }} />
                      <i className="weekend" style={{ flexGrow: pattern.weekendPercent }} />
                    </div>
                    <div className="rp-split-stats">
                      <div>
                        <span>
                          <i /> 평일
                        </span>
                        <b>{100 - pattern.weekendPercent}%</b>
                        <small>하루 평균 {man(pattern.weekdayAverage)}원</small>
                      </div>
                      <div>
                        <span>
                          <i className="weekend" /> 주말
                        </span>
                        <b>{pattern.weekendPercent}%</b>
                        <small>하루 평균 {man(pattern.weekendAverage)}원</small>
                      </div>
                    </div>
                    <div className="rp-weekdays">
                      {(() => {
                        const max = Math.max(...pattern.byWeekday.map((day) => day.value), 1)
                        return pattern.byWeekday.map((day) => (
                          <div className={cx("rp-wd", day.weekday === pattern.topWeekday && "top")} key={day.weekday}>
                            <em>{day.weekday === pattern.topWeekday ? man(day.value) : ""}</em>
                            <span>
                              <i style={{ height: `${Math.max(14, (day.value / max) * 100)}%` }} />
                            </span>
                            <small>{day.weekday}</small>
                          </div>
                        ))
                      })()}
                    </div>
                    <MetricRows
                      rows={[
                        ["가장 많이 쓴 요일", `${pattern.topWeekday}요일`],
                        ["자주 간 장소", `${pattern.place} · ${pattern.placeVisits}번 · 평균 ${won(pattern.placeAverage)}`],
                      ]}
                    />
                  </>
                ) : (
                  <p className="report-line">기록 없음</p>
                )}
              </section>

              <section className="main-card rpt-report-card rpt-month-card rp-card">
                <div className="rpt-card-heading">
                  <strong>월간 리포트</strong>
                  <PeriodNav
                    label={`${monthly.month}월`}
                    next={() => setMonthAnchor((date) => moveMonth(date, 1))}
                    nextDisabled={isThisMonth}
                    previous={() => setMonthAnchor((date) => moveMonth(date, -1))}
                  />
                </div>
                {monthly.count === 0 ? (
                  <p className="report-line">기록 없음</p>
                ) : (
                  <>
                    <div className="rpt-total">
                      <span>실제로 쓴 돈</span>
                      <b>{won(monthly.mine)}</b>
                      <p>결제 총액 {won(monthly.total)} 중 내 지출</p>
                    </div>
                    <MetricRows
                      rows={[
                        ["가장 큰 카테고리", monthly.categories[0] ? `${monthly.categories[0][0]} ${monthly.categories[0][1]}%` : undefined],
                        [
                          "전월과의 차이",
                          monthly.mineChange === undefined
                            ? undefined
                            : `${monthly.mineChange > 0 ? "+" : "-"}${won(Math.abs(monthly.mineChange))}`,
                          monthly.mineChange !== undefined && monthly.mineChange < 0 ? "decreased" : undefined,
                        ],
                      ]}
                    />
                  </>
                )}
              </section>

            </>
          )}
        </div>
      </div>
      {topDaySheetOpen && (
        <div
          className={cx("media-sheet-dim", topDaySheetClosing && "closing")}
          onClick={closeTopDaySheet}
        >
          <section
            aria-label="가장 많이 쓴 날 상세"
            aria-modal="true"
            className="media-sheet rpt-day-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-grip" />
            <header className="rpt-day-sheet-head">
              <div>
                <span>가장 많이 쓴 날</span>
                <strong>
                  {label(topDay.date)} ({weekday(topDay.date)})
                </strong>
              </div>
              <Action className="rpt-day-sheet-close" label="닫기" onClick={closeTopDaySheet}>
                <X size={20} strokeWidth={1.7} />
              </Action>
            </header>
            <div className="rpt-day-sheet-scroll">
              <div className="rpt-day-sheet-total">
                <span>이날 지출</span>
                <b>{won(topDay.value)}</b>
                <small>{topDayPayments.length}건 결제했어요</small>
              </div>
              {topDayEvents.length > 0 && (
                <section className="rpt-day-sheet-section">
                  <strong>일정</strong>
                  {topDayEvents.map((event) => (
                    <p key={event.id}>
                      {event.title} · {event.start}
                    </p>
                  ))}
                </section>
              )}
              <section className="rpt-day-sheet-section">
                <strong>결제 내역</strong>
                <div className="rpt-day-payments">
                  {topDayPayments.map((payment) => (
                    <div key={payment.id}>
                      <time>{payment.time}</time>
                      <p>
                        <b>{payment.restored?.label ?? payment.merchant}</b>
                        <small>
                          {[categoryOf(payment, state), payment.place].filter(Boolean).join(" · ") ||
                            "기록 없음"}
                        </small>
                      </p>
                      <strong>{won(shareOf(payment, state))}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
