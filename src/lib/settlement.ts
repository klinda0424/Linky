// 정산 목업 데이터와 계산 로직. 정산 대기함·정산표·확정·결과가 같은 숫자를 쓰도록 한 곳에서 계산한다.
export type Member = "나" | "지은" | "민지"
export type SettlementCategory = "식비" | "교통"
export type SettlementItem = {
  name: string
  category: SettlementCategory
  amount: number
  payer: Member
}

export const MEMBERS: readonly Member[] = ["나", "지은", "민지"]

// 정산 대상 모임: 10월 3일 수진이 생일 (합정). 내가 낸 고깃집은 캘린더의 같은 결제(lib/ledger.ts)다.
export const settlementTitle = "수진이 생일 모임"
export const settlementPeriod = "10월 3일 · 합정 · 3명"
export const settlementItems: readonly SettlementItem[] = [
  { name: "합정 고깃집", category: "식비", amount: 120000, payer: "나" },
  { name: "합정 호프", category: "식비", amount: 45000, payer: "지은" },
  { name: "카카오T 택시", category: "교통", amount: 21000, payer: "민지" },
]

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
