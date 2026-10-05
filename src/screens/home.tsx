import { ChevronRight, Search } from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  TODAY,
  isRestored,
  keyOf,
  label,
  narrativeLine,
  paymentsOn,
  payments,
  photosOn,
  type Photo,
  restoredOf,
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
        <strong>{restoredOf(payment, state)?.label ?? payment.merchant}</strong>
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
  openPhoto,
  openSettlement,
  pendingSettlement,
}: {
  state: LedgerState
  openSearch: () => void
  openDay: (day: YMD) => void
  openPayment: (payment: Payment) => void
  openAlbum: () => void
  openMap: () => void
  openPhoto: (photo: Photo) => void
  // 정산 알림(필요시): 처리할 정산이 있을 때만 값이 있다
  openSettlement: () => void
  pendingSettlement?: { count: number; total: number }
}) {
  const week = weekOf(TODAY)
  const todayList = paymentsOn(TODAY)
  const recent = todayList.length === 0 ? recentPayments(3) : []
  const todayPhotos = photosOn(TODAY, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
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
        {pendingSettlement && (
          <Action className="main-card settle-alert" onClick={openSettlement}>
            <div>
              <strong>정산할 결제가 있어요</strong>
              <span>
                정산 대기 {pendingSettlement.count}건 · {won(pendingSettlement.total)}
              </span>
            </div>
            <ChevronRight size={17} strokeWidth={1.5} />
          </Action>
        )}
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

        <div className="main-card home-route">
          <div className="block-heading">
            <strong>오늘의 동선 지도</strong>
            <Action className="home-more" onClick={openMap}>
              지도로 보기
            </Action>
          </div>
          <p className="home-sub">결제 당시 내 위치</p>
          {todayList.length === 0 ? (
            <p className="report-line">기록 없음</p>
          ) : (
            <div className="route-chips">
              {todayList.map((payment) => (
                <span key={payment.id}>
                  {payment.time} {state.sources.location && payment.place ? payment.place : "기록 없음"}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="main-card home-photos">
          <div className="block-heading">
            <strong>오늘의 사진</strong>
            <Action className="home-more" onClick={openAlbum}>
              앨범 보기
            </Action>
          </div>
          {todayPhotos.length === 0 ? (
            <p className="report-line">기록 없음</p>
          ) : (
            <div className="thumbs home-thumbs">
              {todayPhotos.slice(0, 4).map((photo, index) => (
                <Action key={photo.id} label={`${photo.title} 사진`} onClick={() => openPhoto(photo)}>
                  <i className={`photo-thumb t${index % 5}`} />
                </Action>
              ))}
              {todayPhotos.length > 4 && <em>+{todayPhotos.length - 4}</em>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
