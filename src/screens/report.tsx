import { useState, type TouchEvent } from "react"
import { Bell, ShoppingBag } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import { dayCategories, dayTotal, days } from "@/lib/days"
import { type UTMode } from "@/lib/ut"
import { type Tone } from "@/types"

export const moods = [
  { emoji: "😆", label: "아주 좋아요", context: "아주 좋은 날", chip: "기분 아주 좋음" },
  { emoji: "🙂", label: "좋아요", context: "좋은 날", chip: "기분 좋음" },
  { emoji: "😐", label: "보통이에요", context: "보통인 날", chip: "기분 보통" },
  { emoji: "😩", label: "지쳤어요", context: "지친 날", chip: "기분 안좋음" },
  { emoji: "😣", label: "힘들어요", context: "힘든 날", chip: "기분 안좋음" },
] as const
export type MoodEmoji = (typeof moods)[number]["emoji"]

const formatWon = (amount: number) => `${amount.toLocaleString("ko-KR")}원`
// 받침이 있으면 "과/이", 없으면 "와/가"
const hasFinal = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}
const joinWith = (words: string[]) =>
  words
    .map((word, index) =>
      index < words.length - 1 ? `${word}${hasFinal(word) ? "과" : "와"}` : word,
    )
    .join(" ")

export function MoodPrompt({
  skip,
  select,
}: {
  skip: () => void
  // 고른 기분을 넘겨 하루 리포트에서 그날 결제와 연결한다
  select: (mood: MoodEmoji) => void
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
                select(emoji)
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
  stage,
  mood = "😩",
  back,
  notify,
  decline,
}: {
  tone: Tone
  // 기분을 기록한 홈 단계. 그날(lib/days.ts)의 결제와 연결한다.
  stage: UTMode
  // 고른 기분 (기록하지 않고 열면 "지친 날")
  mood?: MoodEmoji
  back: () => void
  notify: () => void
  // "아니요" 선택 (없으면 back과 동일하게 동작)
  decline?: () => void
}) {
  const day = days[stage]
  const dailyTotal = dayTotal(day)
  const categoryTotals = dayCategories(day)
  const largestCategory = Math.max(
    ...categoryTotals.map(([, amount]) => amount),
    1,
  )
  const moodInfo = moods.find((item) => item.emoji === mood) ?? moods[3]
  // 시험기간은 기분과 겹친 옷·배달 결제만, 다른 날은 그날 결제 전부를 기분과 연결한다
  const connectedExpenses =
    stage === "exam"
      ? day.expenses.filter(
          (expense) => expense.category === "쇼핑" || expense.category === "배달",
        )
      : day.expenses
  const connectedWords = [
    ...new Set(connectedExpenses.map((expense) => expense.narrative)),
  ]
  const lastWord = connectedWords[connectedWords.length - 1] ?? ""
  const weeklyDifference = dailyTotal - day.previousWeekTotal
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
      <MainHeader back={back} title={`${day.date} 리포트`} />
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
                오늘 {day.expenses.length}건, {formatWon(dailyTotal)}
              </p>
              <div className="report-expenses">
                {day.expenses.map(({ name, merchant, amount }) => (
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
                {moodInfo.context}, {joinWith(connectedWords)}
                {hasFinal(lastWord) ? "이" : "가"} 같이 있었어요.
              </p>
              <div className="connection-chips">
                <span>{moodInfo.chip}</span>
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
              <span className="report-step">3 · 링키의 제안</span>
              <span className="optin-icon">
                <Bell size={26} strokeWidth={1.5} />
              </span>
              <p>비슷한 날, 미리 알려드릴까요?</p>
              <span>패턴이 겹치는 순간에만 조용히 알려드려요</span>
              <div className="confirm-buttons">
                <Action className="secondary-button" onClick={decline ?? back}>
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
