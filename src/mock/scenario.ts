// 시연 시나리오(주인공 김소연, 기준일 2026-10-31)의 단일 원천.
// 이름·금액·시각은 여기에만 적고, 화면은 lib/ledger.ts를 거쳐 가져다 쓴다.
import type { CalEvent, Payment, Photo, Stay, TrailPoint } from "@/lib/ledger"

const d = (m: number, day: number) => ({ y: 2026, m, d: day })

export const SCENARIO = {
  persona: { name: "김소연", monthlyBudget: 1200000 },
  today: { y: 2026, m: 10, d: 31 },
  // 쓰지 않음: 온보딩의 "N건을 채웠어요" 문구는 시연 범위에서 제외했다 (2026-10-06 결정)
  onboardingFilled: 23,
  taxi: { id: "sc-taxi", time: "11:35", merchant: "카카오모빌리티", amount: 12400, boardingSpot: "압구정로데오역 2번출구" },
  photoism: {
    id: "sc-photoism",
    time: "13:10",
    merchant: "(주)포토이즘코리아",
    amount: 4000,
    label: "포토이즘 강남역점",
    spot: "강남역 11번출구",
  },
  // 대표 결제: 내가 12만원을 내고 3명이 30,000원씩 입금 → 내 몫 30,000 / 받을 돈 90,000
  meal: {
    id: "sc-gogi",
    time: "19:20",
    merchant: "(주)한돈명가 강남역점",
    amount: 120000,
    members: ["나", "지은", "민지", "수진"],
    deposits: [
      { from: "지은", amount: 30000, time: "20:41" },
      { from: "민지", amount: 30000, time: "21:02" },
      { from: "수진", amount: 30000, time: "21:15" },
    ],
  },
  // 송금: 가맹점 없는 출금 → 연남동 파스타 정산으로 추정
  transfer: { id: "sc-transfer", time: "21:30", counterparty: "김지은", amount: 18000 },
} as const

export const scenarioEvents: CalEvent[] = [
  { id: "e-sc1", title: "지은이랑 저녁", date: d(10, 30), start: "20:00", end: "22:00", zone: "연남동", people: ["지은"] },
  { id: "e-sc2", title: "동기 저녁 모임", date: d(10, 31), start: "19:00", end: "21:30", zone: "강남역", people: ["지은", "민지", "수진"] },
]

export const scenarioPhotos: Photo[] = [
  { id: "ph-sc1", date: d(10, 30), time: "19:40", zone: "연남동", title: "연남동 파스타", content: "파스타 · 2인 세팅" },
  { id: "ph-sc2", date: d(10, 31), time: "13:12", zone: "강남역", title: "포토이즘 강남역점", content: "포토부스 · 사진 4컷" },
  { id: "ph-sc3", date: d(10, 31), time: "19:35", zone: "강남역", title: "한돈명가 강남역점", content: "고기 · 4인 세팅" },
]

// 위치 체류 구간: 복원의 기준. 결제 시각이 구간 밖이면 이동 중으로 본다.
export const scenarioStays: Stay[] = [
  { id: "stay-sc1", date: d(10, 30), zone: "연남동", name: "연남동", from: "19:12", to: "21:05" },
  { id: "stay-sc2", date: d(10, 31), zone: "압구정로데오", name: "압구정로데오", from: "09:30", to: "11:20" },
]

// 체류 지점은 구역 이름이 지도에 이미 표시되므로 별도 라벨을 두지 않는다
export const scenarioTrail: TrailPoint[] = [
  { id: "t-sc1", date: d(10, 30), time: "19:12", name: "", zone: "연남동" },
  { id: "t-sc2", date: d(10, 31), time: "09:30", name: "", zone: "압구정로데오" },
]

const { taxi, photoism, meal, transfer } = SCENARIO

export const scenarioPayments: Payment[] = [
  {
    id: taxi.id,
    date: d(10, 31),
    time: taxi.time,
    merchant: taxi.merchant,
    amount: taxi.amount,
    category: "교통",
    zone: "압구정로데오",
    // 체류 구간 밖(이동 중)이라 위치(place)는 없다. 직전 체류지가 탑승 지점이다.
    transit: { from: taxi.boardingSpot },
  },
  {
    id: photoism.id,
    date: d(10, 31),
    time: photoism.time,
    merchant: photoism.merchant,
    amount: photoism.amount,
    category: "문화·여가",
    zone: "강남역",
    place: "강남역",
    restored: { label: photoism.label, spot: photoism.spot },
  },
  {
    id: meal.id,
    date: d(10, 31),
    time: meal.time,
    merchant: meal.merchant,
    amount: meal.amount,
    category: "식비·카페",
    zone: "강남역",
    place: "강남역",
    group: [...meal.members],
    deposits: meal.deposits.map((item) => ({ ...item })),
  },
  {
    id: transfer.id,
    date: d(10, 30),
    time: transfer.time,
    merchant: "송금",
    amount: transfer.amount,
    zone: "연남동",
    kind: "transfer",
    counterparty: transfer.counterparty,
  },
]

// 개발 중에만 시나리오 사실이 맞는지 확인한다 (어긋나면 콘솔 오류)
export function verifyScenario(list: Payment[]) {
  const errors: string[] = []
  const find = (id: string) => list.find((payment) => payment.id === id)
  const meal = find(SCENARIO.meal.id)
  if (!meal) errors.push("대표 결제 없음")
  else {
    const received = (meal.deposits ?? []).reduce((sum, item) => sum + item.amount, 0)
    const share = Math.round(meal.amount / (meal.group?.length ?? 1))
    if (share !== 30000) errors.push(`내 몫 ${share} (기대 30000)`)
    if (meal.amount - share !== 90000) errors.push(`받을 돈 ${meal.amount - share} (기대 90000)`)
    if (received !== 90000) errors.push(`입금 합계 ${received} (기대 90000)`)
    if ((meal.deposits ?? []).length !== 3) errors.push("입금 3건이 아님")
  }
  for (const id of [SCENARIO.taxi.id, SCENARIO.photoism.id, SCENARIO.transfer.id])
    if (!find(id)) errors.push(`${id} 없음`)
  if (errors.length > 0) throw new Error(`시나리오 검증 실패\n${errors.join("\n")}`)
}
