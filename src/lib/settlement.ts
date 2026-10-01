// 정산 목업 데이터와 계산 로직. 정산표·확정·결과·여행 리포트가 같은 숫자를 쓰도록 한 곳에서 계산한다.
export type Member = "나" | "수현" | "민지"
export type SettlementCategory = "교통" | "숙박" | "식비" | "관광" | "간식"
export type SettlementItem = {
  name: string
  category: SettlementCategory
  amount: number
  payer: Member
  // 출발 전에 결제한 항목 (여행 비용 리포트의 "준비" vs "현지" 구분)
  prep: boolean
}

export const MEMBERS: readonly Member[] = ["나", "수현", "민지"]

// 홈 여행 모드의 결제(해녀 식당·입장료·공항 편의점)는 내가 낸 것으로 맞춰 둠
export const settlementItems: readonly SettlementItem[] = [
  { name: "항공권", category: "교통", amount: 360000, payer: "나", prep: true },
  { name: "숙소 에어비앤비", category: "숙박", amount: 420000, payer: "나", prep: true },
  { name: "렌터카", category: "교통", amount: 150000, payer: "수현", prep: false },
  { name: "해녀 식당", category: "식비", amount: 132000, payer: "나", prep: false },
  { name: "성산일출봉 입장료", category: "관광", amount: 15000, payer: "나", prep: false },
  { name: "제주 공항 편의점", category: "간식", amount: 18000, payer: "나", prep: false },
  { name: "편의점 야식", category: "간식", amount: 24000, payer: "민지", prep: false },
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
  const share = (list: readonly SettlementItem[]) =>
    Math.round(sum(list) / MEMBERS.length)
  // 식비·간식은 리포트에서 식비로 합침
  const byCategory = {
    교통: share(items.filter((item) => item.category === "교통")),
    숙박: share(items.filter((item) => item.category === "숙박")),
    식비: share(
      items.filter((item) => item.category === "식비" || item.category === "간식"),
    ),
    관광: share(items.filter((item) => item.category === "관광")),
  }
  return {
    items,
    total,
    perPerson,
    paid,
    receive,
    owes,
    byCategory,
    prepShare: share(items.filter((item) => item.prep)),
    localShare: share(items.filter((item) => !item.prep)),
  }
}

export type SettlementSummary = ReturnType<typeof summarize>
