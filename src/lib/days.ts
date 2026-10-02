// 홈 단계별 "오늘"의 결제. 홈 오늘 지출, 홈 일간 리포트, 기분 기록 → 하루 리포트(U5-1·U5-2)가
// 모두 이 값을 쓴다. 단계를 바꿔도 그날 기록과 연결되도록 날짜·결제를 한곳에 둔다.
// 시험기간(12월 12일)은 lib/today.ts의 결제를 그대로 쓴다.
import { type UTMode } from "@/lib/ut"
import { todayExpenses } from "@/lib/today"

export type DayIcon = "food" | "shop" | "car" | "won" | "pin" | "plane"

export type DayExpense = {
  name: string
  merchant: string
  // 결제에 연결된 일정·메모
  note?: string
  // 리포트 카테고리 (수치형 막대·하루 리포트 묶음)
  category: string
  // 서사형 문장에 들어가는 말 ("옷", "배달" 등)
  narrative: string
  amount: number
  icon: DayIcon
  // U8-1: 제주 위치 결제는 여행 태그로 자동 묶임
  tripTag?: boolean
}

export type Day = {
  // "12월 20일"
  date: string
  expenses: DayExpense[]
  // 하루 리포트 수치형의 "지난주 같은 요일 대비" 기준 금액
  previousWeekTotal: number
}

const examIcons = { 쇼핑: "shop", 배달: "food", 교통: "car" } as const

export const days: Record<UTMode, Day> = {
  // 여행 확정(11월 21일): 시험 3주 전의 평범한 하루
  confirm: {
    date: "11월 21일",
    previousWeekTotal: 13500,
    expenses: [
      { name: "학식", merchant: "학생식당", category: "식비", narrative: "학식", amount: 6000, icon: "food" },
      { name: "카페", merchant: "스터디 카페", category: "카페", narrative: "카페", amount: 4500, icon: "shop" },
      { name: "지하철", merchant: "교통", category: "교통", narrative: "지하철", amount: 1500, icon: "won" },
    ],
  },
  // 시험기간(12월 12일)
  exam: {
    date: "12월 12일",
    previousWeekTotal: 16000,
    expenses: todayExpenses.map((expense) => ({
      ...expense,
      icon: examIcons[expense.category],
    })),
  },
  // 여행 준비(12월 20일): 항공권 1건
  prepare: {
    date: "12월 20일",
    previousWeekTotal: 21000,
    expenses: [
      { name: "항공권", merchant: "제주 여행 · 3명", category: "교통", narrative: "항공권", amount: 360000, icon: "plane" },
    ],
  },
  // 여행 중(12월 23일): 제주 위치 결제 3건
  travel: {
    date: "12월 23일",
    previousWeekTotal: 14000,
    expenses: [
      { name: "해녀 식당", merchant: "제주 성산", category: "식비", narrative: "식사", amount: 132000, icon: "food", tripTag: true },
      { name: "성산일출봉 입장료", merchant: "관광", category: "관광", narrative: "관광", amount: 15000, icon: "pin", tripTag: true },
      { name: "제주 공항 편의점", merchant: "제주 공항", category: "간식", narrative: "편의점", amount: 18000, icon: "shop", tripTag: true },
    ],
  },
  // 여행 후(12월 27일, 귀가 사흘 뒤): 공항버스 같은 귀가 결제가 아니라 일상 결제
  after: {
    date: "12월 27일",
    previousWeekTotal: 12000,
    expenses: [
      { name: "분식", merchant: "집 근처 분식", category: "식비", narrative: "분식", amount: 7000, icon: "food" },
      { name: "아메리카노", merchant: "카페", category: "카페", narrative: "카페", amount: 4500, icon: "shop" },
      { name: "지하철", merchant: "교통", category: "교통", narrative: "지하철", amount: 1550, icon: "won" },
    ],
  },
  // 한 달 뒤(1월 24일): 평소 하루
  monthLater: {
    date: "1월 24일",
    previousWeekTotal: 12500,
    expenses: [
      { name: "스타벅스", merchant: "카페", category: "카페", narrative: "카페", amount: 6500, icon: "food" },
      { name: "편의점", merchant: "간식", category: "간식", narrative: "편의점", amount: 3200, icon: "shop" },
      { name: "지하철", merchant: "교통", category: "교통", narrative: "지하철", amount: 1500, icon: "won" },
    ],
  },
}

export const dayTotal = (day: Day) =>
  day.expenses.reduce((sum, expense) => sum + expense.amount, 0)

// 카테고리별 합계, 큰 순서
export const dayCategories = (day: Day) =>
  Object.entries(
    day.expenses.reduce<Record<string, number>>((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
      return totals
    }, {}),
  ).sort((a, b) => b[1] - a[1])
