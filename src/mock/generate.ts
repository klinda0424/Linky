// 월별 목업 결제 생성기. 시드를 고정해 새로고침해도 같은 데이터가 나온다.
// 복원 상태는 날짜 계획(plan)으로 만든다: complete = 모든 결제에 위치 근거,
// partial = 첫 결제만 위치 근거, none = 위치 근거 없음, empty = 결제 없음.
import type { Category, Payment } from "@/lib/ledger"

export type DayPlan = "complete" | "partial" | "none" | "empty"

const random = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const merchants: Record<Category, string[]> = {
  "식비·카페": ["스타벅스 {z}점", "이디야커피 {z}점", "(주)맘스터치 {z}점", "(주)본도시락 {z}점", "(주)샐러디 {z}점", "서브웨이 {z}점", "김밥천국 {z}점"],
  쇼핑: ["(주)올리브영 {z}점", "(주)유니클로 {z}점", "(주)무신사 스탠다드", "(주)쿠팡"],
  "문화·여가": ["CGV {z}", "(주)교보문고 {z}점", "(주)메가박스 {z}"],
  "생활·기타": ["GS25 {z}점", "(주)다이소 {z}점", "(주)이마트24 {z}점"],
  교통: ["티머니 후불교통", "카카오T 택시"],
}
const weights: Array<[Category, number]> = [
  ["식비·카페", 0.5],
  ["교통", 0.14],
  ["생활·기타", 0.14],
  ["쇼핑", 0.12],
  ["문화·여가", 0.1],
]
const baseAmount = (category: Category, pick: () => number) => {
  const between = (min: number, max: number) => min + Math.floor(pick() * (max - min))
  if (category === "식비·카페") return between(4000, 15000)
  if (category === "교통") return pick() < 0.6 ? 3100 : between(9000, 20000)
  if (category === "생활·기타") return between(3000, 14000)
  if (category === "쇼핑") return between(15000, 60000)
  return between(9000, 25000)
}

export function generateMonth({
  y,
  m,
  seed,
  target,
  plan,
  idPrefix,
  weekdayZones,
  weekendZones,
  fixed = [],
}: {
  y: number
  m: number
  seed: number
  // 월 결제 총액 (그룹 결제 없이 내 지출과 같다)
  target: number
  plan: DayPlan[]
  idPrefix: string
  weekdayZones: string[]
  weekendZones: string[]
  // 직접 지정한 결제 (금액은 그대로 두고 나머지를 맞춘다)
  fixed?: Payment[]
}): Payment[] {
  const pick = random(seed)
  const generated: Payment[] = []
  const days = new Date(y, m, 0).getDate()
  for (let day = 1; day <= days; day += 1) {
    const kind = plan[day - 1] ?? "empty"
    if (kind === "empty") continue
    const weekend = [0, 6].includes(new Date(y, m - 1, day).getDay())
    const hasFixed = fixed.some((payment) => payment.date.d === day)
    const count = hasFixed
      ? Math.floor(pick() * 2)
      : kind === "partial"
        ? 2 + Math.floor(pick() * 2)
        : weekend
          ? 2 + Math.floor(pick() * 3)
          : 1 + Math.floor(pick() * 3)
    const zones = weekend ? weekendZones : weekdayZones
    const times = new Set<string>()
    for (let i = 0; i < count; i += 1) {
      let time = ""
      do {
        const hour = 8 + Math.floor(pick() * 14)
        const minute = Math.floor(pick() * 60)
        time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      } while (times.has(time))
      times.add(time)
    }
    ;[...times].sort().forEach((time, index) => {
      let roll = pick()
      const category = (weights.find(([, weight]) => (roll -= weight) < 0) ?? weights[0])[0]
      const zone = zones[Math.floor(pick() * zones.length)]
      const names = merchants[category]
      const merchant = names[Math.floor(pick() * names.length)].replace("{z}", zone)
      const located = kind === "complete" || (kind === "partial" && index === 0)
      generated.push({
        id: "",
        date: { y, m, d: day },
        time,
        merchant,
        amount: baseAmount(category, pick) * (weekend && category !== "교통" ? 2 : 1),
        category,
        zone,
        place: located ? zone : undefined,
      })
    })
  }
  // 생성분을 월 목표에 맞게 100원 단위로 조정하고, 오차는 가장 큰 결제에 넣는다
  const fixedSum = fixed.reduce((sum, payment) => sum + payment.amount, 0)
  const baseSum = generated.reduce((sum, payment) => sum + payment.amount, 0)
  const scale = (target - fixedSum) / baseSum
  for (const payment of generated)
    payment.amount = Math.max(1000, Math.round((payment.amount * scale) / 100) * 100)
  const diff = target - fixedSum - generated.reduce((sum, payment) => sum + payment.amount, 0)
  const largest = generated.reduce((a, b) => (b.amount > a.amount ? b : a))
  largest.amount += diff
  return [...fixed, ...generated]
    .sort((a, b) => a.date.d - b.date.d || a.time.localeCompare(b.time))
    .map((payment, index) => ({ ...payment, id: payment.id || `${idPrefix}${index + 1}` }))
}

// 시드로 날짜별 복원 상태 계획을 만든다
export function randomPlan(y: number, m: number, seed: number): DayPlan[] {
  const pick = random(seed)
  return Array.from({ length: new Date(y, m, 0).getDate() }, () => {
    const roll = pick()
    if (roll < 0.06) return "empty"
    if (roll < 0.6) return "complete"
    return roll < 0.84 ? "partial" : "none"
  })
}
