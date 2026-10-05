// 정산 목업 데이터와 계산 로직. 정산 대기함·정산표·확정·결과가 같은 숫자를 쓰도록 한 곳에서 계산한다.
import { octoberPayments } from "@/mock/october"

export type Member = "나" | "지은" | "민지" | "수진"
export type SettlementCategory = "식비" | "교통"
export type SettlementItem = {
  name: string
  category: SettlementCategory
  amount: number
  payer: Member
}

export const MEMBERS: readonly Member[] = ["나", "지은", "민지", "수진"]

// 정산 대상 모임: 10월 4일 대학 동기 모임 (합정, 4명). 내가 낸 술자리는 캘린더의 같은 결제(mock/october.ts)다.
export const meeting = octoberPayments.find(
  (payment) => payment.date.d === 4 && payment.group?.length === MEMBERS.length,
)
export const settlementTitle = "대학 동기 모임"
export const settlementPeriod = `10월 4일 · 합정 · ${MEMBERS.length}명`
export const settlementItems: readonly SettlementItem[] = meeting
  ? [{ name: meeting.merchant, category: "식비", amount: meeting.amount, payer: "나" }]
  : []

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
