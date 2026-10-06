import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Action, cx } from "@/components/common"
import { TODAY, label, man, won, ymd, type LedgerState, type YMD } from "@/lib/ledger"
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

function Columns({ items }: { items: { label: string; value: number; today?: boolean }[] }) {
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

function PeriodNav({ label: periodLabel, previous, next }: { label?: string; previous: () => void; next: () => void }) {
  return (
    <div className={cx("rpt-period", !periodLabel && "compact")}>
      <button aria-label="이전 기간" className="rpt-period-button" onClick={previous} type="button">
        <ChevronLeft size={16} strokeWidth={1.8} />
      </button>
      {periodLabel && <span>{periodLabel}</span>}
      <button aria-label="다음 기간" className="rpt-period-button" onClick={next} type="button">
        <ChevronRight size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}

function MetricRows({ rows }: { rows: Array<[string, string | undefined, string?]> }) {
  return (
    <dl className="rpt-metrics">
      {rows.map(([name, value, className]) => (
        <div className={className} key={name}>
          <dt>{name}</dt>
          <dd>{value || "기록 없음"}</dd>
        </div>
      ))}
    </dl>
  )
}

const moveMonth = (date: YMD, amount: number) => {
  const moved = new Date(date.y, date.m - 1 + amount, 1)
  return ymd(moved.getFullYear(), moved.getMonth() + 1, 1)
}

export function ReportTab({ state, openSettlement }: { state: LedgerState; openSettlement: () => void }) {
  const [view, setView] = useState<ReportView>("weekly")
  const [weekAnchor, setWeekAnchor] = useState<YMD>(TODAY)
  const [monthAnchor, setMonthAnchor] = useState<YMD>(ymd(TODAY.y, TODAY.m, 1))
  const weekly = weeklyReport(state, weekAnchor)
  const changed = weeklyChange(state, weekAnchor)
  const monthly = monthlyReport(state, monthAnchor)
  const pattern = patternReport(state, monthAnchor)
  const preview = nextWeekPreview(state)
  const topDay = weekly.daily.reduce((best, day) => (day.value > best.value ? day : best), weekly.daily[0])

  return (
    <>
      <div className="main-simple-header rp-head">
        <p>리포트</p>
        <Action className="report-settle-btn" onClick={openSettlement}>
          정산함
        </Action>
      </div>
      <div className="report-scroll">
        <div className="report-zoom">
          <ReportSwitch change={setView} value={view} />

          {view === "weekly" ? (
            <>
              <section className="main-card rpt-change-card rpt-insight-card">
                <strong>지난주와 달라진 점</strong>
                {changed ? (
                  <>
                    <span>{changed.category}</span>
                    <b>-{won(changed.diff)}</b>
                    <p>지난주보다 줄었어요</p>
                  </>
                ) : (
                  <p className="report-line">기록 없음</p>
                )}
              </section>

              <section className="main-card report-preview">
                <div className="block-heading">
                  <strong>다음 주 예고</strong>
                </div>
                {preview ? (
                  <>
                    <div className="rpt-preview-count">
                      <span>일정</span>
                      <b>{preview.events.length}건</b>
                    </div>
                    <div className="rpt-preview-events">
                      {preview.events.map((event) => (
                        <div key={`${event.date.y}-${event.date.m}-${event.date.d}-${event.start}`}>
                          <p>{`${label(event.date)} ${event.start} · ${event.title}`}</p>
                          {event.title.includes("지은") ? (
                            <small>
                              전에 지은이랑 약속에선 평균 {won(reportDemoFacts.jieunAppointmentAverage)} 정도의 지출이 있었어요.
                            </small>
                          ) : event.repeatedFact ? (
                            <small>{event.repeatedFact}</small>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="report-line">기록 없음</p>
                )}
              </section>

              <section className="main-card rpt-report-card">
                <div className="rpt-card-heading">
                  <strong>주간 리포트</strong>
                  <PeriodNav
                    next={() => setWeekAnchor((date) => addDays(date, 7))}
                    previous={() => setWeekAnchor((date) => addDays(date, -7))}
                  />
                </div>
                {weekly.count === 0 ? (
                  <p className="report-line">기록 없음</p>
                ) : (
                  <>
                    <div className="rpt-total">
                      <span>이번 주 지출</span>
                      <b>{won(weekly.total)}</b>
                    </div>
                    <Columns
                      items={weekly.daily.map((day) => ({
                        label: day.weekday,
                        value: day.value,
                        today: day.today,
                      }))}
                    />
                    <MetricRows
                      rows={[
                        ["결제 건수", `${weekly.count}건`],
                        ["가장 많이 쓴 날", `${topDay.weekday}요일 · ${man(topDay.value)}원`],
                        ["가장 많이 쓴 곳", weekly.places[0] ? `${weekly.places[0][0]} · ${man(weekly.places[0][1])}원` : undefined],
                      ]}
                    />
                  </>
                )}
              </section>

            </>
          ) : (
            <>
              <section className="main-card rpt-pattern-card rpt-insight-card">
                <div className="block-heading">
                  <strong>내 지출 패턴</strong>
                  <span>{pattern ? `${pattern.month}월` : `${monthly.month}월`}</span>
                </div>
                {pattern ? (
                  <>
                    <div className="rpt-pattern-main">
                      <span>주말 지출 비중</span>
                      <b>{pattern.weekendPercent}%</b>
                      <p>주말에 지출의 {pattern.weekendPercent}%를 썼어요.</p>
                    </div>
                    <div className="rpt-average-grid">
                      <div>
                        <span>평일 하루 평균</span>
                        <b>{man(pattern.weekdayAverage)}원</b>
                        <small>평일 {100 - pattern.weekendPercent}%</small>
                      </div>
                      <div>
                        <span>주말 하루 평균</span>
                        <b>{man(pattern.weekendAverage)}원</b>
                        <small>주말 {pattern.weekendPercent}%</small>
                      </div>
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

              <section className="main-card rpt-report-card rpt-month-card">
                <div className="rpt-card-heading">
                  <strong>월간 리포트</strong>
                  <PeriodNav
                    label={`${monthly.month}월`}
                    next={() => setMonthAnchor((date) => moveMonth(date, 1))}
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
    </>
  )
}
