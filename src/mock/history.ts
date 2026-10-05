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

// 9월: ledger.ts의 기존 상세 목업(p1~p28, 결제 421,500원)에 생성 결제를 더해 월 결제 총액을 150만원으로 맞춘다
const SEPT_BASE_TOTAL = 421500
const SEPT_TARGET = 1500000
// 기존 목업에 결제가 있는 날은 생성 결제도 위치 근거를 붙여 기존 근거와 어긋나지 않게 한다
const septBaseDays = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 15, 17, 19, 22, 25, 26, 29]
const septemberExtra = generateMonth({
  y: 2026,
  m: 9,
  seed: 9 * 7919,
  target: SEPT_TARGET - SEPT_BASE_TOTAL,
  plan: randomPlan(2026, 9, 9 * 104729).map((plan, index) =>
    septBaseDays.includes(index + 1) ? "complete" : plan,
  ),
  idPrefix: "h9-",
  // 성수 검색 결과가 10~11월 시연과 섞이지 않게 성수는 쓰지 않는다
  weekdayZones: ["강남역", "선릉", "역삼", "광화문"],
  weekendZones: ["합정", "용산", "서울숲", "광화문"],
})

export const historyPayments: Payment[] = [...Object.entries(monthlyTotals).flatMap(
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
), ...septemberExtra]

// 9월 전체(기존 + 생성) 결제 총액 검증. 합계는 ledger.ts에서 계산해 넘긴다.
export function verifySeptember(total: number) {
  if (total !== SEPT_TARGET)
    throw new Error(`9월 목업 검증 실패: 결제 총액 ${total} (기대 ${SEPT_TARGET})`)
}

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
