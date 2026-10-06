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
  octoberConfirmedSplitIds,
  octoberEvents,
  octoberPayments,
  octoberPhotos,
  octoberTrail,
} from "@/mock/october"
import {
  scenarioEvents,
  scenarioPayments,
  scenarioPhotos,
  scenarioStays,
  scenarioTrail,
  verifyScenario,
} from "@/mock/scenario"

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
  압구정로데오: { x: 78, y: 56 },
  연남동: { x: 22, y: 30 },
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
  // 송금이면 가맹점 대신 상대가 있다 (기본은 카드 결제)
  kind?: "card" | "transfer"
  // 송금 상대 ("김지은")
  counterparty?: string
  // 복원 결과: 가맹점명 대신 보여줄 장소 (포토이즘 강남역점 · 강남역 11번출구)
  restored?: { label: string; spot?: string }
  // 이동 복원: 체류 구간 밖 결제의 탑승 지점
  transit?: { from: string }
  // 정산 근거가 되는 입금 (그룹 결제를 내가 대표로 결제한 경우)
  deposits?: { from: string; amount: number; time: string }[]
}

export type Photo = {
  id: string
  date: YMD
  time: string
  zone: string
  title: string
  // 사진 내용 인식 문구 ("파스타 · 2인 세팅")
  content?: string
}

// 위치 체류 구간 (진입~이탈). 체류 밖 시각의 결제는 이동 중으로 본다.
export type Stay = {
  id: string
  date: YMD
  zone: string
  name: string
  from: string
  to: string
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
  { id: "e2", title: "지은이랑 약속", date: d(9, 5), start: "13:00", end: "18:00", zone: "서울숲", people: ["지은"] },
  { id: "e3", title: "책 사러 가기", date: d(9, 10), start: "17:30", end: "19:00", zone: "광화문" },
  { id: "e4", title: "영화 보기", date: d(9, 12), start: "15:00", end: "17:30", zone: "용산" },
  { id: "e5", title: "엄마 생신", date: d(9, 19), start: "12:00", end: "15:00", zone: "합정" },
  { id: "e6", title: "수진이 결혼식", date: d(9, 26), start: "13:00", end: "15:00", zone: "합정" },
  ...octoberEvents,
  ...novemberEvents,
  ...scenarioEvents,
]

export const photos: Photo[] = [
  { id: "ph1", date: d(9, 5), time: "13:25", zone: "서울숲", title: "서울숲 파스타 하우스" },
  { id: "ph2", date: d(9, 5), time: "15:15", zone: "서울숲", title: "블루보틀 서울숲" },
  { id: "ph3", date: d(9, 5), time: "17:45", zone: "서울숲", title: "대림창고" },
  { id: "ph4", date: d(9, 12), time: "14:50", zone: "용산", title: "CGV 용산" },
  { id: "ph5", date: d(9, 12), time: "17:35", zone: "용산", title: "용산" },
  { id: "ph6", date: d(9, 19), time: "12:45", zone: "합정", title: "한정식 집" },
  { id: "ph7", date: d(9, 19), time: "12:50", zone: "합정", title: "한정식 집" },
  { id: "ph10", date: d(9, 27), time: "15:00", zone: "용산", title: "한강" },
  ...octoberPhotos,
  ...novemberPhotos,
  ...scenarioPhotos,
]

export const trailPoints: TrailPoint[] = [...octoberTrail, ...scenarioTrail]
export const stays: Stay[] = scenarioStays

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
  pay("p8", d(9, 5), "13:20", "서울숲 파스타 하우스", 28000, "서울숲", "서울숲", ["나", "지은"]),
  pay("p9", d(9, 5), "15:10", "블루보틀 서울숲", 9800, "서울숲", "서울숲"),
  pay("p10", d(9, 5), "17:40", "대림창고 카페", 7200, "서울숲", "서울숲"),
  pay("p11", d(9, 6), "11:20", "올리브영 서울숲점", 32000, "서울숲"),
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
  ...scenarioPayments,
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
  // 복원 결과(장소·이동)를 "맞아요"로 확정한 결제
  restoreConfirmed: string[]
  // 송금 맥락 제안을 "맞아요"로 확정한 송금 (확정 전에는 이체로 둔다)
  transferMatched: string[]
  // 송금 맥락 제안에서 "아니에요"를 눌러 이체로 둔 송금
  transferDeclined?: string[]
}
export const initialLedger: LedgerState = {
  sources: { location: true, calendar: true, photos: true },
  unlinked: {},
  photoUnlinked: [],
  added: {},
  restoreConfirmed: [],
  transferMatched: [],
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

// 송금이 가리키는 모임의 근거(체류·일정·사진). 확정 전에는 제안일 뿐이라 evidenceOf에 쓰지 않는다.
function transferBasis(payment: Payment, state: LedgerState) {
  if (payment.kind !== "transfer") return null
  const at = minutes(payment.time)
  const name = payment.counterparty ?? ""
  const stay = state.sources.location
    ? stays.find(
        (item) =>
          sameDay(item.date, payment.date) &&
          minutes(item.to) <= at &&
          at - minutes(item.to) <= 120,
      )
    : undefined
  const event = eventsFor(payment, state).find((item) =>
    (item.people ?? []).some((person) => name.includes(person)),
  )
  const near = state.sources.photos
    ? photos.filter(
        (photo) =>
          sameDay(photo.date, payment.date) &&
          !state.photoUnlinked.includes(photo.id) &&
          (stay
            ? minutes(photo.time) >= minutes(stay.from) && minutes(photo.time) <= minutes(stay.to)
            : Math.abs(minutes(photo.time) - at) <= 30),
      )
    : []
  return { stay, event, photos: near }
}

export function photosFor(payment: Payment, state: LedgerState) {
  if (!state.sources.photos) return []
  if (payment.kind === "transfer")
    return state.transferMatched.includes(payment.id)
      ? (transferBasis(payment, state)?.photos ?? [])
      : []
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
  const matched = payment.kind !== "transfer" || state.transferMatched.includes(payment.id)
  if (payment.place && state.sources.location)
    list.push({
      key: "loc",
      kind: "location",
      text: `결제 당시 내 위치 · ${payment.place}`,
    })
  if (payment.transit && state.sources.location) {
    const stay = stays.find(
      (item) => sameDay(item.date, payment.date) && minutes(item.to) <= minutes(payment.time),
    )
    list.push({
      key: "loc",
      kind: "location",
      text: stay
        ? `결제 당시 내 위치 · 이동 중 (직전 체류 ${stay.name} ${stay.from}~${stay.to})`
        : "결제 당시 내 위치 · 이동 중",
    })
  }
  // 송금은 맥락을 확정하기 전까지 근거로 삼지 않는다 (제안은 transferGuess가 담당)
  if (!matched) return list.filter((item) => !cut.includes(item.key))
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

// 근거 한 줄: 내 위치 · 일정 · 사진을 짧게 이어 쓴다 (사실만, 없으면 "기록 없음")
export function evidenceLine(list: Evidence[]) {
  if (list.length === 0) return "기록 없음"
  return list
    .map((item) => {
      if (item.kind === "location") return item.text.replace("결제 당시 내 위치 · ", "내 위치 ")
      if (item.kind === "calendar")
        return item.text.replace("내 일정 · ", "일정 ").replace(/ \(.*\)$/, "")
      if (item.kind === "photo") return `사진 ${item.photoIds?.length ?? 0}장`
      return item.text
    })
    .join(" · ")
}

export const isRestored = (payment: Payment, state: LedgerState) =>
  evidenceOf(payment, state).length > 0

// 복원 결과: 원본(가맹점명) → 복원된 장소·탑승 지점. 근거가 하나도 없으면 null("기록 없음").
export type Restored = {
  kind: "place" | "transit"
  original: string
  label: string
  spot?: string
  evidence: Evidence[]
  confirmed: boolean
}
export function restoredOf(payment: Payment, state: LedgerState): Restored | null {
  const evidence = evidenceOf(payment, state)
  if (evidence.length === 0) return null
  const confirmed = state.restoreConfirmed.includes(payment.id)
  if (payment.transit)
    return {
      kind: "transit",
      original: payment.merchant,
      label: `${payment.transit.from} 인근 택시 탑승`,
      evidence,
      confirmed,
    }
  if (payment.restored)
    return {
      kind: "place",
      original: payment.merchant,
      label: stripCorp(payment.restored.label),
      spot: payment.restored.spot,
      evidence,
      confirmed,
    }
  return null
}

// 송금 → 정산 후보: 상대 이름과 맞는 일정·직전 체류·사진 내용을 근거로 "식비" 재분류를 제안한다.
// 근거가 하나도 없으면 null. 원본 금액은 바꾸지 않는다.
export type TransferGuess = {
  paymentId: string
  counterparty: string
  category: Category
  place?: string
  eventTitle?: string
  photoContents: string[]
  evidence: Evidence[]
  confirmed: boolean
}
export function transferGuess(payment: Payment, state: LedgerState): TransferGuess | null {
  const basis = transferBasis(payment, state)
  if (!basis) return null
  const evidence: Evidence[] = []
  if (basis.stay)
    evidence.push({
      key: "loc",
      kind: "location",
      text: `내 위치 · ${basis.stay.name} 체류 ${basis.stay.from}~${basis.stay.to}`,
    })
  if (basis.event)
    evidence.push({
      key: `cal:${basis.event.id}`,
      kind: "calendar",
      text: `내 일정 · ${basis.event.title} (${basis.event.start}~${basis.event.end})`,
    })
  if (basis.photos.length > 0)
    evidence.push({
      key: "photo",
      kind: "photo",
      text: `그날 사진 ${basis.photos.length}장 · ${basis.photos
        .map((photo) => photo.content ?? photo.title)
        .join(", ")}`,
      photoIds: basis.photos.map((photo) => photo.id),
    })
  if (evidence.length === 0) return null
  return {
    paymentId: payment.id,
    counterparty: payment.counterparty ?? "",
    category: "식비·카페",
    place: basis.stay?.name,
    eventTitle: basis.event?.title,
    photoContents: basis.photos.flatMap((photo) => (photo.content ? [photo.content] : [])),
    evidence,
    confirmed: state.transferMatched.includes(payment.id),
  }
}

// 분류: 송금은 맞아요로 확정하기 전까지 분류가 없다(이체). 확정하면 제안된 분류를 쓴다.
export const categoryOf = (payment: Payment, state: LedgerState): Category | undefined =>
  payment.kind === "transfer"
    ? state.transferMatched.includes(payment.id)
      ? transferGuess(payment, state)?.category
      : undefined
    : payment.category

// 대표 결제에서 돌려받을 돈: 총액에서 내 몫(인원 균등)을 뺀 값
export const receivableOf = (payment: Payment) =>
  payment.group ? payment.amount - Math.round(payment.amount / payment.group.length) : 0

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

// 사용자가 끊은 근거 목록: 결제 카드에서 되돌릴 수 있게 한다
export type RemovedEvidence = { key: string; text: string; photoId?: string }
export function removedEvidenceOf(payment: Payment, state: LedgerState): RemovedEvidence[] {
  const items: RemovedEvidence[] = []
  for (const key of state.unlinked[payment.id] ?? []) {
    if (key === "loc" && payment.place)
      items.push({ key, text: `결제 당시 내 위치 · ${payment.place}` })
    else if (key.startsWith("cal:")) {
      const event = events.find((item) => `cal:${item.id}` === key)
      if (event) items.push({ key, text: `내 일정 · ${event.title}` })
    } else if (key.startsWith("add:")) {
      const added = state.added[payment.id]?.[Number(key.slice(4))]
      if (added) items.push({ key, text: added.text })
    }
  }
  if (state.sources.photos)
    for (const photo of photos)
      if (
        sameDay(photo.date, payment.date) &&
        Math.abs(minutes(photo.time) - minutes(payment.time)) <= 30 &&
        state.photoUnlinked.includes(photo.id)
      )
        items.push({ key: `photo:${photo.id}`, text: `사진 · ${photo.title} ${photo.time}`, photoId: photo.id })
  return items
}

// 그룹 결제 알림의 인원 근거: 같은 날 일정에 사람이 적혀 있으면 일정 인원(나 포함), 없으면 결제에 묶인 인원
export function groupBasis(payment: Payment, state: LedgerState) {
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  if (event?.people) return { count: event.people.length + 1, source: "일정 인원", detail: event.title }
  const count = payment.group?.length ?? 1
  return { count, source: "함께 결제한 인원", detail: undefined }
}

// 지출이 큰 날: 한 달에서 내 지출이 큰 상위 3일 (동률 포함)
export function bigSpendDays(y: number, m: number, state: LedgerState, limit = 3) {
  const totals = paidDaysOf(y, m)
    .map((date) => ({ day: date.d, mine: dayMine(date, state) }))
    .filter((item) => item.mine > 0)
    .sort((a, b) => b.mine - a.mine)
  const cutoff = totals[Math.min(limit, totals.length) - 1]?.mine ?? Infinity
  return new Set(totals.filter((item) => item.mine >= cutoff).map((item) => item.day))
}

// 나눔 검토가 필요한 날: 그룹 결제로 보이지만 아직 분할을 확정하지도, 개인 지출로 두지도 않은 결제가 있는 날
export function splitReviewDays(y: number, m: number, state: LedgerState) {
  return new Set(
    paidDaysOf(y, m)
      .filter((date) =>
        paymentsOn(date).some(
          (payment) =>
            payment.group &&
            !state.splitConfirmed.includes(payment.id) &&
            !(state.personal ?? []).includes(payment.id),
        ),
      )
      .map((date) => date.d),
  )
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
    // 내 지출: 확정한 분할만 차감한 값
    mine: dayMine(date, state),
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
  // 일정 제목에 이미 장소가 들어 있으면 장소를 다시 쓰지 않는다
  const placeInTitle =
    facts.mainPlace !== undefined &&
    facts.eventTitles.some((title) => title.includes(facts.mainPlace ?? ""))
  const head = `${weekday(date)}요일${facts.mainPlace && !placeInTitle ? `, ${facts.mainPlace}` : ""}.`
  // 분할을 확정했으면 내 지출을 앞에 두고 결제 총액을 괄호로 덧붙인다
  const spent =
    facts.mine !== facts.total
      ? `내 지출 ${man(facts.mine)}원 (결제 ${man(facts.total)}원)`
      : `${man(facts.total)}원`
  const parts = [
    ...facts.eventTitles,
    ...(facts.photoCount > 0 ? [`사진 ${facts.photoCount}장`] : []),
    spent,
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
      photosFor(payment, state).some((item) => item.id === photo.id),
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
      payment.counterparty ?? "",
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
    verifyScenario(payments)
    verifyNovember((day) => dayStatus(ymd(2026, 11, day), initialLedger))
    verifyHistory()
    verifySeptember(monthSummary(2026, 9, initialLedger).total)
  } catch (error) {
    console.error(error)
  }
}

// 맥락이 복원된 결제는 이름 앞의 (주)를 떼어 보여 준다. 원본(가맹점명)은 그대로 둔다.
export const stripCorp = (name: string) => name.replace(/^\(주\)\s*/, "")
export const displayName = (payment: Payment, state: LedgerState) =>
  isRestored(payment, state) ? stripCorp(payment.merchant) : payment.merchant
