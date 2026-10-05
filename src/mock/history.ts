// 2026년 1~8월 목업. 9월은 lib/ledger.ts의 기존 데이터, 10월은 october.ts, 11월은 november.ts.
// 일정·사진 없이 결제와 내 위치 근거만 있는 단순 월이다 (월 이동으로 한 해를 둘러보기 위한 데이터).
import type { Payment } from "@/lib/ledger"
import { generateMonth, randomPlan } from "./generate"

// 월별 결제 총액 (그룹 결제 없음)
const monthlyTotals: Record<number, number> = {
  1: 1180000,
  2: 1090000,
  3: 1250000,
  4: 1210000,
  5: 1330000,
  6: 1160000,
  7: 1280000,
  8: 1220000,
}

export const historyPayments: Payment[] = Object.entries(monthlyTotals).flatMap(
  ([month, target]) =>
    generateMonth({
      y: 2026,
      m: Number(month),
      seed: Number(month) * 7919,
      target,
      plan: randomPlan(2026, Number(month), Number(month) * 104729),
      idPrefix: `h${month}-`,
      // 10~11월 시연 장소(성수)와 겹치지 않게 1~8월에는 성수를 쓰지 않는다
      weekdayZones: ["강남역", "선릉", "역삼", "광화문"],
      weekendZones: ["합정", "용산", "서울숲", "광화문"],
    }),
)

export function verifyHistory() {
  const errors: string[] = []
  for (const [month, target] of Object.entries(monthlyTotals)) {
    const sum = historyPayments
      .filter((payment) => payment.date.m === Number(month))
      .reduce((total, payment) => total + payment.amount, 0)
    if (sum !== target) errors.push(`${month}월 결제 총액 ${sum} (기대 ${target})`)
  }
  const ids = new Set(historyPayments.map((payment) => payment.id))
  if (ids.size !== historyPayments.length) errors.push("결제 id 중복")
  if (errors.length > 0) throw new Error(`1~8월 목업 검증 실패\n${errors.join("\n")}`)
}
