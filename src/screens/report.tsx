import { useState, type TouchEvent } from "react"
import { Bell, ShoppingBag } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type Tone } from "@/types"

export function MoodPrompt({
  skip,
  select,
}: {
  skip: () => void
  select: () => void
}) {
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
          {["😆", "🙂", "😐", "😩", "😣"].map((mood) => (
            <Action
              className="push-mood"
              key={mood}
              onClick={mood === "😩" ? select : undefined}
            >
              {mood}
            </Action>
          ))}
        </div>
        <Action className="push-skip" onClick={skip}>
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
      <MainHeader back={back} title="12월 12일 리포트" />
      <div className="daily-report-content">
        <div
          className="daily-report-card"
          onTouchEnd={endSwipe}
          onTouchStart={(event) => setTouchX(event.touches[0].clientX)}
        >
          {page === 0 && (
            <div className="awareness-slide">
              <span className="report-step">1 · 오늘의 기록</span>
              <p>오늘 3건, 48,000원</p>
              <div className="report-expenses">
                {[
                  ["원피스", "에이블리", "40,000원"],
                  ["떡볶이", "배달의민족", "6,500원"],
                  ["CU 편의점", "", "1,500원"],
                ].map(([name, merchant, amount]) => (
                  <div key={name}>
                    <span className="expense-icon">
                      <ShoppingBag size={16} strokeWidth={1.5} />
                    </span>
                    <div>
                      <strong>{name}</strong>
                      {merchant && <span>{merchant}</span>}
                    </div>
                    <p>{amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {page === 1 && tone === "narrative" && (
            <div className="interpret-slide">
              <span className="report-step">2 · 연결된 흐름</span>
              <span className="large-rini">L</span>
              <p>지친 날, 옷과 배달이 같이 있었어요.</p>
              <div className="connection-chips">
                <span>기분 안좋음</span>
                <span>원피스</span>
                <span>떡볶이</span>
              </div>
            </div>
          )}
          {page === 1 && tone === "numeric" && (
            <div className="numeric-slide">
              <span className="report-step">2 · 카테고리별 지출</span>
              <div className="daily-bars">
                {[
                  ["쇼핑", "40,000원", "daily-long"],
                  ["배달", "6,500원", "daily-mid"],
                  ["편의점", "1,500원", "daily-short"],
                ].map(([label, amount, width]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <i>
                      <b className={width} />
                    </i>
                    <strong>{amount}</strong>
                  </div>
                ))}
              </div>
              <p>지난주 같은 요일 대비 +32,000원</p>
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
