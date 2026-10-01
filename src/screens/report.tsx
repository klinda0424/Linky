import { useState, type TouchEvent } from "react"
import { Bell, ShoppingBag } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type Tone } from "@/types"

const moods = [
  { emoji: "😆", label: "아주 좋아요" },
  { emoji: "🙂", label: "좋아요" },
  { emoji: "😐", label: "보통이에요" },
  { emoji: "😩", label: "지쳤어요" },
  { emoji: "😣", label: "힘들어요" },
] as const

// Both tones render this same day. Connecting the chosen mood needs shared state.
const dailyReport = {
  title: "12월 15일 리포트",
  mood: { context: "지친 날", label: "기분 안좋음" },
  previousWeekTotal: 16000,
  expenses: [
    {
      name: "원피스",
      merchant: "에이블리",
      category: "쇼핑",
      narrative: "옷",
      amount: 40000,
    },
    {
      name: "떡볶이",
      merchant: "배달의민족",
      category: "배달",
      narrative: "배달",
      amount: 6500,
    },
    {
      name: "CU 편의점",
      merchant: "",
      category: "편의점",
      narrative: "편의점",
      amount: 1500,
    },
  ],
} as const
const formatWon = (amount: number) => `${amount.toLocaleString("ko-KR")}원`
const dailyTotal = dailyReport.expenses.reduce(
  (sum, expense) => sum + expense.amount,
  0,
)
const categoryTotals = Object.entries(
  dailyReport.expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
    return totals
  }, {}),
).sort((a, b) => b[1] - a[1])
const largestCategory = Math.max(
  ...categoryTotals.map(([, amount]) => amount),
  1,
)
const connectedExpenses = dailyReport.expenses.filter(
  (expense) => expense.category === "쇼핑" || expense.category === "배달",
)
const weeklyDifference = dailyTotal - dailyReport.previousWeekTotal

export function MoodPrompt({
  skip,
  select,
}: {
  skip: () => void
  select: () => void
}) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  return (
    <div className="main-page mood-page">
      <div className="night-time">오후 10:18</div>
      <div className="mood-push-card">
        <div className="mood-push-brand">
          <span className="brand-mark">L</span>
          <span>Linky · 지금</span>
        </div>
        <p>오늘 하루 어땠어요?</p>
        <span>한 번만 눌러도 오늘 기록과 연결해요</span>
        <div className="push-moods">
          {moods.map(({ emoji, label }) => (
            <button
              type="button"
              className="action push-mood"
              key={emoji}
              aria-label={label}
              aria-pressed={selectedMood === emoji}
              disabled={selectedMood !== null}
              style={
                selectedMood === emoji
                  ? { background: "var(--primary-light)" }
                  : undefined
              }
              onClick={() => {
                setSelectedMood(emoji)
                select()
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Action
          className="push-skip"
          onClick={skip}
          disabled={selectedMood !== null}
        >
          건너뛰기
        </Action>
      </div>
    </div>
  )
}
export function DailyReport({
  tone,
  back,
  notify,
}: {
  tone: Tone
  back: () => void
  notify: () => void
}) {
  const [page, setPage] = useState(0)
  const [touchX, setTouchX] = useState<number>()
  const endSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (touchX === undefined) return
    const delta = event.changedTouches[0].clientX - touchX
    if (delta < -40 && page < 2) setPage(page + 1)
    if (delta > 40 && page > 0) setPage(page - 1)
    setTouchX(undefined)
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title={dailyReport.title} />
      <div className="daily-report-content">
        <div
          className="daily-report-card"
          onTouchEnd={endSwipe}
          onTouchStart={(event) => setTouchX(event.touches[0].clientX)}
        >
          {page === 0 && (
            <div className="awareness-slide">
              <span className="report-step">1 · 오늘의 기록</span>
              <p>
                오늘 {dailyReport.expenses.length}건, {formatWon(dailyTotal)}
              </p>
              <div className="report-expenses">
                {dailyReport.expenses.map(({ name, merchant, amount }) => (
                  <div key={name}>
                    <span className="expense-icon">
                      <ShoppingBag size={16} strokeWidth={1.5} />
                    </span>
                    <div>
                      <strong>{name}</strong>
                      {merchant && <span>{merchant}</span>}
                    </div>
                    <p>{formatWon(amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {page === 1 && tone === "narrative" && (
            <div className="interpret-slide">
              <span className="report-step">2 · 연결된 흐름</span>
              <span className="large-rini">L</span>
              <p>
                {dailyReport.mood.context},{" "}
                {connectedExpenses
                  .map((expense) => expense.narrative)
                  .join("과 ")}
                이 같이 있었어요.
              </p>
              <div className="connection-chips">
                <span>{dailyReport.mood.label}</span>
                {connectedExpenses.map((expense) => (
                  <span key={expense.name}>{expense.name}</span>
                ))}
              </div>
            </div>
          )}
          {page === 1 && tone === "numeric" && (
            <div className="numeric-slide">
              <span className="report-step">2 · 카테고리별 지출</span>
              <div className="daily-bars">
                {categoryTotals.map(([label, amount]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <i aria-hidden="true">
                      <b
                        style={{
                          width: `${(amount / largestCategory) * 100}%`,
                        }}
                      />
                    </i>
                    <strong>{formatWon(amount)}</strong>
                  </div>
                ))}
              </div>
              <p>
                지난주 같은 요일 대비 {weeklyDifference > 0 ? "+" : ""}
                {formatWon(weeklyDifference)}
              </p>
            </div>
          )}
          {page === 2 && (
            <div className="optin-slide">
              <span className="report-step">3 · 린이의 제안</span>
              <span className="optin-icon">
                <Bell size={26} strokeWidth={1.5} />
              </span>
              <p>비슷한 날, 미리 알려드릴까요?</p>
              <span>패턴이 겹치는 순간에만 조용히 알려드려요</span>
              <div className="confirm-buttons">
                <Action className="secondary-button" onClick={back}>
                  아니요
                </Action>
                <Action className="primary-button" onClick={notify}>
                  네
                </Action>
              </div>
            </div>
          )}
        </div>
        <div className="report-dots">
          {[0, 1, 2].map((dot) => (
            <Action
              className={cx("carousel-dot", page === dot && "current")}
              key={dot}
              onClick={() => setPage(dot)}
            />
          ))}
        </div>
        {page < 2 && (
          <Action className="report-next" onClick={() => setPage(page + 1)}>
            다음 →
          </Action>
        )}
      </div>
    </div>
  )
}
