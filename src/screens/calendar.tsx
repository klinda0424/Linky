import { useEffect, useRef, useState, type TouchEvent } from "react"
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Route,
  Search,
  Users,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  type LedgerState,
  type Payment,
  type YMD,
  TODAY,
  dayFacts,
  daysWithPayments,
  dayStatus,
  dayTotal,
  eventsOn,
  evidenceOf,
  groupBasis,
  isRestored,
  keyOf,
  label,
  man,
  monthCells,
  monthSummary,
  monthsAvailable,
  narrativeLine,
  paymentsOn,
  photos,
  photosOn,
  restoreDaySummary,
  sameDay,
  weekday,
  won,
  ymd,
} from "@/lib/ledger"
import { type Tone } from "@/types"

const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

// ---------- 캘린더 (홈) ----------
export function CalendarHome({
  state,
  sheetDay,
  openDay,
  openSearch,
  openRecord,
}: {
  state: LedgerState
  sheetDay?: YMD
  openDay: (day: YMD) => void
  openSearch: () => void
  openRecord: () => void
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
  const lastMonth = m > 1 ? restoreDaySummary(y, m - 1, state) : undefined
  return (
    <>
      <div className="cal-top">
        <Action className="cal-icon" label="검색" onClick={openSearch}>
          <Search size={20} strokeWidth={1.6} />
        </Action>
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
        <Action className="cal-add" onClick={openRecord}>
          <Plus size={15} strokeWidth={2} /> 기록
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
            const status = dayStatus(date, state)
            const total = dayTotal(date)
            return (
              <Action
                className={cx(
                  "cal-cell",
                  status,
                  sameDay(date, TODAY) && "today",
                  sheetDay && sameDay(date, sheetDay) && "picked",
                )}
                key={day}
                onClick={() => openDay(date)}
              >
                <b>{day}</b>
                {total > 0 && <i>{man(total)}</i>}
              </Action>
            )
          })}
        </div>
        <div className="cal-legend">
          <span>
            <i className="complete" /> 복원 완료
          </span>
          <span>
            <i className="partial" /> 부분 복원
          </span>
          <span>
            <i className="none" /> 미복원
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
  tone,
  focusPayment,
  close,
  move,
  showMap,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
  unlinkPhoto,
  verify,
}: {
  day: YMD
  state: LedgerState
  tone: Tone
  // 지도 핀에서 넘어온 결제: 해당 카드를 강조해 보여 준다
  focusPayment?: string
  close: () => void
  move: (day: YMD) => void
  showMap: (day: YMD) => void
  openRecord: (paymentId?: string) => void
  openSplit: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
}) {
  const list = paymentsOn(day)
  const restored = list.filter((payment) => isRestored(payment, state)).length
  const dayEvents = eventsOn(day, state)
  const dayPhotos = photosOn(day, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
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
    const target = focusPayment
      ? box.querySelector<HTMLElement>(`[data-pay="${focusPayment}"]`)
      : null
    box.scrollTop = target ? target.offsetTop - 12 : 0
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
          <div>
            <strong>
              {label(day)} ({weekday(day)})
            </strong>
            <span>
              {won(dayTotal(day))} · 복원 {restored}/{list.length}건
            </span>
          </div>
          <Action
            className="day-arrow"
            disabled={!next}
            label="다음 날짜"
            onClick={() => next && move(next)}
          >
            <ChevronRight size={19} strokeWidth={1.6} />
          </Action>
        </div>
        <Action className="route-button" onClick={() => showMap(day)}>
          <Route size={16} strokeWidth={1.6} /> 이날 동선 지도로 보기
        </Action>
        <div className="day-scroll" ref={scroller}>
          <div className="my-records">
            <p>이날의 내 기록</p>
            <div>
              {dayEvents.length + dayPhotos.length === 0 && (
                <span className="record-chip muted">기록 없음</span>
              )}
              {dayEvents.map((event) => (
                <span className="record-chip" key={event.id}>
                  <CalendarDays size={13} strokeWidth={1.6} /> {event.title}
                </span>
              ))}
              {dayPhotos.length > 0 && (
                <span className="record-chip">
                  <Camera size={13} strokeWidth={1.6} /> 사진 {dayPhotos.length}장
                </span>
              )}
            </div>
          </div>
          {list.map((payment) => (
            <PayCard
              focus={focusPayment === payment.id}
              key={payment.id}
              markPersonal={markPersonal}
              openRecord={openRecord}
              openSplit={openSplit}
              payment={payment}
              state={state}
              unlink={unlink}
              unlinkPhoto={unlinkPhoto}
              verify={verify}
            />
          ))}
          <DayReport day={day} state={state} tone={tone} />
        </div>
      </div>
    </div>
  )
}

// ---------- 결제 카드 ----------
function PayCard({
  payment,
  state,
  focus,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
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
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const evidence = evidenceOf(payment, state)
  const people = payment.group
  const confirmed = state.splitConfirmed.includes(payment.id)
  const personal = (state.personal ?? []).includes(payment.id)
  const verified = (state.verified ?? []).includes(payment.id)
  const basis = groupBasis(payment, state)
  const location = evidence.find((item) => item.kind === "location")
  const calendar = evidence.filter((item) => item.kind === "calendar")
  const photo = evidence.find((item) => item.kind === "photo")
  const added = evidence.filter((item) => item.kind === "added")
  const photoIds = photo?.photoIds ?? []
  return (
    <div className={cx("pay-card", focus && "focus")} data-pay={payment.id}>
      <div className="pay-top">
        <time>{payment.time}</time>
        <strong>{payment.merchant}</strong>
        <b>{won(payment.amount)}</b>
        {people && !personal && (
          <Action
            className={cx("group-badge", confirmed && "confirmed")}
            onClick={() => openSplit(payment)}
          >
            <Users size={12} strokeWidth={1.8} />
            {confirmed ? `그룹 · ${people.length}명` : "그룹 지출?"}
          </Action>
        )}
      </div>
      {people && confirmed && (
        <p className="split-line">
          결제 {won(payment.amount)} / 내 몫{" "}
          {won(Math.round(payment.amount / people.length))}
        </p>
      )}
      {people && !confirmed && !personal && (
        <div className="group-notice">
          <p>
            {basis.source} {basis.count}명, 그룹 결제 같아요
          </p>
          <span>
            {basis.detail ? `내 일정 · ${basis.detail}` : "결제에 함께 묶인 인원 기준"}
          </span>
          <div>
            <Action className="mini-primary" onClick={() => openSplit(payment)}>
              맞아요
            </Action>
            <Action className="mini-secondary" onClick={() => markPersonal(payment.id)}>
              아니요
            </Action>
          </div>
        </div>
      )}
      {personal && <p className="split-line">개인 지출로 기록했어요</p>}
      <div className="pay-dotted" />
      {evidence.length === 0 ? (
        <div className="pay-empty">
          <p>기록 없음</p>
          <Action className="mini-secondary" onClick={() => openRecord(payment.id)}>
            캡처·사진 추가
          </Action>
        </div>
      ) : (
        <div className="pay-context">
          {location && (
            <div>
              <MapPin size={14} strokeWidth={1.6} />
              <span>{payment.place}</span>
              <small>결제 당시 내 위치</small>
            </div>
          )}
          {calendar.map((item) => (
            <div key={item.key}>
              <CalendarDays size={14} strokeWidth={1.6} />
              <span>{item.text.replace("내 일정 · ", "")}</span>
              <small>내 일정</small>
            </div>
          ))}
          {photoIds.length > 0 && (
            <div>
              <Camera size={14} strokeWidth={1.6} />
              <span className="thumbs">
                {photoIds.slice(0, 3).map((id, i) => (
                  <i className={`photo-thumb t${i % 5}`} key={id} />
                ))}
                {photoIds.length > 3 && <em>+{photoIds.length - 3}</em>}
              </span>
              <small>사진 {photoIds.length}장</small>
            </div>
          )}
          {added.map((item) => (
            <div key={item.key}>
              <Plus size={14} strokeWidth={1.6} />
              <span>{item.text}</span>
              <small>추가한 기록</small>
            </div>
          ))}
        </div>
      )}
      <div className="pay-foot">
        <Action
          className="evidence-dots"
          disabled={evidence.length === 0}
          onClick={() => setOpen(!open)}
        >
          <span className="dots">
            {[0, 1, 2].map((dot) => (
              <i className={dot < evidence.length ? "on" : ""} key={dot} />
            ))}
          </span>
          근거 {evidence.length}개
        </Action>
        <Action className="edit-link" onClick={() => setEditing(!editing)}>
          {editing ? "완료" : "수정"}
        </Action>
        {verified && !editing && <span className="verified-chip">✓ 확인함</span>}
      </div>
      {open && evidence.length > 0 && (
        <ul className="evidence-list">
          {evidence.map((item) => (
            <li key={item.key}>{item.text}</li>
          ))}
        </ul>
      )}
      {editing && (
        <div className="evidence-editor">
          <p>연결된 기록을 끊거나 새로 붙일 수 있어요</p>
          {evidence.map((item) =>
            item.kind === "photo" ? (
              (item.photoIds ?? []).map((id) => {
                const found = photos.find((photo) => photo.id === id)
                return (
                  <div key={id}>
                    <span>
                      사진 · {found?.title} {found?.time}
                    </span>
                    <Action className="mini-secondary" onClick={() => unlinkPhoto(id)}>
                      제외
                    </Action>
                  </div>
                )
              })
            ) : (
              <div key={item.key}>
                <span>{item.text}</span>
                <Action
                  className="mini-secondary"
                  onClick={() => unlink(payment.id, item.key)}
                >
                  연결 해제
                </Action>
              </div>
            ),
          )}
          <p className="evidence-recount">근거 {evidence.length}개로 다시 계산했어요</p>
          <div className="evidence-actions">
            <Action className="mini-primary" onClick={() => openRecord(payment.id)}>
              기록 추가
            </Action>
            <Action
              className="mini-primary"
              disabled={verified}
              onClick={() => {
                verify(payment.id)
                setEditing(false)
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
function DayReport({
  day,
  state,
  tone,
}: {
  day: YMD
  state: LedgerState
  tone: Tone
}) {
  const facts = dayFacts(day, state)
  const max = Math.max(...facts.top.map((payment) => payment.amount), 1)
  return (
    <div className="day-report">
      <p className="section-title">하루 리포트</p>
      {tone === "narrative" ? (
        <div className="main-card report-line">
          <p>{narrativeLine(day, state)}</p>
        </div>
      ) : (
        <div className="main-card report-numbers">
          <div>
            <span>총 지출</span>
            <strong>{won(facts.total)}</strong>
          </div>
          <div>
            <span>결제</span>
            <strong>
              {facts.count}건 · 복원 {facts.restored}건
            </strong>
          </div>
          <div>
            <span>시간대</span>
            <strong>
              {facts.first}~{facts.last}
            </strong>
          </div>
          <div className="report-bars">
            {facts.top.map((payment) => (
              <div key={payment.id}>
                <span>{payment.merchant}</span>
                <i>
                  <b style={{ width: `${(payment.amount / max) * 100}%` }} />
                </i>
                <strong>{man(payment.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
