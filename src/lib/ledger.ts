// 지출 + 일정 단일 연결 구조의 목업 데이터와 복원 로직.
// 원칙: AI는 추측하지 않는다. 결제에는 사용자 기록(내 위치·일정·사진)에서 찾은 근거만 붙이고,
// 근거가 없으면 "기록 없음"으로 비워 둔다. 캘린더·지도·앨범·검색이 모두 이 한 곳의 값을 쓴다.

import { historyPayments, verifyHistory, verifySeptember } from "@/mock/history"
import {
  novemberEvents,
  novemberPayments,
  novemberPhotos,
  verifyNovember,
} from "@/mock/november"
import {
  capturedPurchases,
  octoberConfirmedSplitIds,
  octoberEvents,
  octoberPayments,
  octoberPhotos,
  octoberTrail,
  verifyOctober,
} from "@/mock/october"

export type YMD = { y: number; m: number; d: number }
export const ymd = (y: number, m: number, d: number): YMD => ({ y, m, d })
export const keyOf = (v: YMD) => v.y * 10000 + v.m * 100 + v.d
export const sameDay = (a: YMD, b: YMD) => keyOf(a) === keyOf(b)
export const label = (v: YMD) => `${v.m}월 ${v.d}일`
const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"]
export const weekdayOf = (v: YMD) => new Date(v.y, v.m - 1, v.d).getDay()
export const weekday = (v: YMD) => weekdayNames[weekdayOf(v)]

export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`
// 만원 단위, 소수 1자리 (4.5만, 17.4만, 120만). 소수가 0이면 생략한다.
export const man = (amount: number) => `${Math.round(amount / 1000) / 10}만`

// 오늘 (프로토타입 기준일)
export const TODAY = ymd(2026, 10, 31)
// 2026년 1~11월을 월 이동으로 열람한다
export const monthsAvailable = Array.from({ length: 11 }, (_, index) => ({
  y: 2026,
  m: index + 1,
}))

// 일요일 시작 달력 칸 (앞쪽 빈 칸은 null)
export function monthCells(y: number, m: number): Array<number | null> {
  const first = new Date(y, m - 1, 1).getDay()
  const length = new Date(y, m, 0).getDate()
  const cells: Array<number | null> = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// ---------- 지도 좌표 (0~100, 목업 지도 위의 위치) ----------
export type Pt = { x: number; y: number }
export const PLACES: Record<string, Pt> = {
  성수: { x: 74, y: 30 },
  서울숲: { x: 84, y: 24 },
  강남역: { x: 46, y: 78 },
  역삼: { x: 52, y: 85 },
  선릉: { x: 63, y: 76 },
  광화문: { x: 34, y: 20 },
  합정: { x: 14, y: 36 },
  용산: { x: 40, y: 44 },
}
export const zoneNames = Object.keys(PLACES)

// ---------- 데이터 ----------
export type Category = "식비·카페" | "쇼핑" | "문화·여가" | "생활·기타" | "교통"

export type Payment = {
  id: string
  date: YMD
  time: string
  merchant: string
  amount: number
  // 결제 시각의 "내 위치" 기록에서 찾은 장소. 없으면 위치 근거 없음
  place?: string
  // 가맹점이 있는 지역 (지도 핀 위치). 근거가 아니라 가맹점 정보다.
  zone: string
  // 같이 결제한 사람 (그룹 지출)
  group?: string[]
  // 지출 분류 (10월 목업부터. 내 지출 기준 집계)
  category?: Category
}

export type Photo = {
  id: string
  date: YMD
  time: string
  zone: string
  title: string
}

// 결제와 별개로 남은 내 위치 기록 지점 (동선 지도에서 결제 핀 사이를 잇는다)
export type TrailPoint = {
  id: string
  date: YMD
  time: string
  name: string
  zone: string
}

export type CalEvent = {
  id: string
  title: string
  date: YMD
  start: string
  end: string
  zone: string
  people?: string[]
}

const d = (m: number, day: number) => ymd(2026, m, day)

export const events: CalEvent[] = [
  { id: "e1", title: "팀 저녁 약속", date: d(9, 4), start: "19:00", end: "21:00", zone: "선릉" },
  { id: "e2", title: "지은이랑 약속", date: d(9, 5), start: "13:00", end: "18:00", zone: "성수", people: ["지은"] },
  { id: "e3", title: "책 사러 가기", date: d(9, 10), start: "17:30", end: "19:00", zone: "광화문" },
  { id: "e4", title: "영화 보기", date: d(9, 12), start: "15:00", end: "17:30", zone: "용산" },
  { id: "e5", title: "엄마 생신", date: d(9, 19), start: "12:00", end: "15:00", zone: "합정" },
  { id: "e6", title: "수진이 결혼식", date: d(9, 26), start: "13:00", end: "15:00", zone: "합정" },
  ...octoberEvents,
  ...novemberEvents,
]

export const photos: Photo[] = [
  { id: "ph1", date: d(9, 5), time: "13:25", zone: "성수", title: "성수 파스타 하우스" },
  { id: "ph2", date: d(9, 5), time: "15:15", zone: "성수", title: "블루보틀 성수" },
  { id: "ph3", date: d(9, 5), time: "17:45", zone: "성수", title: "대림창고" },
  { id: "ph4", date: d(9, 12), time: "14:50", zone: "용산", title: "CGV 용산" },
  { id: "ph5", date: d(9, 12), time: "17:35", zone: "용산", title: "용산" },
  { id: "ph6", date: d(9, 19), time: "12:45", zone: "합정", title: "한정식 집" },
  { id: "ph7", date: d(9, 19), time: "12:50", zone: "합정", title: "한정식 집" },
  { id: "ph10", date: d(9, 27), time: "15:00", zone: "용산", title: "한강" },
  ...octoberPhotos,
  ...novemberPhotos,
]

export const trailPoints: TrailPoint[] = octoberTrail

const pay = (
  id: string,
  date: YMD,
  time: string,
  merchant: string,
  amount: number,
  zone: string,
  place?: string,
  group?: string[],
): Payment => ({ id, date, time, merchant, amount, zone, place, group })

export const payments: Payment[] = [
  ...historyPayments,
  pay("p1", d(9, 1), "08:15", "스타벅스 강남역점", 5500, "강남역", "강남역"),
  pay("p2", d(9, 1), "12:30", "김밥천국 역삼점", 7000, "역삼", "역삼"),
  pay("p3", d(9, 1), "19:50", "GS25 역삼점", 3200, "역삼"),
  pay("p4", d(9, 2), "12:10", "서브웨이 선릉점", 8900, "선릉", "선릉"),
  pay("p5", d(9, 3), "09:05", "이디야커피 선릉점", 4100, "선릉"),
  pay("p6", d(9, 3), "13:00", "한솥도시락 선릉점", 6500, "선릉"),
  pay("p7", d(9, 4), "19:30", "네네치킨 선릉점", 42000, "선릉", "선릉", ["나", "지은", "민지"]),
  pay("p8", d(9, 5), "13:20", "성수 파스타 하우스", 28000, "성수", "성수", ["나", "지은"]),
  pay("p9", d(9, 5), "15:10", "블루보틀 성수", 9800, "성수", "성수"),
  pay("p10", d(9, 5), "17:40", "대림창고 카페", 7200, "성수", "성수"),
  pay("p11", d(9, 6), "11:20", "올리브영 성수점", 32000, "성수"),
  pay("p12", d(9, 9), "12:20", "구내식당", 5500, "강남역", "강남역"),
  pay("p13", d(9, 10), "18:10", "교보문고 광화문점", 23000, "광화문", "광화문"),
  pay("p14", d(9, 11), "21:30", "배달의민족", 17500, "역삼"),
  pay("p15", d(9, 12), "15:00", "CGV 용산", 15000, "용산", "용산"),
  pay("p16", d(9, 12), "18:10", "용산 파스타", 22000, "용산"),
  pay("p17", d(9, 15), "08:30", "스타벅스 광화문점", 5800, "광화문", "광화문"),
  pay("p18", d(9, 17), "12:15", "샐러디 선릉점", 9500, "선릉"),
  pay("p19", d(9, 17), "14:00", "이디야커피 선릉점", 4200, "선릉"),
  pay("p20", d(9, 19), "12:30", "합정 한정식", 96000, "합정", "합정", ["나", "민지"]),
  pay("p21", d(9, 19), "15:30", "합정 베이커리", 18000, "합정"),
  pay("p22", d(9, 22), "08:10", "스타벅스 강남역점", 5500, "강남역", "강남역"),
  pay("p23", d(9, 22), "20:40", "GS25 강남역점", 3900, "강남역"),
  pay("p24", d(9, 25), "19:00", "롯데리아 선릉점", 7800, "선릉"),
  pay("p25", d(9, 26), "11:50", "올리브영 합정점", 12000, "합정"),
  pay("p26", d(9, 26), "16:20", "카페 합정", 8500, "합정", "합정"),
  pay("p27", d(9, 29), "12:05", "본도시락 선릉점", 6900, "선릉"),
  pay("p28", d(9, 29), "18:45", "스타벅스 선릉점", 6200, "선릉", "선릉"),
  ...octoberPayments,
  ...novemberPayments,
]

// ---------- 사용자가 바꾼 연결 상태 ----------
export type AddedEvidence = { kind: "added"; text: string }
// 연동한 소스: 끈 소스의 기록은 근거로 쓰지 않는다 (마이페이지 > 개인정보·권한에서 개별 해제)
export type Sources = { location: boolean; calendar: boolean; photos: boolean }
export type LedgerState = {
  sources: Sources
  // 결제별로 끊은 근거 (위치 "loc", 일정 "cal:eN", 사진 "photo", 추가 기록 "add:i")
  unlinked: Record<string, string[]>
  // 사진 상세에서 연결을 끊은 사진
  photoUnlinked: string[]
  // 사용자가 직접 붙인 기록 (캡처·사진·링크)
  added: Record<string, AddedEvidence[]>
  // 인원 분할을 확인한 그룹 결제
  splitConfirmed: string[]
  // 그룹 결제 알림에서 "아니요"를 눌러 개인 지출로 둔 결제
  personal?: string[]
  // 결제 카드에서 "맞아요"로 근거를 확인한 결제
  verified?: string[]
}
export const initialLedger: LedgerState = {
  sources: { location: true, calendar: true, photos: true },
  unlinked: {},
  photoUnlinked: [],
  added: {},
  splitConfirmed: [
    "p7",
    "p8",
    "p20",
    ...octoberConfirmedSplitIds(),
  ],
}

// ---------- 근거 계산 ----------
export type Evidence = {
  key: string
  kind: "location" | "calendar" | "photo" | "added"
  text: string
  // 사진 근거일 때 연결된 사진
  photoIds?: string[]
}

export function photosFor(payment: Payment, state: LedgerState) {
  if (!state.sources.photos) return []
  return photos.filter(
    (photo) =>
      sameDay(photo.date, payment.date) &&
      Math.abs(minutes(photo.time) - minutes(payment.time)) <= 30 &&
      !state.photoUnlinked.includes(photo.id),
  )
}

export function eventsFor(payment: Payment, state: LedgerState) {
  if (!state.sources.calendar) return []
  return events.filter(
    (event) =>
      sameDay(event.date, payment.date) &&
      minutes(payment.time) >= minutes(event.start) - 60 &&
      minutes(payment.time) <= minutes(event.end) + 60,
  )
}

export function evidenceOf(payment: Payment, state: LedgerState): Evidence[] {
  const cut = state.unlinked[payment.id] ?? []
  const list: Evidence[] = []
  if (payment.place && state.sources.location)
    list.push({
      key: "loc",
      kind: "location",
      text: `결제 당시 내 위치 · ${payment.place}`,
    })
  for (const event of eventsFor(payment, state))
    list.push({
      key: `cal:${event.id}`,
      kind: "calendar",
      text: `내 일정 · ${event.title} (${event.start}~${event.end})`,
    })
  const near = photosFor(payment, state)
  if (near.length > 0)
    list.push({
      key: "photo",
      kind: "photo",
      text: `${payment.time} ${payment.place ?? payment.zone} · 결제 ±30분 사진 ${near.length}장`,
      photoIds: near.map((photo) => photo.id),
    })
  ;(state.added[payment.id] ?? []).forEach((item, index) =>
    list.push({ key: `add:${index}`, kind: "added", text: item.text }),
  )
  return list.filter((item) => !cut.includes(item.key))
}

export const isRestored = (payment: Payment, state: LedgerState) =>
  evidenceOf(payment, state).length > 0

export const paymentsOn = (date: YMD) =>
  payments
    .filter((payment) => sameDay(payment.date, date))
    .sort((a, b) => minutes(a.time) - minutes(b.time))

export const dayTotal = (date: YMD) =>
  paymentsOn(date).reduce((sum, payment) => sum + payment.amount, 0)

// 내 몫: 인원 분할을 확정한 그룹 결제만 인원수로 나눈다. 확정 전에는 결제 전체가 내 지출이다.
export const shareOf = (payment: Payment, state: LedgerState) =>
  payment.group && state.splitConfirmed.includes(payment.id)
    ? Math.round(payment.amount / payment.group.length)
    : payment.amount

export const dayMine = (date: YMD, state: LedgerState) =>
  paymentsOn(date).reduce((sum, payment) => sum + shareOf(payment, state), 0)

export type DayStatus = "complete" | "partial" | "none" | "empty"
export function dayStatus(date: YMD, state: LedgerState): DayStatus {
  const list = paymentsOn(date)
  if (list.length === 0) return "empty"
  const restored = list.filter((payment) => isRestored(payment, state)).length
  if (restored === list.length) return "complete"
  return restored === 0 ? "none" : "partial"
}

export const eventsOn = (date: YMD, state: LedgerState) =>
  state.sources.calendar
    ? events.filter((event) => sameDay(event.date, date))
    : []

export const photosOn = (date: YMD, state: LedgerState) =>
  state.sources.photos ? photos.filter((photo) => sameDay(photo.date, date)) : []

// 결제가 있는 날
const paidDaysOf = (y: number, m: number) =>
  Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => ymd(y, m, i + 1)).filter(
    (date) => paymentsOn(date).length > 0,
  )

// 월 요약: 결제 총액, 내 지출(확정된 분할만 차감), 복원 완료 일수 / 결제가 있는 일수
export function monthSummary(y: number, m: number, state: LedgerState) {
  const days = paidDaysOf(y, m)
  return {
    total: days.reduce((sum, date) => sum + dayTotal(date), 0),
    mine: days.reduce((sum, date) => sum + dayMine(date, state), 0),
    restoredDays: days.filter((date) => dayStatus(date, state) === "complete")
      .length,
    paidDays: days.length,
  }
}

// 일 기준 복원 집계: 온보딩 "31일 모두 지출이 있었어요. 18일은 내 기록으로 채웠어요"에 쓴다
export function restoreDaySummary(y: number, m: number, state: LedgerState) {
  const days = paidDaysOf(y, m)
  const count = (status: DayStatus) =>
    days.filter((date) => dayStatus(date, state) === status).length
  return {
    paidDays: days.length,
    complete: count("complete"),
    partial: count("partial"),
    none: count("none"),
  }
}

// 결제 캡처 인식 목업: 해당 결제에서 인식되는 구매 품목 (없으면 undefined)
export const recognizedPurchase = (payment: Payment) =>
  capturedPurchases.find(
    (item) =>
      payment.date.m === 10 && payment.date.d === item.day && payment.time === item.time,
  )?.text

// 그룹 결제 알림의 인원 근거: 같은 날 일정에 사람이 적혀 있으면 일정 인원(나 포함), 없으면 결제에 묶인 인원
export function groupBasis(payment: Payment, state: LedgerState) {
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  if (event?.people) return { count: event.people.length + 1, source: "일정 인원", detail: event.title }
  const count = payment.group?.length ?? 1
  return { count, source: "함께 결제한 인원", detail: undefined }
}

// 결제가 있는 날 목록 (바텀시트 좌우 이동용)
export const daysWithPayments = [
  ...new Set(payments.map((payment) => keyOf(payment.date))),
]
  .sort((a, b) => a - b)
  .map((key) => ymd(Math.floor(key / 10000), Math.floor((key % 10000) / 100), key % 100))

// ---------- 하루 리포트 (사실만 나열) ----------
export function dayFacts(date: YMD, state: LedgerState) {
  const list = paymentsOn(date)
  const places = list
    .map((payment) => (state.sources.location ? payment.place : undefined))
    .filter((place): place is string => Boolean(place))
  const counts = places.reduce<Record<string, number>>((acc, place) => {
    acc[place] = (acc[place] ?? 0) + 1
    return acc
  }, {})
  const mainPlace = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const eventTitles = eventsOn(date, state).map((event) => event.title)
  const photoCount = photosOn(date, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  ).length
  return {
    total: dayTotal(date),
    count: list.length,
    restored: list.filter((payment) => isRestored(payment, state)).length,
    mainPlace,
    eventTitles,
    photoCount,
    first: list[0]?.time,
    last: list[list.length - 1]?.time,
    top: [...list].sort((a, b) => b.amount - a.amount).slice(0, 3),
  }
}

export function narrativeLine(date: YMD, state: LedgerState) {
  const facts = dayFacts(date, state)
  const head = `${weekday(date)}요일${facts.mainPlace ? `, ${facts.mainPlace}` : ""}.`
  const parts = [
    ...facts.eventTitles,
    ...(facts.photoCount > 0 ? [`사진 ${facts.photoCount}장`] : []),
    `${man(facts.total)}원`,
  ]
  const hasRecord = facts.eventTitles.length + facts.photoCount > 0 || facts.mainPlace
  return `${head} ${parts.join(", ")}${hasRecord ? "" : " · 연결된 기록 없음"}`
}

// ---------- 지도 ----------
export const photoLinked = (photo: Photo, state: LedgerState) =>
  state.sources.photos &&
  !state.photoUnlinked.includes(photo.id) &&
  payments.some(
    (payment) =>
      sameDay(payment.date, photo.date) &&
      Math.abs(minutes(photo.time) - minutes(payment.time)) <= 30,
  )

// 같은 지역에 핀이 겹치지 않게 아이디로 고정된 작은 위치 차이를 준다
export function pinPoint(zone: string, id: string): Pt {
  const base = PLACES[zone] ?? { x: 50, y: 50 }
  const seed = id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return {
    x: Math.max(6, Math.min(94, base.x + ((seed * 13) % 17) - 8)),
    y: Math.max(6, Math.min(94, base.y + ((seed * 11) % 15) - 7)),
  }
}

// 근거 개수 문구: 근거가 없으면 개수 대신 "기록 없음"
export const evidenceText = (count: number) => (count > 0 ? `근거 ${count}개` : "기록 없음")

// 자주 간 장소: 최근 한 달(오늘 기준 30일) 내 위치 기록이 있는 결제 기준 방문 횟수
export function frequentPlaces(state: LedgerState, limit = 4) {
  const start = new Date(TODAY.y, TODAY.m - 1, TODAY.d - 29)
  const since = keyOf(ymd(start.getFullYear(), start.getMonth() + 1, start.getDate()))
  const counts = payments.reduce<Record<string, number>>((acc, payment) => {
    const at = keyOf(payment.date)
    if (at < since || at > keyOf(TODAY)) return acc
    if (payment.place && state.sources.location)
      acc[payment.place] = (acc[payment.place] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

// ---------- 검색 ----------
export function searchLedger(query: string, state: LedgerState) {
  const words = query
    .split(/[\s,.]+/)
    .map((word) => word.replace(/(에서|에|이랑|랑|를|을|는|은|가|이|의|쓴|돈)$/u, ""))
    .filter((word) => word.length >= 1)
  if (words.length === 0) return []
  return payments.filter((payment) => {
    const evText = [
      payment.merchant,
      state.sources.location ? (payment.place ?? "") : "",
      payment.zone,
      ...eventsFor(payment, state).map((event) => event.title + (event.people ?? []).join(" ")),
      ...(payment.group ?? []),
    ].join(" ")
    return words.every((word) => evText.includes(word))
  })
}

// ---------- 온보딩: 지난달 일괄 복원 결과 ----------
export function restoreSummary(y: number, m: number, state: LedgerState) {
  const month = payments.filter(
    (payment) => payment.date.y === y && payment.date.m === m,
  )
  const kinds = { location: 0, calendar: 0, photo: 0 }
  let restored = 0
  for (const payment of month) {
    const evidence = evidenceOf(payment, state)
    if (evidence.length > 0) restored += 1
    if (evidence.some((item) => item.kind === "location")) kinds.location += 1
    if (evidence.some((item) => item.kind === "calendar")) kinds.calendar += 1
    if (evidence.some((item) => item.kind === "photo")) kinds.photo += 1
  }
  return {
    count: month.length,
    total: month.reduce((sum, payment) => sum + payment.amount, 0),
    restored,
    none: month.length - restored,
    kinds,
  }
}

// 개발 중에만 10월 목업이 명세 합계와 맞는지 확인한다 (어긋나면 콘솔 오류)
if (import.meta.env.DEV) {
  try {
    verifyOctober((day) => dayStatus(ymd(2026, 10, day), initialLedger))
    verifyNovember((day) => dayStatus(ymd(2026, 11, day), initialLedger))
    verifyHistory()
    verifySeptember(monthSummary(2026, 9, initialLedger).total)
  } catch (error) {
    console.error(error)
  }
}
