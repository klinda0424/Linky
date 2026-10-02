// 일정 보관함·감정 보관함 데이터. 홈 단계(지금 시점)에 맞춰 "지금까지"의 기록만 보여주기 위해
// 단계별 오늘 날짜와 날짜별 기록을 한곳에 둔다. 앵커 날(12/12 등)의 결제는 lib/today.ts, lib/days.ts와 같은 값을 쓴다.
import { settlementItems } from "@/lib/settlement"
import { todayExpenses, todayTotal } from "@/lib/today"
import { type UTMode } from "@/lib/ut"

export type YMD = { y: number; m: number; d: number }
export const ymd = (y: number, m: number, d: number): YMD => ({ y, m, d })
export const keyOf = (v: YMD) => v.y * 10000 + v.m * 100 + v.d
export const sameDay = (a: YMD, b: YMD) => keyOf(a) === keyOf(b)
export const label = (v: YMD) => `${v.m}월 ${v.d}일`

export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`

// 홈 단계별 "오늘" (lib/days.ts의 날짜와 같다)
export const archiveNow: Record<UTMode, YMD> = {
  confirm: ymd(2024, 11, 21),
  exam: ymd(2024, 12, 12),
  prepare: ymd(2024, 12, 20),
  travel: ymd(2024, 12, 23),
  after: ymd(2024, 12, 27),
  monthLater: ymd(2025, 1, 24),
}

export const archiveMonths = [
  { y: 2024, m: 11 },
  { y: 2024, m: 12 },
  { y: 2025, m: 1 },
]

// 일요일 시작 달력 칸 (앞쪽 빈 칸은 null)
export function monthCells(y: number, m: number): Array<number | null> {
  const first = new Date(y, m - 1, 1).getDay()
  const length = new Date(y, m, 0).getDate()
  const cells: Array<number | null> = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: length }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ---------- 일정 보관함 ----------
export type ArchiveEvent = {
  id: "exam" | "jeju" | "meokjuk"
  title: string
  kind: "시험기간" | "여행" | "약속"
  start: YMD
  end: YMD
  // 달력 색 (--blue / --primary / --pink)
  color: "blue" | "primary" | "pink"
  memo?: string
}

export const archiveEvents: ArchiveEvent[] = [
  {
    id: "exam",
    title: "시험기간",
    kind: "시험기간",
    start: ymd(2024, 12, 9),
    end: ymd(2024, 12, 20),
    color: "blue",
    memo: "기말고사 · 학사일정 링크에서 가져왔어요",
  },
  {
    id: "meokjuk",
    title: "친구와 먹죽 day",
    kind: "약속",
    start: ymd(2024, 12, 12),
    end: ymd(2024, 12, 12),
    color: "pink",
    memo: "이별을 겪은 친구와 · 경희대학교 서울캠퍼스 → 강남역",
  },
  {
    id: "jeju",
    title: "제주 여행",
    kind: "여행",
    start: ymd(2024, 12, 22),
    end: ymd(2024, 12, 24),
    color: "primary",
    memo: "3명 (나, 수현, 민지) · 단톡 캡처에서 가져왔어요",
  },
]

export type EventStatus = "upcoming" | "ongoing" | "past"
export function eventStatus(event: ArchiveEvent, now: YMD): EventStatus {
  if (keyOf(now) < keyOf(event.start)) return "upcoming"
  if (keyOf(now) > keyOf(event.end)) return "past"
  return "ongoing"
}
export function daysUntil(from: YMD, to: YMD) {
  const a = new Date(from.y, from.m - 1, from.d).getTime()
  const b = new Date(to.y, to.m - 1, to.d).getTime()
  return Math.round((b - a) / 86400000)
}
export const periodLabel = (event: ArchiveEvent) =>
  sameDay(event.start, event.end)
    ? label(event.start)
    : `${label(event.start)} ~ ${event.end.m === event.start.m ? `${event.end.d}일` : label(event.end)}`

// 시험기간 하루 지출(12/12는 홈 오늘 지출과 같은 값). 12/20 항공권은 제주 여행으로 묶인다.
const examDaily: Record<number, { count: number; total: number }> = {
  9: { count: 2, total: 12400 },
  10: { count: 3, total: 18900 },
  11: { count: 2, total: 9500 },
  12: { count: todayExpenses.length, total: todayTotal },
  13: { count: 3, total: 15200 },
  14: { count: 4, total: 22000 },
  15: { count: 2, total: 11300 },
  16: { count: 2, total: 9800 },
  17: { count: 3, total: 14600 },
  18: { count: 2, total: 10200 },
  19: { count: 3, total: 17500 },
  20: { count: 1, total: 8000 },
}

// 제주 여행 결제 날짜 (settlement 항목과 같은 7건)
const jejuDates: Record<string, YMD> = {
  항공권: ymd(2024, 12, 20),
  "숙소 에어비앤비": ymd(2024, 12, 22),
  렌터카: ymd(2024, 12, 22),
  "해녀 식당": ymd(2024, 12, 23),
  "성산일출봉 입장료": ymd(2024, 12, 23),
  "제주 공항 편의점": ymd(2024, 12, 23),
  "편의점 야식": ymd(2024, 12, 23),
}

export type EventRow = { title: string; sub: string; amount: number }

// 지금까지 이벤트에 묶인 지출
export function eventSpend(event: ArchiveEvent, now: YMD) {
  const nowKey = keyOf(now)
  let rows: EventRow[] = []
  if (event.id === "exam") {
    rows = Object.entries(examDaily)
      .filter(([day]) => keyOf(ymd(2024, 12, Number(day))) <= nowKey)
      .map(([day, value]) => ({
        title: `12월 ${day}일`,
        sub: `${value.count}건`,
        amount: value.total,
      }))
  } else if (event.id === "meokjuk") {
    if (nowKey >= keyOf(event.start))
      rows = todayExpenses
        .filter((expense) => expense.category !== "쇼핑")
        .map((expense) => ({
          title: expense.name,
          sub: expense.note ?? expense.merchant,
          amount: expense.amount,
        }))
  } else {
    rows = settlementItems
      .filter((item) => keyOf(jejuDates[item.name]) <= nowKey)
      .map((item) => ({
        title: item.name,
        sub: `${label(jejuDates[item.name])} · ${item.category}`,
        amount: item.amount,
      }))
  }
  const count =
    event.id === "exam"
      ? Object.entries(examDaily)
          .filter(([day]) => keyOf(ymd(2024, 12, Number(day))) <= nowKey)
          .reduce((sum, [, value]) => sum + value.count, 0)
      : rows.length
  return {
    rows,
    count,
    total: rows.reduce((sum, row) => sum + row.amount, 0),
  }
}

// ---------- 감정 보관함 ----------
export type MoodEntry = {
  date: YMD
  emoji: string
  count: number
  total: number
  note: string
}

// 오늘 이전에 남긴 기분 기록 (오늘 기분은 사용자가 고른 값을 따로 합친다)
export const pastMoods: MoodEntry[] = [
  { date: ymd(2024, 11, 4), emoji: "🙂", count: 3, total: 9800, note: "학식과 카페 결제가 있었어요" },
  { date: ymd(2024, 11, 8), emoji: "😐", count: 2, total: 7500, note: "평소 같은 하루였어요" },
  { date: ymd(2024, 11, 12), emoji: "😆", count: 4, total: 38000, note: "친구와 저녁 약속 결제가 있었어요" },
  { date: ymd(2024, 11, 15), emoji: "😐", count: 3, total: 11200, note: "카페와 지하철 결제가 있었어요" },
  { date: ymd(2024, 11, 19), emoji: "😩", count: 3, total: 24500, note: "야식 배달이 있었어요" },
  { date: ymd(2024, 12, 2), emoji: "🙂", count: 2, total: 13500, note: "카페 결제가 있었어요" },
  { date: ymd(2024, 12, 4), emoji: "😐", count: 3, total: 9800, note: "학식과 지하철 결제가 있었어요" },
  { date: ymd(2024, 12, 6), emoji: "😆", count: 4, total: 41000, note: "친구와 저녁 약속 결제가 있었어요" },
  { date: ymd(2024, 12, 9), emoji: "😐", count: 2, total: 12400, note: "시험 첫날, 학식과 카페 결제가 있었어요" },
  { date: ymd(2024, 12, 10), emoji: "😩", count: 3, total: 18900, note: "야식 배달이 있었어요" },
  { date: ymd(2024, 12, 11), emoji: "😣", count: 2, total: 9500, note: "카페 결제만 있었어요" },
  { date: ymd(2024, 12, 20), emoji: "😐", count: 1, total: 360000, note: "제주행 항공권을 결제했어요" },
  { date: ymd(2024, 12, 23), emoji: "😆", count: 3, total: 165000, note: "제주에서 식사와 관광 결제가 이어졌어요" },
  { date: ymd(2024, 12, 27), emoji: "🙂", count: 3, total: 13050, note: "분식과 카페, 지하철 결제가 있었어요" },
  { date: ymd(2025, 1, 6), emoji: "🙂", count: 2, total: 8000, note: "카페 결제가 있었어요" },
  { date: ymd(2025, 1, 13), emoji: "😐", count: 3, total: 10400, note: "평소 같은 하루였어요" },
  { date: ymd(2025, 1, 20), emoji: "🙂", count: 3, total: 12300, note: "카페와 편의점 결제가 있었어요" },
]

export const tiredEmojis = ["😩", "😣"]
