// 정산 목업 데이터와 계산 로직. 정산 대기함·정산표·확정·결과가 같은 숫자를 쓰도록 한 곳에서 계산한다.
import { SCENARIO, scenarioPayments } from "@/mock/scenario"
// ledger.ts가 이 파일을 가져오므로 순환 참조를 피하려고 (주) 제거를 여기서 따로 둔다
const stripCorpName = (name: string) => name.replace(/^\(주\)\s*/, "")

export type Member = "나" | "지은" | "민지" | "수진"
export type SettlementCategory = "식비" | "교통"
export type SettlementItem = {
  name: string
  category: SettlementCategory
  amount: number
  payer: Member
}

export const MEMBERS: readonly Member[] = SCENARIO.meal.members

// 정산 대상: 대표 결제 강남역 고깃집 (시나리오 원천은 mock/scenario.ts). 내가 먼저 내고 3명이 입금했다.
export const meeting = scenarioPayments.find((payment) => payment.id === SCENARIO.meal.id)
export const settlementTitle = stripCorpName(meeting?.merchant ?? "그룹 결제")
export const settlementPeriod = meeting
  ? `${meeting.date.m}월 ${meeting.date.d}일 · ${meeting.place ?? meeting.zone} · ${MEMBERS.length}명`
  : `${MEMBERS.length}명`
export const settlementItems: readonly SettlementItem[] = meeting
  ? [{ name: stripCorpName(meeting.merchant), category: "식비", amount: meeting.amount, payer: "나" }]
  : []
// 정산 근거: 결제 후 들어온 입금 (시각순)
export const settlementDeposits = [...(meeting?.deposits ?? [])].sort((a, b) =>
  a.time.localeCompare(b.time),
)

export const won = (value: number) => `${value.toLocaleString()}원`

export function summarize(excluded: readonly string[]) {
  const items = settlementItems.filter((item) => !excluded.includes(item.name))
  const sum = (list: readonly SettlementItem[]) =>
    list.reduce((total, item) => total + item.amount, 0)
  const total = sum(items)
  const perPerson = Math.round(total / MEMBERS.length)
  const paid = Object.fromEntries(
    MEMBERS.map((member) => [
      member,
      sum(items.filter((item) => item.payer === member)),
    ]),
  ) as Record<Member, number>
  // 내가 더 낸 만큼이 받을 돈, 나머지 두 명이 각자 모자란 만큼 보냄
  const receive = Math.max(0, paid["나"] - perPerson)
  const owes = Object.fromEntries(
    MEMBERS.map((member) => [member, Math.max(0, perPerson - paid[member])]),
  ) as Record<Member, number>
  return { items, total, perPerson, paid, receive, owes }
}

export type SettlementSummary = ReturnType<typeof summarize>
