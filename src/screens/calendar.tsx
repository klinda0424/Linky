import { useEffect, useRef, useState, type TouchEvent } from "react"
import {
  Bus,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Plus,
  Receipt,
  Route,
  Search,
  ShoppingBag,
  Ticket,
  Users,
  Utensils,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  type Category,
  type LedgerState,
  type Payment,
  type YMD,
  TODAY,
  daysWithPayments,
  bigSpendDays,
  dayMine,
  dayTotal,
  eventsOn,
  evidenceOf,
  groupBasis,
  isRestored,
  keyOf,
  label,
  monthCells,
  monthSummary,
  monthsAvailable,
  narrativeLine,
  paymentsOn,
  photos,
  photosOn,
  removedEvidenceOf,
  restoreDaySummary,
  sameDay,
  splitReviewDays,
  weekday,
  won,
  ymd,
} from "@/lib/ledger"

const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

// ---------- 캘린더 (홈) ----------
export function CalendarHome({
  state,
  sheetDay,
  openDay,
  openSearch,
}: {
  state: LedgerState
  sheetDay?: YMD
  openDay: (day: YMD) => void
  openSearch: () => void
}) {
  // 첫 화면은 오늘이 속한 달, 월 이동 화살표로 1~11월을 둘러본다
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      monthsAvailable.findIndex((item) => item.y === TODAY.y && item.m === TODAY.m),
    ),
  )
  const { y, m } = monthsAvailable[index]
  // 지도 핀에서 다른 달의 날짜를 열면 그 달로 이동
  useEffect(() => {
    if (!sheetDay) return
    const found = monthsAvailable.findIndex(
      (item) => item.y === sheetDay.y && item.m === sheetDay.m,
    )
    if (found >= 0) setIndex(found)
  }, [sheetDay])
  const summary = monthSummary(y, m, state)
  // 같은 해 이전 달이 있으면 지난달 복원 일수를 함께 보여 준다
  // 지난달 복원 일수는 일괄 복원 시점 기준이다. 이후 사용자가 직접 추가한 기록(added)은 빼서
  // 10/12 캡처 입력 뒤에도 "지난달 18일"로 유지한다.
  // 색 대신 표시: 지출이 큰 날은 금액을 빨간색으로, 나눔 검토가 필요한 날은 날짜 옆 점으로
  const bigDays = bigSpendDays(y, m, state)
  const reviewDays = splitReviewDays(y, m, state)
  const lastMonth =
    m > 1 ? restoreDaySummary(y, m - 1, { ...state, added: {} }) : undefined
  return (
    <>
      {/* 1줄: 서비스 로고(누르는 요소 아님) / 2줄: 연월 이동 + 검색 */}
      <div className="cal-brandbar">
        <div className="brand cal-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
      </div>
      <div className="cal-top">
        <span />
        <div className="cal-month">
          <Action
            className="cal-arrow"
            disabled={index === 0}
            label="이전 달"
            onClick={() => setIndex(index - 1)}
          >
            <ChevronLeft size={18} strokeWidth={1.6} />
          </Action>
          <strong>
            {y}년 {m}월
          </strong>
          <Action
            className="cal-arrow"
            disabled={index === monthsAvailable.length - 1}
            label="다음 달"
            onClick={() => setIndex(index + 1)}
          >
            <ChevronRight size={18} strokeWidth={1.6} />
          </Action>
        </div>
        <Action className="cal-icon" label="검색" onClick={openSearch}>
          <Search size={20} strokeWidth={1.6} />
        </Action>
      </div>
      <div className="cal-body">
        <div className="cal-summary">
          <div>
            <span>내 지출</span>
            <strong className="cal-summary-main">{won(summary.mine)}</strong>
            <small>결제 총액 {won(summary.total)}</small>
          </div>
          <div>
            <span>복원</span>
            <strong>
              {summary.restoredDays}일 / {summary.paidDays}일
            </strong>
            {lastMonth && <small>지난달 {lastMonth.complete}일</small>}
          </div>
        </div>
        <div className="cal-weekdays">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="cal-grid">
          {monthCells(y, m).map((day, cellIndex) => {
            if (day === null)
              return <span className="cal-cell blank" key={`b${cellIndex}`} />
            const date = ymd(y, m, day)
            // 셀에는 내 지출(확정한 분할만 차감)을 보여 준다
            const mine = dayMine(date, state)
            return (
              <Action
                className={cx(
                  "cal-cell",
                  sameDay(date, TODAY) && "today",
                  sheetDay && sameDay(date, sheetDay) && "picked",
                )}
                key={day}
                label={`${m}월 ${day}일${mine > 0 ? ` 내 지출 ${won(mine)}` : ""}${bigDays.has(day) ? ", 지출이 큰 날" : ""}${reviewDays.has(day) ? ", 나눔 검토 필요" : ""}`}
                onClick={() => openDay(date)}
              >
                <b>
                  {day}
                  {reviewDays.has(day) && <span className="cal-review-dot" />}
                </b>
                {mine > 0 && (
                  <i className={cx(bigDays.has(day) && "big")}>-{mine.toLocaleString("ko-KR")}</i>
                )}
              </Action>
            )
          })}
        </div>
        <div className="cal-legend">
          <span>
            <i className="cal-legend-big">빨간 금액</i> 지출이 큰 날
          </span>
          <span>
            <span className="cal-review-dot" /> 나눔 검토 필요
          </span>
        </div>
      </div>
    </>
  )
}

// ---------- 날짜 바텀시트 ----------
export function DaySheet({
  day,
  state,
  focusPayment,
  close,
  move,
  showMap,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
  relink,
  relinkPhoto,
  unlinkPhoto,
  verify,
}: {
  day: YMD
  state: LedgerState
  // 지도 핀에서 넘어온 결제: 해당 카드를 강조해 보여 준다
  focusPayment?: string
  close: () => void
  move: (day: YMD) => void
  showMap: (day: YMD) => void
  openRecord: (paymentId?: string) => void
  openSplit: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  relink: (paymentId: string, key: string) => void
  relinkPhoto: (photoId: string) => void
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
}) {
  const list = paymentsOn(day)
  const restored = list.filter((payment) => isRestored(payment, state)).length
  const dayEvents = eventsOn(day, state)
  const dayPhotos = photosOn(day, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
  const [activeFocus, setActiveFocus] = useState(focusPayment)
  const scroller = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | undefined>(undefined)
  const keys = daysWithPayments.map(keyOf)
  const at = keys.indexOf(keyOf(day))
  const prev = at > 0 ? daysWithPayments[at - 1] : undefined
  const next = at >= 0 && at < keys.length - 1 ? daysWithPayments[at + 1] : undefined
  // 날짜가 바뀌면 맨 위로, 지도에서 온 결제는 그 카드로 스크롤
  useEffect(() => {
    const box = scroller.current
    if (!box) return
    setActiveFocus(focusPayment)
    const target = focusPayment
      ? box.querySelector<HTMLElement>(`[data-pay="${focusPayment}"]`)
      : null
    const paddingTop = Number.parseFloat(window.getComputedStyle(box).paddingTop) || 0
    box.scrollTop = target
      ? target.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop -
        paddingTop
      : 0
    if (!focusPayment) return
    const timer = window.setTimeout(() => setActiveFocus(undefined), 1500)
    return () => window.clearTimeout(timer)
  }, [day, focusPayment])
  const swipeEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current
    touchStart.current = undefined
    if (!start) return
    const dx = event.changedTouches[0].clientX - start.x
    const dy = event.changedTouches[0].clientY - start.y
    // 가로로 충분히 밀었고 세로 움직임이 작을 때만 날짜 이동
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && next) move(next)
      if (dx > 0 && prev) move(prev)
    }
  }
  return (
    <div className="sheet-dim" onClick={close}>
      <div
        className="day-sheet"
        onClick={(event) => event.stopPropagation()}
        onTouchEnd={swipeEnd}
        onTouchStart={(event) =>
          (touchStart.current = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          })
        }
      >
        <div className="sheet-grip" />
        <div className="day-head">
          <Action
            className="day-arrow"
            disabled={!prev}
            label="이전 날짜"
            onClick={() => prev && move(prev)}
          >
            <ChevronLeft size={19} strokeWidth={1.6} />
          </Action>
          <span>
            {label(day)} {weekday(day)}요일
          </span>
          <Action
            className="day-arrow"
            disabled={!next}
            label="다음 날짜"
            onClick={() => next && move(next)}
          >
            <ChevronRight size={19} strokeWidth={1.6} />
          </Action>
        </div>
        <div className="day-total">
          <strong>{won(dayMine(day, state))}</strong>
          <span>
            {dayMine(day, state) !== dayTotal(day) && `결제 ${won(dayTotal(day))} · `}결제{" "}
            {list.length}건 · 복원 {restored}건
          </span>
        </div>
        <div className="day-chips">
          <Action className="day-chip map" onClick={() => showMap(day)}>
            <Route size={13} strokeWidth={1.8} /> 동선 보기
          </Action>
          {dayEvents.map((event) => (
            <span className="day-chip" key={event.id}>
              <CalendarDays size={13} strokeWidth={1.6} /> {event.title}
            </span>
          ))}
          {dayPhotos.length > 0 && (
            <span className="day-chip">
              <Camera size={13} strokeWidth={1.6} /> 사진 {dayPhotos.length}장
            </span>
          )}
          {dayEvents.length + dayPhotos.length === 0 && (
            <span className="day-chip muted">이날 일정·사진 기록 없음</span>
          )}
        </div>
        <div className="day-scroll" ref={scroller}>
          {list.map((payment) => (
            <PayCard
              focus={activeFocus === payment.id}
              key={payment.id}
              markPersonal={markPersonal}
              openRecord={openRecord}
              openSplit={openSplit}
              payment={payment}
              state={state}
              unlink={unlink}
              relink={relink}
              relinkPhoto={relinkPhoto}
              unlinkPhoto={unlinkPhoto}
              verify={verify}
            />
          ))}
          <DayReport day={day} state={state} />
        </div>
      </div>
    </div>
  )
}

// ---------- 결제 행 ----------
// 한 줄 요약(가맹점·금액, 시각·근거 아이콘) → 누르면 근거 확인·수정이 펼쳐진다
const categoryIcon: Record<Category, typeof Utensils> = {
  "식비·카페": Utensils,
  쇼핑: ShoppingBag,
  "문화·여가": Ticket,
  "생활·기타": Package,
  교통: Bus,
}

function PayCard({
  payment,
  state,
  focus,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
  relink,
  relinkPhoto,
  unlinkPhoto,
  verify,
}: {
  payment: Payment
  state: LedgerState
  focus: boolean
  openRecord: (paymentId?: string) => void
  openSplit: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  relink: (paymentId: string, key: string) => void
  relinkPhoto: (photoId: string) => void
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
}) {
  // 행을 누르면 사진만 펼치고, "수정"을 눌러야 근거 편집이 열린다
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const evidence = evidenceOf(payment, state)
  const people = payment.group
  const confirmed = state.splitConfirmed.includes(payment.id)
  const personal = (state.personal ?? []).includes(payment.id)
  const verified = (state.verified ?? []).includes(payment.id)
  const basis = groupBasis(payment, state)
  const removed = removedEvidenceOf(payment, state)
  const location = evidence.find((item) => item.kind === "location")
  const calendar = evidence.filter((item) => item.kind === "calendar")
  const photo = evidence.find((item) => item.kind === "photo")
  const added = evidence.filter((item) => item.kind === "added")
  const photoIds = photo?.photoIds ?? []
  const Icon = payment.category ? categoryIcon[payment.category] : Receipt
  return (
    <div className={cx("pay-row", focus && "focus", open && "open")} data-pay={payment.id}>
      <Action
        className="pay-main"
        onClick={() => {
          setOpen(!open)
          setEditing(false)
        }}
      >
        <span className="pay-icon">
          <Icon size={17} strokeWidth={1.7} />
        </span>
        <div className="pay-text">
          <div className="pay-title">
            <strong>{payment.merchant}</strong>
            <time>{payment.time}</time>
          </div>
          <span className="pay-meta">
            {location && (
              <span>
                <MapPin size={11} strokeWidth={1.8} />
                {payment.place}
              </span>
            )}
            {calendar.length > 0 && (
              <span>
                <CalendarDays size={11} strokeWidth={1.8} />
                {calendar[0].text.replace("내 일정 · ", "").replace(/ \(.*\)$/, "")}
              </span>
            )}
            {photoIds.length > 0 && (
              <span>
                <Camera size={11} strokeWidth={1.8} />
                {photoIds.length}
              </span>
            )}
            {added.length > 0 && (
              <span>
                <Plus size={11} strokeWidth={1.8} />
                {added[0].text}
              </span>
            )}
            {evidence.length === 0 && <span className="none">기록 없음</span>}
            {verified && (
              <span className="ok">
                <Check size={11} strokeWidth={2.2} />
                확인함
              </span>
            )}
          </span>
        </div>
        <div className="pay-amount">
          {people && confirmed ? (
            <>
              {/* 나눈 결제: 원래 결제 금액은 취소선, 내 몫을 굵게 */}
              <s>{won(payment.amount)}</s>
              <b className="mine">
                <em>내 몫</em>
                {won(Math.round(payment.amount / people.length))}
              </b>
            </>
          ) : (
            <b>{won(payment.amount)}</b>
          )}
          {personal && <small className="muted">개인 지출</small>}
        </div>
      </Action>
      {people && !confirmed && !personal && (
        <div className="pay-suggest">
          <Users size={14} strokeWidth={1.8} />
          <p>
            {basis.source} {basis.count}명 · 그룹 결제 같아요
          </p>
          <Action className="pill primary" onClick={() => openSplit(payment)}>
            맞아요
          </Action>
          <Action className="pill" onClick={() => markPersonal(payment.id)}>
            아니요
          </Action>
        </div>
      )}
      {evidence.length === 0 && !open && (
        <Action className="pill add" onClick={() => openRecord(payment.id)}>
          <Plus size={12} strokeWidth={2} /> 캡처·사진 추가
        </Action>
      )}
      {open && !editing && (
        <div className="pay-photos">
          {photoIds.length > 0 ? (
            <div className="thumbs">
              {photoIds.slice(0, 4).map((id, i) => (
                <i className={`photo-thumb t${i % 5}`} key={id} />
              ))}
              {photoIds.length > 4 && <em>+{photoIds.length - 4}</em>}
            </div>
          ) : (
            <span className="no-photo">사진 기록 없음</span>
          )}
          <Action className="text-btn" onClick={() => setEditing(true)}>
            수정
          </Action>
        </div>
      )}
      {open && editing && (
        <div className="pay-detail">
          {evidence.length === 0 && <p className="detail-note">연결된 근거가 없어요</p>}
          {evidence.map((item) =>
            item.kind === "photo" ? (
              (item.photoIds ?? []).map((id) => {
                const found = photos.find((photo) => photo.id === id)
                return (
                  <div className="detail-row" key={id}>
                    <span>
                      사진 · {found?.title} {found?.time}
                    </span>
                    <Action className="text-btn" onClick={() => unlinkPhoto(id)}>
                      제외
                    </Action>
                  </div>
                )
              })
            ) : (
              <div className="detail-row" key={item.key}>
                <span>{item.text}</span>
                <Action className="text-btn" onClick={() => unlink(payment.id, item.key)}>
                  해제
                </Action>
              </div>
            ),
          )}
          {removed.map((item) => (
            <div className="detail-row removed" key={item.key}>
              <span>{item.text}</span>
              <Action
                className="text-btn"
                onClick={() =>
                  item.photoId ? relinkPhoto(item.photoId) : relink(payment.id, item.key)
                }
              >
                되돌리기
              </Action>
            </div>
          ))}
          <div className="detail-actions">
            {people && confirmed && (
              <Action className="pill" onClick={() => openSplit(payment)}>
                <Users size={12} strokeWidth={2} /> {people.length}명 나눔 보기
              </Action>
            )}
            <Action className="pill" onClick={() => openRecord(payment.id)}>
              <Plus size={12} strokeWidth={2} /> 기록 추가
            </Action>
            <Action
              className="pill primary"
              disabled={verified}
              onClick={() => {
                verify(payment.id)
                setEditing(false)
                setOpen(false)
              }}
            >
              {verified ? "확인했어요" : "맞아요"}
            </Action>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- 하루 리포트 (사실만 나열) ----------
function DayReport({ day, state }: { day: YMD; state: LedgerState }) {
  return (
    <div className="day-report">
      <span>하루 리포트</span>
      <p>{narrativeLine(day, state)}</p>
    </div>
  )
}
