import { useEffect, useState, type ReactNode } from "react"
import { CalendarDays, Camera, ChevronLeft, ChevronRight, Plus, Route } from "lucide-react"
import { Action, cx } from "@/components/common"
import { HeaderActions } from "@/components/layout"
import {
  type LedgerState,
  type Payment,
  type YMD,
  TODAY,
  bigSpendDays,
  categoryOf,
  daysWithPayments,
  dayMine,
  dayTotal,
  eventsOn,
  evidenceOf,
  groupBasis,
  isRestored,
  label,
  man,
  monthSummary,
  monthsAvailable,
  paymentsOn,
  photos,
  photosOn,
  receivableOf,
  removedEvidenceOf,
  restoredOf,
  sameDay,
  splitReviewDays,
  weekday,
  won,
  ymd,
} from "@/lib/ledger"

const weekdays = ["월", "화", "수", "목", "금", "토", "일"]

// 월요일 시작 달력 칸 (앞쪽 빈 칸은 null)
function mondayCells(y: number, m: number): Array<number | null> {
  const first = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const length = new Date(y, m, 0).getDate()
  const cells: Array<number | null> = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ---------- 캘린더 ----------
// 월 요약 → 달력 → 선택한 날의 지출 카드(detail)가 한 화면에서 이어진다
export function CalendarHome({
  state,
  sheetDay,
  openDay,
  openSearch,
  openProfile,
  detail,
}: {
  state: LedgerState
  sheetDay?: YMD
  openDay: (day: YMD) => void
  openSearch: () => void
  openProfile: () => void
  detail: ReactNode
}) {
  // 첫 화면은 오늘이 속한 달, 월 이동 화살표로 1~11월을 둘러본다
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      monthsAvailable.findIndex((item) => item.y === TODAY.y && item.m === TODAY.m),
    ),
  )
  const { y, m } = monthsAvailable[index]
  const selected = sheetDay ?? TODAY
  // 지도 핀에서 다른 달의 날짜를 열면 그 달로 이동
  useEffect(() => {
    const found = monthsAvailable.findIndex(
      (item) => item.y === selected.y && item.m === selected.m,
    )
    if (found >= 0) setIndex(found)
  }, [selected.y, selected.m])
  // 달을 옮기면 그 달에서 가장 최근에 결제한 날(이번 달은 오늘)을 선택한다
  const goMonth = (next: number) => {
    const target = monthsAvailable[next]
    setIndex(next)
    if (target.y === TODAY.y && target.m === TODAY.m) return openDay(TODAY)
    const paid = daysWithPayments.filter((day) => day.y === target.y && day.m === target.m)
    openDay(paid[paid.length - 1] ?? ymd(target.y, target.m, 1))
  }
  const summary = monthSummary(y, m, state)
  const bigDays = bigSpendDays(y, m, state)
  const reviewDays = splitReviewDays(y, m, state)
  const isThisMonth = y === TODAY.y && m === TODAY.m
  return (
    <>
      <div className="cal2-head">
        <div className="cal2-month">
          <h1>{m}월</h1>
          <Action
            className="cal2-arrow"
            disabled={index === 0}
            label="이전 달"
            onClick={() => goMonth(index - 1)}
          >
            <ChevronLeft size={20} strokeWidth={1.8} />
          </Action>
          <Action
            className="cal2-arrow"
            disabled={index === monthsAvailable.length - 1}
            label="다음 달"
            onClick={() => goMonth(index + 1)}
          >
            <ChevronRight size={20} strokeWidth={1.8} />
          </Action>
        </div>
        <HeaderActions accent openProfile={openProfile} openSearch={openSearch} />
      </div>
      <div className="cal2-scroll">
        {/* 홈과 같은 축척(0.82배)으로 글자·여백 밀도를 맞춘다 */}
        <div className="cal2-zoom">
          <section className="cal2-summary">
            <span>{isThisMonth ? "이번 달 지출" : `${m}월 지출`}</span>
            <strong>{won(summary.mine)}</strong>
          </section>
          {/* 달력 카드: 제목 줄 · 요일 · 날짜 칸 · 범례를 한 카드에 담는다 */}
          <section className="cal2-board">
            <div className="cal2-board-head">
              <strong>{m}월 지출 기록</strong>
              <span>날짜별 내 지출</span>
            </div>
            <div className="cal2-weekdays">
              {weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="cal2-grid">
              {mondayCells(y, m).map((day, cellIndex) => {
                if (day === null) return <span className="cal2-cell blank" key={`b${cellIndex}`} />
                const date = ymd(y, m, day)
                // 셀에는 내 지출(확정한 분할만 차감)을 보여 준다
                const mine = dayMine(date, state)
                const hasEvent = eventsOn(date, state).length > 0
                return (
                  <Action
                    className={cx(
                      "cal2-cell",
                      bigDays.has(day) && "big",
                      sameDay(date, selected) && "picked",
                      sameDay(date, TODAY) && "today",
                    )}
                    key={day}
                    label={`${m}월 ${day}일${mine > 0 ? ` 내 지출 ${won(mine)}` : ""}${bigDays.has(day) ? ", 평소보다 지출 많은 날" : ""}${reviewDays.has(day) ? ", 정산 확인 필요" : ""}`}
                    onClick={() => openDay(date)}
                  >
                    <b>{day}</b>
                    <small>{mine > 0 ? man(mine) : "—"}</small>
                    <span className="cal2-marks">
                      {hasEvent && <i className="cal2-dot" />}
                      {reviewDays.has(day) && <i className="cal2-dot review" />}
                    </span>
                  </Action>
                )
              })}
            </div>
            <div className="cal2-legend">
              <span>
                <i className="cal2-swatch" /> 평소보다 지출 많은 날
              </span>
              <span>
                <i className="cal2-dot" /> 일정
              </span>
              <span>
                <i className="cal2-dot review" /> 정산 확인
              </span>
            </div>
          </section>
          {detail}
        </div>
      </div>
    </>
  )
}

// ---------- 선택한 날의 지출 ----------
export function DayPanel({
  day,
  state,
  focusPayment,
  canReturn,
  back,
  showMap,
  openDetail,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
  relink,
  relinkPhoto,
  unlinkPhoto,
  verify,
  confirmRestore,
  settlementPaymentId,
  openSettlement,
}: {
  day: YMD
  state: LedgerState
  // 지도 핀에서 넘어온 결제: 해당 카드를 강조해 보여 준다
  focusPayment?: string
  // 지도(월)에서 넘어왔을 때만 "지도로 돌아가기"를 보인다
  canReturn: boolean
  back: () => void
  showMap: (day: YMD) => void
  // 지출 카드를 누르면 별도 "지출 내역" 화면으로 간다
  openDetail: (payment: Payment) => void
  openRecord: (paymentId?: string) => void
  openSplit: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  relink: (paymentId: string, key: string) => void
  relinkPhoto: (photoId: string) => void
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
  confirmRestore: (paymentId: string) => void
  // 정산 흐름(그룹 결제 확인~정산표)이 걸린 결제와 그 화면을 여는 함수
  settlementPaymentId?: string
  openSettlement?: () => void
}) {
  const list = paymentsOn(day)
  const restored = list.filter((payment) => isRestored(payment, state)).length
  const dayEvents = eventsOn(day, state)
  const dayPhotos = photosOn(day, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
  const [activeFocus, setActiveFocus] = useState(focusPayment)
  // 지도에서 온 결제는 그 카드로 스크롤해 잠깐 강조한다
  useEffect(() => {
    setActiveFocus(focusPayment)
    if (!focusPayment) return
    document
      .querySelector<HTMLElement>(`[data-pay="${focusPayment}"]`)
      ?.scrollIntoView({ block: "center" })
    const timer = window.setTimeout(() => setActiveFocus(undefined), 1500)
    return () => window.clearTimeout(timer)
  }, [day, focusPayment])
  return (
    <section className="cal2-day">
      <div className="cal2-day-card">
        <div className="cal2-day-head">
          <h2>
            {label(day)} ({weekday(day)})
          </h2>
          <b className="cal2-day-amount">{won(dayMine(day, state))}</b>
        </div>
        {/* 이날의 내 기록: 결제의 근거가 되는 내 일정·사진. 아래 링크로 이날 동선 지도를 연다 */}
        <div className="cal2-records">
          <div className="cal2-records-label">
            <span>이날의 내 기록</span>
            <small>
              {dayMine(day, state) !== dayTotal(day) && `결제 ${won(dayTotal(day))} · `}
              {list.length}건 · 복원 {restored}건
            </small>
          </div>
          <div className="cal2-chips">
            {dayEvents.map((event) => (
              <span className="cal2-chip" key={event.id}>
                <CalendarDays size={14} strokeWidth={1.7} />
                <em>일정</em>
                {event.title} · {event.start}
              </span>
            ))}
            {dayPhotos.length > 0 && (
              <span className="cal2-chip">
                <Camera size={14} strokeWidth={1.7} />
                <em>사진</em>
                {dayPhotos.length}장
              </span>
            )}
            {dayEvents.length + dayPhotos.length === 0 && (
              <span className="cal2-chip muted">일정·사진 기록 없음</span>
            )}
          </div>
          {(list.length > 0 || canReturn) && (
            <div className="cal2-links">
              {list.length > 0 && (
                <Action className="cal2-link" onClick={() => showMap(day)}>
                  <Route size={15} strokeWidth={1.7} /> 이날 동선 지도로 보기
                  <ChevronRight size={15} strokeWidth={1.7} />
                </Action>
              )}
              {canReturn && (
                <Action className="cal2-link" onClick={back}>
                  <ChevronLeft size={15} strokeWidth={1.7} /> 지도로 돌아가기
                </Action>
              )}
            </div>
          )}
        </div>
      </div>
      {/* 시간순 타임라인: 왼쪽 시각·점·세로선(근거가 있으면 채운 점, 없으면 빈 점), 오른쪽 결제 카드 */}
      {list.length > 0 && (
        <ol className="pay-timeline">
          {list.map((payment) => {
            const done = isRestored(payment, state)
            return (
              <li className={cx("pay-tl-item", done && "done")} key={payment.id}>
                <div className="pay-tl-rail">
                  <time>{payment.time}</time>
                  <i className="pay-tl-dot" aria-label={done ? "근거 있음" : "기록 없음"} />
                </div>
                <PayCard
                  focus={activeFocus === payment.id}
                  markPersonal={markPersonal}
                  openDetail={openDetail}
                  openRecord={openRecord}
                  openSplit={openSplit}
                  payment={payment}
                  state={state}
                  unlink={unlink}
                  relink={relink}
                  relinkPhoto={relinkPhoto}
                  unlinkPhoto={unlinkPhoto}
                  verify={verify}
                  confirmRestore={confirmRestore}
                  openSettlement={
                    payment.id === settlementPaymentId ? openSettlement : undefined
                  }
                />
              </li>
            )
          })}
        </ol>
      )}
      {list.length === 0 && <p className="hm-empty">결제 기록 없음</p>}
    </section>
  )
}

// ---------- 지출 카드 ----------
// 원본(작은 글씨) → 복원 결과·가맹점 → 금액 → 점선 → 근거 한 줄 + 맞아요/수정
function PayCard({
  payment,
  state,
  focus,
  openDetail,
  openRecord,
  openSplit,
  markPersonal,
  unlink,
  relink,
  relinkPhoto,
  unlinkPhoto,
  verify,
  confirmRestore,
  openSettlement,
}: {
  payment: Payment
  state: LedgerState
  focus: boolean
  openDetail: (payment: Payment) => void
  openRecord: (paymentId?: string) => void
  openSplit: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  relink: (paymentId: string, key: string) => void
  relinkPhoto: (photoId: string) => void
  unlinkPhoto: (photoId: string) => void
  verify: (paymentId: string) => void
  confirmRestore: (paymentId: string) => void
  openSettlement?: () => void
}) {
  // "수정"을 눌러야 근거 편집이 열린다
  const [editing, setEditing] = useState(false)
  const evidence = evidenceOf(payment, state)
  const restored = restoredOf(payment, state)
  const people = payment.group
  const confirmed = state.splitConfirmed.includes(payment.id)
  const personal = (state.personal ?? []).includes(payment.id)
  const pendingGroup = Boolean(people) && !confirmed && !personal
  const verified = (state.verified ?? []).includes(payment.id) || Boolean(restored?.confirmed)
  const basis = groupBasis(payment, state)
  const removed = removedEvidenceOf(payment, state)
  // 송금: 맞아요로 확정하기 전에는 분류 없는 이체, 확정하면 제안된 분류(식비)로 보인다
  const transfer = payment.kind === "transfer"
  const category = categoryOf(payment, state)
  const asTransfer = transfer && !category
  const photoIds = evidence.find((item) => item.kind === "photo")?.photoIds ?? []
  const share = people ? Math.round(payment.amount / people.length) : payment.amount
  const title = restored
    ? `${restored.label}${restored.spot ? ` · ${restored.spot}` : ""}`
    : transfer
      ? `${payment.counterparty} 송금`
      : payment.merchant
  // 내 위치·일정·사진 근거 줄은 카드에 두지 않는다(수정을 누르면 근거 목록이 열린다).
  // 정산·이체처럼 상태를 알려야 하는 안내만 남긴다.
  const footText = pendingGroup
    ? payment.deposits
      ? `입금 ${payment.deposits.length}건이 들어왔어요`
      : `${basis.source} ${basis.count}명 · 그룹 결제 같아요`
    : asTransfer
      ? "이체 · 가맹점 없음"
      : transfer && category
        ? `${category.split("·")[0]}로 재분류`
        : undefined
  const needsConfirm = pendingGroup || Boolean(restored)
  return (
    <div className={cx("hm-spend", "pay-card", focus && "focus")} data-pay={payment.id}>
      <Action className="hm-spend-main" onClick={() => openDetail(payment)}>
        <div>
          {/* 시각은 타임라인 왼쪽에 있어 카드에는 원본 가맹점명과 상태 칩만 둔다 */}
          {(restored || pendingGroup || personal) && (
            <span className="hm-spend-orig">
              {restored && <span>{restored.original}</span>}
              {pendingGroup && <em className="pay-chip">정산 대기</em>}
              {personal && <em className="pay-tag">개인 지출</em>}
            </span>
          )}
          <strong>{title}</strong>
        </div>
        {photoIds.length > 0 && <i className="photo-thumb t0 hm-spend-thumb" />}
      </Action>
      <div className="pay-price-row">
        <b>
          {pendingGroup ? (
            `총 ${won(payment.amount)}`
          ) : people && confirmed ? (
            <>
              <s>{won(payment.amount)}</s>내 몫 {won(share)}
            </>
          ) : (
            won(payment.amount)
          )}
        </b>
        <div className="hm-spend-actions">
          {/* 맞아요를 누른 뒤에는 수정만 남는다 */}
          {needsConfirm && (pendingGroup || !verified) && (
            <Action
              className="pill primary"
              onClick={() => (pendingGroup ? openSplit(payment) : confirmRestore(payment.id))}
            >
              맞아요
            </Action>
          )}
          {!asTransfer && evidence.length > 0 && (
            <Action className="pill" onClick={() => setEditing(!editing)}>
              수정
            </Action>
          )}
          {!asTransfer && evidence.length === 0 && !transfer && (
            <Action className="pill" onClick={() => openRecord(payment.id)}>
              <Plus size={12} strokeWidth={2} /> 앨범에서 불러오기
            </Action>
          )}
        </div>
      </div>
      {(pendingGroup || footText) && (
        <div className="pay-info">
          {pendingGroup && (
            <dl className="pay-split">
              <div>
                <dt>내 몫 ({people?.length}명 중 1명)</dt>
                <dd>{won(share)}</dd>
              </div>
              <div>
                <dt>받을 돈</dt>
                <dd>{won(receivableOf(payment))}</dd>
              </div>
            </dl>
          )}
          {footText && <p>{footText}</p>}
          {pendingGroup && openSettlement && (
            <Action className="pay-settle-link" onClick={openSettlement}>
              정산하러 가기 <ChevronRight size={14} strokeWidth={1.8} />
            </Action>
          )}
        </div>
      )}
      {editing && (
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
            {pendingGroup && (
              <Action className="pill" onClick={() => markPersonal(payment.id)}>
                개인 지출로 두기
              </Action>
            )}
            {people && confirmed && (
              <Action className="pill" onClick={() => openSplit(payment)}>
                {people.length}명 나눔 보기
              </Action>
            )}
            <Action className="pill" onClick={() => openRecord(payment.id)}>
              <Plus size={12} strokeWidth={2} /> 앨범에서 불러오기
            </Action>
            {!restored && !pendingGroup && (
              <Action
                className="pill primary"
                disabled={verified}
                onClick={() => {
                  verify(payment.id)
                  setEditing(false)
                }}
              >
                {verified ? "확인했어요" : "맞아요"}
              </Action>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
