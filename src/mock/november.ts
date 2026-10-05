// 2026년 11월 목업 (장면 7). 월뷰는 금액·상태만 의미가 있고, 상세는 "성수에서 쓴 돈" 검색용 3건만 둔다.
import type { CalEvent, Payment, Photo } from "@/lib/ledger"
import { type DayPlan, generateMonth } from "./generate"

const d = (day: number) => ({ y: 2026, m: 11, d: day })

export const NOVEMBER_TARGET = {
  // 그룹 결제가 없어 결제 총액과 내 지출이 같다
  mine: 1170000,
  days: 30,
  restoredDays: 26,
} as const

// 복원 완료 26일, 부분 2일(9·24), 기록 없음 2일(12·27)
const plan: DayPlan[] = Array.from({ length: 30 }, (_, index): DayPlan => {
  const day = index + 1
  if ([9, 24].includes(day)) return "partial"
  if ([12, 27].includes(day)) return "none"
  return "complete"
})

// 성수 결제 3건 (검색 "성수에서 쓴 돈"에서 10월 성수 결제와 함께 나온다)
const seongsu: Payment[] = [
  { id: "n-seongsu1", date: d(7), time: "13:20", merchant: "(주)성수연방", amount: 28000, category: "식비·카페", zone: "성수", place: "성수" },
  { id: "n-seongsu2", date: d(14), time: "14:10", merchant: "블루보틀 성수", amount: 9800, category: "식비·카페", zone: "성수", place: "성수" },
  { id: "n-seongsu3", date: d(21), time: "16:40", merchant: "(주)아디다스코리아 성수", amount: 52000, category: "쇼핑", zone: "성수", place: "성수" },
]

export const novemberPayments: Payment[] = generateMonth({
  y: 2026,
  m: 11,
  seed: 11 * 7919,
  target: NOVEMBER_TARGET.mine,
  plan,
  idPrefix: "n",
  // 11월의 성수 결제는 위 3건뿐이다
  weekdayZones: ["강남역", "선릉", "역삼", "광화문"],
  weekendZones: ["합정", "용산", "서울숲", "광화문"],
  fixed: seongsu,
})

export const novemberEvents: CalEvent[] = [
  { id: "e14", title: "지은이랑 약속", date: d(7), start: "13:00", end: "17:00", zone: "성수", people: ["지은"] },
  { id: "e15", title: "민지 생일", date: d(14), start: "13:00", end: "16:00", zone: "성수", people: ["민지"] },
  { id: "e16", title: "전시 보기", date: d(21), start: "15:00", end: "18:00", zone: "성수" },
]

export const novemberPhotos: Photo[] = [
  { id: "ph23", date: d(7), time: "13:30", zone: "성수", title: "성수연방" },
  { id: "ph24", date: d(14), time: "14:20", zone: "성수", title: "블루보틀 성수" },
  { id: "ph25", date: d(21), time: "16:50", zone: "성수", title: "성수 전시" },
  { id: "ph26", date: d(21), time: "17:10", zone: "성수", title: "성수 전시" },
]

// 합계와 복원 일수를 검증한다. statusOf에는 ledger의 dayStatus를 넘긴다.
export function verifyNovember(
  statusOf: (day: number) => "complete" | "partial" | "none" | "empty",
) {
  const errors: string[] = []
  const sum = novemberPayments.reduce((total, payment) => total + payment.amount, 0)
  if (sum !== NOVEMBER_TARGET.mine) errors.push(`11월 내 지출 ${sum} (기대 ${NOVEMBER_TARGET.mine})`)
  let restored = 0
  for (let day = 1; day <= NOVEMBER_TARGET.days; day += 1) {
    const status = statusOf(day)
    if (status === "empty") errors.push(`${day}일 결제 없음`)
    if (status === "complete") restored += 1
  }
  if (restored !== NOVEMBER_TARGET.restoredDays)
    errors.push(`11월 복원 일수 ${restored} (기대 ${NOVEMBER_TARGET.restoredDays})`)
  const places = novemberPayments.filter((payment) => payment.zone === "성수").length
  if (places !== 3) errors.push(`11월 성수 결제 ${places}건 (기대 3)`)
  if (errors.length > 0) throw new Error(`11월 목업 검증 실패\n${errors.join("\n")}`)
}
