import { useState } from "react"
import {
  Bus,
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  Utensils,
  X,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { HeaderActions } from "@/components/layout"
import { meeting } from "@/lib/settlement"
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

// 주 이동: 이번 주가 끝, 가장 오래된 결제가 있는 주가 처음
const DAY_MS = 24 * 60 * 60 * 1000
const toDate = (date: YMD) => new Date(date.y, date.m - 1, date.d)
const firstPaymentDay = payments.reduce((first, payment) =>
  keyOf(payment.date) < keyOf(first.date) ? payment : first,
).date

// 이번 주에서 몇 주 전인지 → "이번 주" · "지난주" · "N주 전"
function weekName(weeksAgo: number) {
  if (weeksAgo === 0) return "이번 주"
  if (weeksAgo === 1) return "지난주"
  return `${weeksAgo}주 전`
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

// ---------- 오늘 내 하루: 머문 곳·일정·이동을 시간순으로 이어 쓴 사실 서술 ----------
// 하루를 한 지역에서 보냈으면 "OO에 주로 계셨군요"로 시작한다. 의도·감정은 추측하지 않는다.
const periodOf = (time: string) => {
  const hour = Number(time.split(":")[0])
  return hour < 12 ? "오전" : hour < 17 ? "낮" : hour < 21 ? "저녁" : "밤"
}

// 후불교통은 하루 동안 탄 버스·지하철 요금이 합쳐져 청구된다 (결제 시각은 마지막 승차 무렵).
// 그래서 특정 시각의 이동으로 쓰지 않고 하루 합산 요금으로 따로 적는다.
const isDailyTransit = (payment: Payment) => /후불교통/.test(payment.merchant)

// 결제 한 건을 "무엇을 했는지"로 쓴다. 가맹점명이 반복되는 "결제를 했고"를 피한다.
function paymentStep(payment: Payment, state: LedgerState) {
  const restored = restoredOf(payment, state)
  if (payment.transit) return { text: `${payment.transit.from} 인근에서 택시를`, verb: "탔" }
  if (restored) return { text: `${restored.label}에`, verb: "다녀왔" }
  if (payment.kind === "transfer") return { text: `${payment.counterparty}에게`, verb: "송금했" }
  if (/점$/.test(payment.merchant)) return { text: `${payment.merchant}에`, verb: "들렀" }
  return { text: `${payment.merchant}에서 결제를`, verb: "했" }
}

function dayStory(day: YMD, list: Payment[], photoCount: number, state: LedgerState) {
  const dayWord = sameDay(day, TODAY) ? "오늘" : "이날"
  const dayStays = state.sources.location ? stays.filter((stay) => sameDay(stay.date, day)) : []
  const items = [
    ...dayStays.map((stay) => ({ time: stay.from, text: `${stay.name}에`, verb: "머물렀" })),
    ...eventsOn(day, state).map((event) => ({
      time: event.start,
      text: `'${event.title}' 일정이`,
      verb: "있었",
    })),
    // 일정 시간대에 한 결제는 일정이 이미 설명하므로 따로 적지 않는다
    ...list
      .filter((payment) => !isDailyTransit(payment) && eventsFor(payment, state).length === 0)
      .map((payment) => ({ time: payment.time, ...paymentStep(payment, state) })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4)
  // 일기처럼 "~했다"로 끝낸다. 한 문장에 "~고"는 두 번까지: 세 가지씩 끊어 문장을 나눈다
  let previous = ""
  const sentences: string[] = []
  items.forEach((item, index) => {
    const period = periodOf(item.time)
    const prefix = period !== previous ? `${period}에는 ` : ""
    previous = period
    const last = index === items.length - 1 || index % 3 === 2
    const clause = `${prefix}${item.text} ${item.verb}${last ? "다." : "고,"}`
    if (index % 3 === 0) sentences.push(clause)
    else sentences[sentences.length - 1] += ` ${clause}`
  })
  const transitFare = list
    .filter(isDailyTransit)
    .reduce((sum, payment) => sum + shareOf(payment, state), 0)
  if (transitFare > 0) sentences.push(`대중교통 요금은 하루 합쳐 ${won(transitFare)}이었다.`)
  if (sentences.length === 0) return ""

  // 머문 곳과 결제 지역이 모두 한 곳이면 그 지역을 먼저 말하고, 이번 주에 몇 번째인지 덧붙인다
  const zones = new Set([...dayStays.map((stay) => stay.zone), ...list.map((payment) => payment.zone)])
  let lead = ""
  if (zones.size === 1 && dayStays.length + list.length > 1) {
    const zone = [...zones][0]
    const visitedDays = weekOf(day).filter(
      (weekDay) => keyOf(weekDay) <= keyOf(day) && paymentsOn(weekDay).some((payment) => payment.zone === zone),
    ).length
    lead = `${dayWord}은 ${zone}에서 주로 시간을 보냈다.${visitedDays > 1 ? ` 이번 주 ${zone}에 간 날은 ${visitedDays}일째다.` : ""} `
  }
  const photos = photoCount > 0 ? ` ${dayWord} 남긴 사진은 ${photoCount}장이다.` : ""
  return `${lead}${sentences.join(" ")}${photos}`
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
  // 배너는 닫아도 홈을 다시 열면 다시 보인다 (정산 후보 자체는 그대로 남아 있다)
  const [foundHidden, setFoundHidden] = useState(false)
  // 고른 날이 속한 주를 보여 준다. 화살표로 한 주씩 이동하고, 이번 주보다 뒤로는 가지 않는다
  const week = weekOf(day)
  const weeksAgo = Math.round(
    (toDate(weekOf(TODAY)[0]).getTime() - toDate(week[0]).getTime()) / (7 * DAY_MS),
  )
  const hasPrevWeek = keyOf(week[0]) > keyOf(firstPaymentDay)
  const moveWeek = (offset: number) => {
    const moved = toDate(day)
    moved.setDate(moved.getDate() + offset * 7)
    const next = ymd(moved.getFullYear(), moved.getMonth() + 1, moved.getDate())
    selectDay(keyOf(next) > keyOf(TODAY) ? TODAY : next)
  }
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
  // 송금 맥락은 화면 위에 떠 있는 얇은 배너로, 그룹 결제는 카드로 띄운다
  const foundBanner =
    isToday && foundTransfer
      ? {
          line1: `${foundTransfer.payment.counterparty} ${won(foundTransfer.payment.amount)} 송금`,
          line2: `어제 ${foundTransfer.guess.place ?? "내"} 기록과 이어져요`,
        }
      : undefined
  // 감지된 것만 알림으로 띄운다: 송금 맥락, 그룹 결제 (복원 결과는 알림 없이 캘린더 카드에서 확인)
  // 오늘 받은 알림이라 다른 날짜를 골랐을 때는 보이지 않는다
  const notices: Notice[] = [
    ...(isToday && pendingSettlement
      ? [
          {
            key: "settle",
            icon: Users,
            // 대표 결제가 있으면 "고깃집 12만원, 그룹 지출 같아요"와 입금 근거를 보인다
            title: meeting
              ? `${meeting.merchant} ${man(meeting.amount)}원, 그룹 지출 같아요`
              : "그룹 결제가 감지됐어요",
            sub: meeting?.deposits
              ? `입금 ${meeting.deposits.length}건이 들어왔어요`
              : `정산할지 확인해주세요 · 정산 대기 ${pendingSettlement.count}건`,
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
        {foundBanner && !foundHidden && (
          <div className="hm-found">
            <Action className="hm-found-main" onClick={openTransfer}>
              <span className="hm-found-avatar">L</span>
              <span className="hm-found-text">
                <b>{foundBanner.line1}</b>
                <small>{foundBanner.line2}</small>
              </span>
            </Action>
            <Action className="hm-found-close" label="알림 닫기" onClick={() => setFoundHidden(true)}>
              <X size={18} strokeWidth={1.6} />
            </Action>
          </div>
        )}
        <section className="hm-weekcard">
          <div className="hm-head">
            <div className="hm-week-nav">
              <Action
                className="hm-week-arrow"
                disabled={!hasPrevWeek}
                label="이전 주"
                onClick={() => moveWeek(-1)}
              >
                <ChevronLeft size={20} strokeWidth={1.8} />
              </Action>
              <h2>{weekName(weeksAgo)}</h2>
              {weeksAgo > 0 && (
                <Action className="hm-week-arrow" label="다음 주" onClick={() => moveWeek(1)}>
                  <ChevronRight size={20} strokeWidth={1.8} />
                </Action>
              )}
            </div>
            <em>{week[6].m}월</em>
          </div>
          <div className="hm-week">
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
        </section>

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
          <p>{story || "기록 없음"}</p>
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
