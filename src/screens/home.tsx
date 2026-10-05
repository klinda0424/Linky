import { CalendarDays, ChevronRight, Image, Map, Search } from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  TODAY,
  isRestored,
  keyOf,
  label,
  narrativeLine,
  paymentsOn,
  payments,
  sameDay,
  shareOf,
  weekday,
  won,
  ymd,
  type LedgerState,
  type Payment,
  type YMD,
} from "@/lib/ledger"

const weekNames = ["일", "월", "화", "수", "목", "금", "토"]

// 오늘이 속한 일요일 시작 주의 7일
function weekOf(date: YMD): YMD[] {
  const start = new Date(date.y, date.m - 1, date.d - new Date(date.y, date.m - 1, date.d).getDay())
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return ymd(day.getFullYear(), day.getMonth() + 1, day.getDate())
  })
}

// 오늘 이전의 가장 최근 결제 몇 건 (오늘 기록이 없을 때 홈이 비어 보이지 않게 한다)
function recentPayments(limit: number): Payment[] {
  return payments
    .filter((payment) => keyOf(payment.date) < keyOf(TODAY))
    .sort((a, b) => keyOf(b.date) - keyOf(a.date) || b.time.localeCompare(a.time))
    .slice(0, limit)
}

function PaymentRow({
  payment,
  state,
  open,
  showDate,
}: {
  payment: Payment
  state: LedgerState
  open: (payment: Payment) => void
  showDate?: boolean
}) {
  const mine = shareOf(payment, state)
  return (
    <Action className="spending-row clickable" onClick={() => open(payment)}>
      <div>
        <strong>{payment.merchant}</strong>
        <span>
          {showDate ? `${label(payment.date)} ` : ""}
          {payment.time}
          {isRestored(payment, state) ? " · 복원됨" : " · 기록 없음"}
        </span>
      </div>
      <p>
        {mine !== payment.amount && <s>{won(payment.amount)}</s>}
        {won(mine)}
      </p>
      <ChevronRight className="row-chevron" size={15} strokeWidth={1.6} />
    </Action>
  )
}

// ---------- 홈: 이번 주 · 오늘 지출 · 하루 리포트 ----------
export function HomePage({
  state,
  openSearch,
  openDay,
  openPayment,
  openAlbum,
  openMap,
  openCalendar,
}: {
  state: LedgerState
  openSearch: () => void
  openDay: (day: YMD) => void
  openPayment: (payment: Payment) => void
  openAlbum: () => void
  openMap: () => void
  openCalendar: () => void
}) {
  const week = weekOf(TODAY)
  const todayList = paymentsOn(TODAY)
  const recent = todayList.length === 0 ? recentPayments(3) : []
  return (
    <>
      <div className="cal-brandbar">
        <div className="brand cal-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
        <Action className="cal-icon" label="검색" onClick={openSearch}>
          <Search size={20} strokeWidth={1.6} />
        </Action>
      </div>
      <div className="main-scroll">
        <div className="main-card calendar-strip">
          <div className="block-heading">
            <strong>이번 주</strong>
            <span>
              {TODAY.y}년 {TODAY.m}월
            </span>
          </div>
          <div className="week-grid">
            {week.map((day) => (
              <Action
                className={cx("week-day", sameDay(day, TODAY) && "today")}
                key={keyOf(day)}
                label={`${label(day)} 열기`}
                onClick={() => openDay(day)}
              >
                <span>{weekNames[new Date(day.y, day.m - 1, day.d).getDay()]}</span>
                <strong>{day.d}</strong>
                <i className={cx(paymentsOn(day).length > 0 && "has-payment")} />
              </Action>
            ))}
          </div>
        </div>

        <div className="main-card spending-card">
          <div className="spending-top">
            <div>
              <span>오늘 지출</span>
              <p>
                {todayList.length > 0
                  ? `오늘 ${todayList.length}건`
                  : "오늘 결제 기록 없음"}
              </p>
            </div>
          </div>
          <div className="spending-list">
            {todayList.map((payment) => (
              <PaymentRow key={payment.id} open={openPayment} payment={payment} state={state} />
            ))}
            {recent.length > 0 && <p className="home-recent-title">최근 결제</p>}
            {recent.map((payment) => (
              <PaymentRow
                key={payment.id}
                open={openPayment}
                payment={payment}
                showDate
                state={state}
              />
            ))}
          </div>
        </div>

        <div className="main-card home-report">
          <div className="block-heading">
            <strong>하루 리포트</strong>
            <span>
              {label(TODAY)} {weekday(TODAY)}요일
            </span>
          </div>
          <div className="report-quote">
            {todayList.length > 0 ? narrativeLine(TODAY, state) : "기록 없음"}
          </div>
        </div>

        <div className="home-shortcuts">
          <Action className="home-shortcut" onClick={openCalendar}>
            <CalendarDays size={18} strokeWidth={1.5} />
            <span>캘린더</span>
          </Action>
          <Action className="home-shortcut" onClick={openMap}>
            <Map size={18} strokeWidth={1.5} />
            <span>동선 지도</span>
          </Action>
          <Action className="home-shortcut" onClick={openAlbum}>
            <Image size={18} strokeWidth={1.5} />
            <span>앨범</span>
          </Action>
        </div>
      </div>
    </>
  )
}
