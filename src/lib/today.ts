// 시연 주인공의 "오늘"(12월 12일) 지출. 홈 지출 카드, 하루 리포트, 일간 인사이트가 같은 값을 쓴다.
export type TodayCategory = "쇼핑" | "배달" | "교통"

export type TodayExpense = {
  name: string
  merchant: string
  // 결제에 연결된 일정·메모
  note?: string
  category: TodayCategory
  narrative: string
  amount: number
  time: string
}

export const todayExpenses: readonly TodayExpense[] = [
  // 시험 스트레스로 밤사이 여러 앱에서 산 옷 5벌, 합계 180,000원. 첫 항목(원피스)이 U3-1 구매항목 복원의 대상.
  // 같은 쇼핑몰에서 산 옷은 한 번에 결제했으므로 결제 시각이 같다 (무신사 23:26, 에이블리 23:41, 지그재그 23:55).
  {
    name: "원피스",
    merchant: "에이블리",
    category: "쇼핑",
    narrative: "옷",
    amount: 40000,
    time: "23:41",
  },
  {
    name: "니트 가디건",
    merchant: "무신사",
    category: "쇼핑",
    narrative: "옷",
    amount: 42000,
    time: "23:26",
  },
  {
    name: "와이드 데님",
    merchant: "지그재그",
    category: "쇼핑",
    narrative: "옷",
    amount: 49000,
    time: "23:55",
  },
  {
    name: "블라우스",
    merchant: "에이블리",
    category: "쇼핑",
    narrative: "옷",
    amount: 29000,
    time: "23:41",
  },
  {
    name: "플리츠 스커트",
    merchant: "무신사",
    category: "쇼핑",
    narrative: "옷",
    amount: 20000,
    time: "23:26",
  },
  {
    name: "떡볶이",
    merchant: "배달의민족",
    category: "배달",
    narrative: "배달",
    amount: 6500,
    time: "20:05",
  },
  {
    name: "택시",
    merchant: "경희대학교 서울캠퍼스 → 강남역 3번출구",
    note: "새벽 1시 · 이별을 겪은 친구와 먹죽 day",
    category: "교통",
    narrative: "택시",
    amount: 22400,
    time: "01:00",
  },
]

export const todayTotal = todayExpenses.reduce(
  (sum, expense) => sum + expense.amount,
  0,
)

// 평소(최근 4주) 하루 평균 지출. 오늘과 비교하는 기준.
export const usualDaily: Record<TodayCategory | "기타", number> = {
  쇼핑: 4000,
  배달: 5000,
  교통: 3500,
  기타: 5000,
}

export const usualTotal = Object.values(usualDaily).reduce(
  (sum, amount) => sum + amount,
  0,
)

export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`

export const todayByCategory = todayExpenses.reduce<Record<string, number>>(
  (totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
    return totals
  },
  {},
)
