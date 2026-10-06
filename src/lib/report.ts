import {
  TODAY,
  events,
  isRestored,
  keyOf,
  monthSummary,
  payments,
  shareOf,
  ymd,
  type CalEvent,
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

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"]

// 주간 리포트: 이번 주 총액·지출일수·카테고리·어디서 썼는지
export function weeklyReport(state: LedgerState, anchor: YMD = TODAY) {
  const from = sundayOf(anchor)
  const to = addDays(from, 6)
  const list = paymentsIn(from, to)
  return {
    from,
    to,
    total: sum(list, state),
    count: list.length,
    paidDays: new Set(list.map((payment) => keyOf(payment.date))).size,
    // 일~토 하루별 내 지출 (막대 그래프용)
    daily: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(from, index)
      return {
        date,
        weekday: weekdayNames[index],
        value: sum(
          list.filter((payment) => keyOf(payment.date) === keyOf(date)),
          state,
        ),
        today: keyOf(date) === keyOf(TODAY),
      }
    }),
    categories: groupSum(list, state, categoryOf),
    places: groupSum(list, state, (payment) => payment.zone).slice(0, 3),
  }
}

// 내 지출 패턴: 이번 달 주말 비중, 가장 많이 쓴 요일, 가장 자주 간 장소의 한 번 평균
export function patternReport(state: LedgerState, anchor: YMD = TODAY) {
  const isCurrentMonth = anchor.y === TODAY.y && anchor.m === TODAY.m
  const to = isCurrentMonth ? TODAY : ymd(anchor.y, anchor.m, new Date(anchor.y, anchor.m, 0).getDate())
  const from = ymd(anchor.y, anchor.m, 1)
  const list = paymentsIn(from, to)
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
    month: anchor.m,
    weekendPercent: Math.round((weekend / total) * 100),
    topWeekday: byDay[0]?.[0],
    // 월~일 순서의 요일별 내 지출 (막대 그래프용)
    byWeekday: ["월", "화", "수", "목", "금", "토", "일"].map((name) => ({
      weekday: name,
      value: byDay.find(([day]) => day === name)?.[1] ?? 0,
    })),
    weekend,
    total,
    weekdayAverage: Math.round(
      sum(
        list.filter((payment) => ![0, 6].includes(dayOf(payment))),
        state,
      ) /
        Math.max(
          1,
          Array.from({ length: to.d }, (_, index) =>
            new Date(anchor.y, anchor.m - 1, index + 1).getDay(),
          ).filter((day) => ![0, 6].includes(day)).length,
        ),
    ),
    weekendAverage: Math.round(
      weekend /
        Math.max(
          1,
          Array.from({ length: to.d }, (_, index) =>
            new Date(anchor.y, anchor.m - 1, index + 1).getDay(),
          ).filter((day) => [0, 6].includes(day)).length,
        ),
    ),
    place,
    placeVisits: placeList?.length ?? 0,
    placeAverage: placeList ? Math.round(sum(placeList, state) / placeList.length) : 0,
  }
}

const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

const paymentsForEvent = (event: CalEvent) =>
  payments.filter(
    (payment) =>
      keyOf(payment.date) === keyOf(event.date) &&
      minutes(payment.time) >= minutes(event.start) - 60 &&
      minutes(payment.time) <= minutes(event.end) + 60,
  )

// 같은 장소의 과거 일정이 2번 이상 있고, 같은 결제 분류가 2번 이상 함께 기록된 경우만 반복 사실로 쓴다.
// 일정-결제 연결은 원장의 기존 규칙과 같은 일정 시간대 ±60분을 사용한다.
function repeatedFactFor(event: CalEvent, state: LedgerState) {
  const observed = events.filter(
    (past) => past.zone === event.zone && keyOf(past.date) < keyOf(TODAY),
  )
  if (!state.sources.calendar || observed.length < 2) return undefined

  const counts = new Map<string, number>()
  for (const past of observed) {
    const categories = new Set(paymentsForEvent(past).map(categoryOf))
    for (const category of categories)
      counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  const [category, matchedCount] =
    [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])[0] ?? []
  if (!category || !matchedCount) return undefined

  return `기록된 ${event.zone} 일정 ${observed.length}번 중 ${matchedCount}번에서 ${category} 결제가 함께 기록됐어요.`
}

// 다음 주 예고: 확정된 일정과, 같은 장소의 과거 일정에서 반복 확인된 결제 사실
export function nextWeekPreview(state: LedgerState) {
  const nextSunday = addDays(sundayOf(TODAY), 7)
  const nextEvents = state.sources.calendar
    ? events
        .filter(
          (event) =>
            keyOf(event.date) >= keyOf(nextSunday) &&
            keyOf(event.date) <= keyOf(addDays(nextSunday, 6)),
        )
        .sort((a, b) => keyOf(a.date) - keyOf(b.date) || a.start.localeCompare(b.start))
    : []
  if (nextEvents.length === 0) return undefined

  return {
    from: nextSunday,
    events: nextEvents.map((event) => ({
      ...event,
      repeatedFact: repeatedFactFor(event, state),
    })),
  }
}

// 지난주와 달라진 점: 가장 많이 줄어든 카테고리 (내 기록끼리의 사실 비교만)
export function weeklyChange(state: LedgerState, anchor: YMD = TODAY) {
  const thisSunday = sundayOf(anchor)
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
export function monthlyReport(state: LedgerState, anchor: YMD = TODAY) {
  const { y, m } = anchor
  const list = paymentsIn(ymd(y, m, 1), ymd(y, m, 31))
  const summary = monthSummary(y, m, state)
  const previousDate = new Date(y, m - 2, 1)
  const previous = monthSummary(previousDate.getFullYear(), previousDate.getMonth() + 1, state)
  const mineTotal = sum(list, state)
  return {
    month: m,
    total: summary.total,
    mine: summary.mine,
    restoredCount: list.filter((payment) => isRestored(payment, state)).length,
    count: list.length,
    categoryAmounts: groupSum(list, state, categoryOf),
    categories: groupSum(list, state, categoryOf).map(
      ([category, amount]) => [category, Math.round((amount / (mineTotal || 1)) * 100)] as const,
    ),
    mineChange: previous ? summary.mine - previous.mine : undefined,
  }
}
