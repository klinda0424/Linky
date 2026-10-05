import {
  TODAY,
  events,
  isRestored,
  keyOf,
  monthSummary,
  payments,
  shareOf,
  ymd,
  type LedgerState,
  type Payment,
  type YMD,
} from "@/lib/ledger"

// 리포트 탭 집계. 모든 값은 내 몫(확정한 분할만 차감) 기준이고, 평가 없이 사실만 계산한다.
// 카테고리가 없는 결제(9월 기존 상세)는 "기타"로 묶는다.
const categoryOf = (payment: Payment) => payment.category ?? "기타"

export const addDays = (date: YMD, days: number): YMD => {
  const moved = new Date(date.y, date.m - 1, date.d + days)
  return ymd(moved.getFullYear(), moved.getMonth() + 1, moved.getDate())
}

// 일요일 시작 주의 첫날
export const sundayOf = (date: YMD): YMD =>
  addDays(date, -new Date(date.y, date.m - 1, date.d).getDay())

const inRange = (payment: Payment, from: YMD, to: YMD) =>
  keyOf(payment.date) >= keyOf(from) && keyOf(payment.date) <= keyOf(to)

const paymentsIn = (from: YMD, to: YMD) =>
  payments.filter((payment) => inRange(payment, from, to))

const sum = (list: Payment[], state: LedgerState) =>
  list.reduce((total, payment) => total + shareOf(payment, state), 0)

const groupSum = (list: Payment[], state: LedgerState, keyFn: (p: Payment) => string) => {
  const map = new Map<string, number>()
  for (const payment of list) {
    const key = keyFn(payment)
    map.set(key, (map.get(key) ?? 0) + shareOf(payment, state))
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

// 주간 리포트: 이번 주 총액·지출일수·카테고리·어디서 썼는지
export function weeklyReport(state: LedgerState) {
  const from = sundayOf(TODAY)
  const to = addDays(from, 6)
  const list = paymentsIn(from, to)
  return {
    from,
    to,
    total: sum(list, state),
    count: list.length,
    paidDays: new Set(list.map((payment) => keyOf(payment.date))).size,
    categories: groupSum(list, state, categoryOf),
    places: groupSum(list, state, (payment) => payment.zone).slice(0, 3),
  }
}

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"]

// 내 지출 패턴: 이번 달 주말 비중, 가장 많이 쓴 요일, 가장 자주 간 장소의 한 번 평균
export function patternReport(state: LedgerState) {
  const list = paymentsIn(ymd(TODAY.y, TODAY.m, 1), TODAY)
  const total = sum(list, state)
  if (list.length === 0 || total === 0) return undefined
  const dayOf = (payment: Payment) =>
    new Date(payment.date.y, payment.date.m - 1, payment.date.d).getDay()
  const weekend = sum(
    list.filter((payment) => [0, 6].includes(dayOf(payment))),
    state,
  )
  const byDay = groupSum(list, state, (payment) => weekdayNames[dayOf(payment)])
  const placeCounts = new Map<string, Payment[]>()
  for (const payment of list) {
    placeCounts.set(payment.zone, [...(placeCounts.get(payment.zone) ?? []), payment])
  }
  const [place, placeList] =
    [...placeCounts.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? []
  return {
    month: TODAY.m,
    weekendPercent: Math.round((weekend / total) * 100),
    topWeekday: byDay[0]?.[0],
    place,
    placeVisits: placeList?.length ?? 0,
    placeAverage: placeList ? Math.round(sum(placeList, state) / placeList.length) : 0,
  }
}

const eventCountIn = (from: YMD, state: LedgerState) =>
  state.sources.calendar
    ? events.filter(
        (event) =>
          keyOf(event.date) >= keyOf(from) && keyOf(event.date) <= keyOf(addDays(from, 6)),
      ).length
    : 0

// 다음 주 예고: 다음 주 일정 수와, 일정이 그만큼 이상 있던 지난 주들의 식비·카페 평균
export function nextWeekPreview(state: LedgerState) {
  const nextSunday = addDays(sundayOf(TODAY), 7)
  const eventCount = eventCountIn(nextSunday, state)
  if (eventCount === 0) return undefined
  const similar = Array.from({ length: 8 }, (_, index) => addDays(sundayOf(TODAY), -7 * index))
    .filter((sunday) => eventCountIn(sunday, state) >= eventCount)
    .map((sunday) =>
      sum(
        paymentsIn(sunday, addDays(sunday, 6)).filter(
          (payment) => payment.category === "식비·카페",
        ),
        state,
      ),
    )
    .filter((amount) => amount > 0)
  return {
    from: nextSunday,
    eventCount,
    foodAverage: similar.length
      ? Math.round(similar.reduce((a, b) => a + b, 0) / similar.length)
      : undefined,
  }
}

// 칭찬: 지난주보다 가장 많이 줄어든 카테고리 (내 기록끼리의 비교만)
export function praise(state: LedgerState) {
  const thisSunday = sundayOf(TODAY)
  const lastSunday = addDays(thisSunday, -7)
  const now = new Map(groupSum(paymentsIn(thisSunday, addDays(thisSunday, 6)), state, categoryOf))
  const before = groupSum(paymentsIn(lastSunday, addDays(lastSunday, 6)), state, categoryOf)
  const dropped = before
    .map(([category, amount]) => ({ category, diff: amount - (now.get(category) ?? 0) }))
    .filter((item) => item.diff > 0)
    .sort((a, b) => b.diff - a.diff)[0]
  return dropped
}

// 월간 리포트: 결제 총액 vs 내가 실제로 쓴 돈, 맥락 복원율, 카테고리 비중, 전월 변화
export function monthlyReport(state: LedgerState) {
  const { y, m } = TODAY
  const list = paymentsIn(ymd(y, m, 1), ymd(y, m, 31))
  const summary = monthSummary(y, m, state)
  const previous = m > 1 ? monthSummary(y, m - 1, state) : undefined
  const mineTotal = sum(list, state)
  return {
    month: m,
    total: summary.total,
    mine: summary.mine,
    restoredCount: list.filter((payment) => isRestored(payment, state)).length,
    count: list.length,
    categories: groupSum(list, state, categoryOf).map(
      ([category, amount]) => [category, Math.round((amount / (mineTotal || 1)) * 100)] as const,
    ),
    mineChange: previous ? summary.mine - previous.mine : undefined,
  }
}
