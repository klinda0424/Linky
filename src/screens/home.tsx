import {
  Bus,
  ChevronRight,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  Utensils,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { HeaderActions } from "@/components/layout"
import {
  TODAY,
  dayMine,
  keyOf,
  label,
  man,
  paymentsOn,
  payments,
  photosFor,
  photosOn,
  categoryOf,
  eventsFor,
  eventsOn,
  type Photo,
  restoredOf,
  sameDay,
  shareOf,
  stays,
  weekday,
  won,
  ymd,
  type LedgerState,
  type Category,
  type Payment,
  type TransferGuess,
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

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const categoryIcon: Record<Category, typeof Utensils> = {
  "식비·카페": Utensils,
  쇼핑: ShoppingBag,
  "문화·여가": Ticket,
  "생활·기타": Package,
  교통: Bus,
}

// ---------- 오늘 지출: 내역만 보여 준다 (복원·정산 확인은 아래 알림에서) ----------
function TodayRow({
  payment,
  state,
  showDate,
  open,
}: {
  payment: Payment
  state: LedgerState
  showDate?: boolean
  open: (payment: Payment) => void
}) {
  const restored = restoredOf(payment, state)
  const category = categoryOf(payment, state)
  const Icon = category ? categoryIcon[category] : Receipt
  const title = restored
    ? `${restored.label}${restored.spot ? ` · ${restored.spot}` : ""}`
    : payment.kind === "transfer"
      ? `${payment.counterparty} 송금`
      : payment.merchant
  const sub = [
    showDate ? label(payment.date) : undefined,
    payment.time,
    restored ? restored.original : category,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <Action className="hm-today-row" onClick={() => open(payment)}>
      <span className="hm-today-icon">
        <Icon size={18} strokeWidth={1.6} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>
      <b>{won(shareOf(payment, state))}</b>
    </Action>
  )
}

// ---------- 감지 알림 ----------
type Notice = {
  key: string
  icon: typeof Sparkles
  title: string
  sub: string
  // 주의가 필요한 알림(그룹 결제)은 붉은 계열로 보인다
  alert?: boolean
  onClick: () => void
}

function NoticeCard({ notice }: { notice: Notice }) {
  const Icon = notice.icon
  return (
    <Action className={cx("main-card", "hm-notice", notice.alert && "alert")} onClick={notice.onClick}>
      <span className="hm-notice-icon">
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <div>
        <strong>{notice.title}</strong>
        <small>{notice.sub}</small>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </Action>
  )
}

// ---------- 오늘 내 하루: 내 기록만으로 하루를 정리한 사실 서술 ----------
// 이동 경로 → 가장 큰 지출(일정 맥락) → 지난주 같은 요일과 비교 → 이번 주 반복 장소 → 사진 순.
// 의도·감정은 추측하지 않고, 비교는 내 기록끼리만 한다.
const paymentName = (payment: Payment, state: LedgerState) =>
  restoredOf(payment, state)?.label ??
  (payment.kind === "transfer" ? `${payment.counterparty} 송금` : payment.merchant)

function dayStory(day: YMD, list: Payment[], photoCount: number, state: LedgerState) {
  const dayWord = sameDay(day, TODAY) ? "오늘" : "이날"
  const dayEvents = eventsOn(day, state)
  const sentences: string[] = []

  // 1. 이동: 체류 구간과 결제 지역을 시간순으로 이어 지역이 바뀐 순서만 남긴다
  const zones = [
    ...(state.sources.location
      ? stays.filter((stay) => sameDay(stay.date, day)).map((stay) => ({ time: stay.from, zone: stay.zone }))
      : []),
    ...list.map((payment) => ({ time: payment.time, zone: payment.zone })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((item) => item.zone)
    .filter((zone, index, all) => index === 0 || zone !== all[index - 1])
  if (zones.length > 1) {
    sentences.push(`${zones.join(" → ")} 순으로 움직였어요.`)
  } else if (zones.length === 1 && list.length > 1) {
    sentences.push(`결제 ${list.length}건 모두 ${zones[0]}에서 했어요.`)
  } else if (zones.length === 1) {
    sentences.push(`${zones[0]}에 있었어요.`)
  }

  // 2. 가장 큰 지출과 그 시간대의 일정
  if (list.length > 0) {
    const top = list.reduce((best, payment) =>
      shareOf(payment, state) > shareOf(best, state) ? payment : best,
    )
    const event = eventsFor(top, state)[0]
    const context = event ? `'${event.title}' 때 ` : ""
    const what = `${top.time} ${context}${paymentName(top, state)} ${won(shareOf(top, state))}`
    sentences.push(list.length > 1 ? `가장 큰 지출은 ${what}이에요.` : `결제는 ${what} 한 건이에요.`)
  }

  // 결제와 겹치지 않은 일정
  const otherEvents = dayEvents.filter(
    (event) => !list.some((payment) => eventsFor(payment, state).some((item) => item.id === event.id)),
  )
  if (otherEvents.length > 0) {
    sentences.push(`${otherEvents[0].start} '${otherEvents[0].title}' 일정이 있었어요.`)
  }

  // 3. 지난주 같은 요일과 비교 (내 기록끼리)
  if (list.length > 0) {
    const lastWeek = new Date(day.y, day.m - 1, day.d - 7)
    const lastDay = ymd(lastWeek.getFullYear(), lastWeek.getMonth() + 1, lastWeek.getDate())
    const lastList = paymentsOn(lastDay)
    const diff = dayMine(day, state) - dayMine(lastDay, state)
    const lastName = `지난주 ${weekday(day)}요일`
    if (lastList.length === 0) {
      sentences.push(`${lastName}에는 결제 기록이 없어요.`)
    } else if (diff === 0) {
      sentences.push(`${lastName}과 같은 금액을 썼어요.`)
    } else {
      sentences.push(`${lastName}보다 ${won(Math.abs(diff))} ${diff > 0 ? "더" : "적게"} 썼어요.`)
    }
  }

  // 4. 이번 주 반복 장소: 이날 결제가 가장 많은 지역에서 이번 주에 결제한 날 수
  if (list.length > 0) {
    const counts = new Map<string, number>()
    list.forEach((payment) => counts.set(payment.zone, (counts.get(payment.zone) ?? 0) + 1))
    const mainZone = [...counts].sort((a, b) => b[1] - a[1])[0][0]
    const visitedDays = weekOf(day).filter(
      (weekDay) =>
        keyOf(weekDay) <= keyOf(day) && paymentsOn(weekDay).some((payment) => payment.zone === mainZone),
    ).length
    if (visitedDays > 1) {
      sentences.push(`이번 주 ${mainZone}에서 결제한 날은 ${dayWord}까지 ${visitedDays}일이에요.`)
    }
  }

  // 5. 사진
  if (photoCount > 0) sentences.push(`${dayWord} 남긴 사진은 ${photoCount}장이에요.`)

  return sentences.join(" ")
}

// ---------- 오늘의 동선: 체류 구간과 결제 위치를 시간순으로 잇는 미니 지도 ----------
type Stop = { key: string; zone: string; seed: string }

function routeStops(day: YMD, list: Payment[], state: LedgerState): Stop[] {
  if (!state.sources.location) return []
  const steps = [
    ...stays
      .filter((stay) => sameDay(stay.date, day))
      .map((stay) => ({
        id: stay.id,
        time: stay.from,
        zone: stay.zone,
      })),
    ...list.flatMap((payment) =>
      payment.place || payment.transit
        ? [
            {
              id: payment.id,
              time: payment.time,
              zone: payment.zone,
            },
          ]
        : [],
    ),
  ].sort((a, b) => a.time.localeCompare(b.time))
  // 같은 구역이 이어지면 한 지점으로 묶는다
  const stops: Stop[] = []
  for (const step of steps) {
    const last = stops[stops.length - 1]
    if (!last || last.zone !== step.zone) stops.push({ key: step.id, zone: step.zone, seed: step.id })
  }
  return stops
}

function RouteMap({ day, stops, onOpen }: { day: YMD; stops: Stop[]; onOpen: () => void }) {
  // 방문 순서대로 카드 안에 고르게 펼친다 (라벨이 겹치지 않게 위아래로 번갈아 놓는다)
  const points = stops.map((stop, index) => ({
    ...stop,
    x: stops.length === 1 ? 50 : 24 + (index / (stops.length - 1)) * 52,
    y: index % 2 === 0 ? 30 : 46,
  }))
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  return (
    <Action className="hm-route" label={`${label(day)} 동선 지도로 보기`} onClick={onOpen}>
      <span className="hm-route-date">
        {label(day)}
      </span>
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
        {points.length > 1 && <path d={path} />}
      </svg>
      {points.map((p) => (
        <span className="hm-stop" key={p.key} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <i />
          <em>{p.zone}</em>
        </span>
      ))}
    </Action>
  )
}

// ---------- 홈: 이번 주 · 오늘 지출 · 감지 알림 · 오늘의 하루 · 동선 · 사진 ----------
export function HomePage({
  day,
  state,
  openSearch,
  openProfile,
  selectDay,
  openPayment,
  openAlbum,
  openMap,
  openPhoto,
  openSettlement,
  pendingSettlement,
  foundTransfer,
  openTransfer,
}: {
  day: YMD
  state: LedgerState
  openSearch: () => void
  openProfile: () => void
  selectDay: (day: YMD) => void
  openPayment: (payment: Payment) => void
  openAlbum: () => void
  openMap: (day: YMD) => void
  openPhoto: (photo: Photo) => void
  // 정산 알림(필요시): 처리할 정산이 있을 때만 값이 있다
  openSettlement: () => void
  pendingSettlement?: { count: number; total: number }
  // "링키가 찾았어요": 가맹점 없는 송금에서 맥락을 찾았을 때만 값이 있다
  foundTransfer?: { payment: Payment; guess: TransferGuess }
  openTransfer: () => void
}) {
  const week = weekOf(TODAY)
  const selectedList = paymentsOn(day)
  const isToday = sameDay(day, TODAY)
  const recent = isToday && selectedList.length === 0 ? recentPayments(3) : []
  const selectedMine = selectedList.reduce((sum, payment) => sum + shareOf(payment, state), 0)
  const selectedPhotos = photosOn(day, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
  const stops = routeStops(day, selectedList, state)
  const story = dayStory(day, selectedList, selectedPhotos.length, state)
  const linkedPayment = (photo: Photo) =>
    selectedList.find((payment) => photosFor(payment, state).some((item) => item.id === photo.id))
  // 감지된 것만 알림으로 띄운다: 송금 맥락, 그룹 결제 (복원 결과는 알림 없이 캘린더 카드에서 확인)
  // 오늘 받은 알림이라 다른 날짜를 골랐을 때는 보이지 않는다
  const notices: Notice[] = [
    ...(isToday && foundTransfer
      ? [
          {
            key: "found",
            icon: Sparkles,
            title: "링키가 찾았어요",
            sub: `${foundTransfer.payment.counterparty} ${won(foundTransfer.payment.amount)} 송금, ${foundTransfer.guess.place ?? "내"} 기록과 이어져요`,
            onClick: openTransfer,
          },
        ]
      : []),
    ...(isToday && pendingSettlement
      ? [
          {
            key: "settle",
            icon: Users,
            title: "그룹 결제가 감지됐어요",
            sub: `정산할지 확인해주세요 · 정산 대기 ${pendingSettlement.count}건`,
            alert: true,
            onClick: openSettlement,
          },
        ]
      : []),
  ]
  return (
    <>
      <div className="cal-brandbar">
        <div className="brand cal-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
        <HeaderActions openProfile={openProfile} openSearch={openSearch} />
      </div>
      <div className="main-scroll hm-scroll">
        <div className="hm-head">
          <span>
            {label(week[0])} — {label(week[6])}
          </span>
          <div>
            <h2>이번 주</h2>
            <em>
              {label(day)} {weekday(day)}요일
            </em>
          </div>
        </div>
        <div className="main-card hm-week">
          {week.map((weekDay) => {
            const future = keyOf(weekDay) > keyOf(TODAY)
            const total = future ? 0 : dayMine(weekDay, state)
            return (
              <Action
                className={cx("hm-day", sameDay(weekDay, day) && "today")}
                key={keyOf(weekDay)}
                label={`${label(weekDay)} 열기`}
                onClick={() => selectDay(weekDay)}
              >
                <span>{weekNames[new Date(weekDay.y, weekDay.m - 1, weekDay.d).getDay()]}</span>
                <strong>{weekDay.d}</strong>
                <small>{total > 0 ? man(total) : "-"}</small>
              </Action>
            )
          })}
        </div>

        <section className="main-card hm-today">
          <div className="hm-today-top">
            <div>
              <span>{isToday ? "오늘 지출" : `${label(day)} 지출`}</span>
              <strong>
                {selectedList.length > 0
                  ? `${isToday ? "오늘 " : ""}${selectedList.length}건 · ${won(selectedMine)}`
                  : `${isToday ? "오늘 " : ""}결제 기록 없음`}
              </strong>
            </div>
            {isToday && pendingSettlement && (
              <span className="hm-badge">정산 대기 {pendingSettlement.count}건</span>
            )}
          </div>
          <div className="hm-today-list">
            {selectedList.map((payment) => (
              <TodayRow key={payment.id} open={openPayment} payment={payment} state={state} />
            ))}
            {recent.length > 0 && <p className="hm-recent">최근 결제</p>}
            {recent.map((payment) => (
              <TodayRow key={payment.id} open={openPayment} payment={payment} showDate state={state} />
            ))}
          </div>
        </section>

        {notices.map((notice) => (
          <NoticeCard key={notice.key} notice={notice} />
        ))}

        <section className="main-card hm-story">
          <div className="hm-story-head">
            <strong>{isToday ? "오늘 내 하루" : `${label(day)}의 하루`}</strong>
            <span className="hm-linky">
              <Sparkles size={14} strokeWidth={1.6} /> Linky
            </span>
          </div>
          <p>{story ? `“${story}”` : "기록 없음"}</p>
        </section>

        <div className="hm-title-row">
          <h2>{isToday ? "오늘의 동선" : `${label(day)}의 동선`}</h2>
          <Action className="home-more" onClick={() => openMap(day)}>
            지도로 보기
          </Action>
        </div>
        {stops.length === 0 ? (
          <p className="hm-empty">기록 없음</p>
        ) : (
          <RouteMap day={day} onOpen={() => openMap(day)} stops={stops} />
        )}
        <p className="home-sub">결제 당시 내 위치</p>

        <div className="hm-title-row">
          <h2>{isToday ? "오늘의 사진" : `${label(day)}의 사진`}</h2>
          <Action className="home-more" onClick={openAlbum}>
            앨범 보기
          </Action>
        </div>
        {selectedPhotos.length === 0 ? (
          <p className="hm-empty">기록 없음</p>
        ) : (
          <div className="hm-photos">
            {selectedPhotos.map((photo, index) => {
              const paid = linkedPayment(photo)
              return (
                <Action
                  className={cx("photo-thumb", `t${index % 5}`, "hm-photo")}
                  key={photo.id}
                  label={`${photo.title} 사진`}
                  onClick={() => openPhoto(photo)}
                >
                  <span>
                    {paid
                      ? (restoredOf(paid, state)?.label ?? paid.merchant)
                      : `${photo.zone} ${photo.time}`}
                  </span>
                </Action>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
