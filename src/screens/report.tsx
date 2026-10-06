import { ChevronRight } from "lucide-react"
import { Action, cx } from "@/components/common"
import { label, man, won, type LedgerState } from "@/lib/ledger"
import {
  monthlyReport,
  nextWeekPreview,
  patternReport,
  praise,
  weeklyReport,
} from "@/lib/report"

// 세로 막대: 가장 큰 막대만 진한 색과 금액 표시, 나머지는 옅은 색 (모든 점에 숫자를 달지 않는다)
function Columns({
  items,
}: {
  items: { label: string; value: number; today?: boolean }[]
}) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const top = items.findIndex((item) => item.value === max)
  return (
    <div className="rpt-columns">
      {items.map((item, index) => (
        <div className={cx("rpt-col", item.today && "today")} key={item.label}>
          <em>{index === top && item.value > 0 ? man(item.value) : ""}</em>
          <span className="rpt-col-track">
            <i
              className={cx(index === top && item.value > 0 && "top", item.value === 0 && "zero")}
              style={{ height: item.value === 0 ? 2 : Math.max(4, (item.value / max) * 100) + "%" }}
            />
          </span>
          <b>{item.label}</b>
        </div>
      ))}
    </div>
  )
}

// 가로 막대: 이름 · 막대 · 값. 한 가지 색, 가장 큰 항목만 진하게
function RowBars({
  items,
  highlight = 0,
}: {
  items: { label: string; value: number; text: string }[]
  // 진하게 보일 항목 (기본은 첫 번째)
  highlight?: number
}) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <div className="rpt-rows">
      {items.map((item, index) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <span className="rpt-row-track">
            <i
              className={cx(index === highlight && "top")}
              style={{ width: Math.max(3, (item.value / max) * 100) + "%" }}
            />
          </span>
          <b>{item.text}</b>
        </div>
      ))}
    </div>
  )
}

// 비율 막대 두 칸 (예: 주말 / 평일)
function SplitBar({
  parts,
}: {
  parts: { label: string; value: number; text: string }[]
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1
  return (
    <div className="rpt-split">
      <div className="rpt-split-bar">
        {parts.map((part, index) => (
          <i
            className={cx(index === 0 && "first")}
            key={part.label}
            style={{ flex: Math.max(part.value, 0.001) / total }}
          />
        ))}
      </div>
      <div className="rpt-split-legend">
        {parts.map((part, index) => (
          <span key={part.label}>
            <u className={cx(index === 0 && "first")} />
            {part.label} <b>{part.text}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------- 리포트 탭: 주간 · 내 지출 패턴 · 다음 주 예고 · 칭찬 · 월간 · 정산 내역 ----------
// 판단 없는 사실만 쓴다. 조절 제안은 다음 주 예고에서만, 데이터가 없으면 "기록 없음".
export function ReportTab({
  state,
  openSettlement,
}: {
  state: LedgerState
  openSettlement: () => void
}) {
  const weekly = weeklyReport(state)
  const pattern = patternReport(state)
  const preview = nextWeekPreview(state)
  const dropped = praise(state)
  const monthly = monthlyReport(state)
  const restoredPercent = monthly.count ? Math.round((monthly.restoredCount / monthly.count) * 100) : 0
  return (
    <>
      <div className="main-simple-header">
        <p>리포트</p>
      </div>
      <div className="report-scroll">
        <section className="main-card">
          <div className="block-heading">
            <strong>주간 리포트</strong>
            <span>
              {label(weekly.from)} ~ {label(weekly.to)}
            </span>
          </div>
          {weekly.count === 0 ? (
            <p className="report-line">기록 없음</p>
          ) : (
            <>
              <p className="report-main">{won(weekly.total)}</p>
              <p className="rpt-sub">
                {weekly.paidDays}일 · {weekly.count}건 결제
              </p>
              <Columns
                items={weekly.daily.map((day) => ({
                  label: day.weekday,
                  value: day.value,
                  today: day.today,
                }))}
              />
              <p className="rpt-label">카테고리</p>
              <RowBars
                items={weekly.categories.map(([name, amount]) => ({
                  label: name,
                  value: amount,
                  text: `${man(amount)}원`,
                }))}
              />
              <p className="rpt-label">많이 쓴 곳</p>
              <RowBars
                items={weekly.places.map(([name, amount]) => ({
                  label: name,
                  value: amount,
                  text: `${man(amount)}원`,
                }))}
              />
            </>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>내 지출 패턴</strong>
            <span>{pattern ? `${pattern.month}월` : ""}</span>
          </div>
          {pattern ? (
            <>
              <p className="rpt-sub">요일별 내 지출 · 가장 많이 쓴 요일은 {pattern.topWeekday}요일</p>
              <Columns
                items={pattern.byWeekday.map((day) => ({ label: day.weekday, value: day.value }))}
              />
              <p className="rpt-label">주말 · 평일</p>
              <SplitBar
                parts={[
                  {
                    label: "주말",
                    value: pattern.weekend,
                    text: `${pattern.weekendPercent}%`,
                  },
                  {
                    label: "평일",
                    value: pattern.total - pattern.weekend,
                    text: `${100 - pattern.weekendPercent}%`,
                  },
                ]}
              />
              <p className="rpt-label">자주 간 곳</p>
              <p className="report-line">
                {pattern.place} {pattern.placeVisits}번 · 한 번에 평균 {won(pattern.placeAverage)}
              </p>
            </>
          ) : (
            <p className="report-line">기록 없음</p>
          )}
        </section>

        <section className="main-card report-preview">
          <div className="block-heading">
            <strong>다음 주 예고</strong>
            <span>{preview ? `${label(preview.from)}부터` : ""}</span>
          </div>
          {preview ? (
            <div className="report-pair">
              <div>
                <span>잡힌 약속</span>
                <strong>{preview.eventCount}건</strong>
              </div>
              <div>
                <span>이런 주 식비·카페</span>
                <strong>
                  {preview.foodAverage !== undefined ? won(preview.foodAverage) : "기록 없음"}
                </strong>
              </div>
            </div>
          ) : (
            <p className="report-line">다음 주 일정 기록 없음</p>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>칭찬</strong>
          </div>
          {dropped ? (
            <div className="report-pair">
              <div>
                <span>지난주보다 줄어든 항목</span>
                <strong>{dropped.category}</strong>
              </div>
              <div>
                <span>줄어든 금액</span>
                <strong>{won(dropped.diff)}</strong>
              </div>
            </div>
          ) : (
            <p className="report-line">기록 없음</p>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>월간 리포트</strong>
            <span>{monthly.month}월</span>
          </div>
          <p className="rpt-label">결제 총액 → 내가 실제로 쓴 돈</p>
          <RowBars
            highlight={1}
            items={[
              { label: "결제 총액", value: monthly.total, text: won(monthly.total) },
              { label: "내 지출", value: monthly.mine, text: won(monthly.mine) },
            ]}
          />
          <p className="rpt-label">내 기록으로 채운 결제</p>
          <div className="rpt-progress">
            <span>
              <i style={{ width: restoredPercent + "%" }} />
            </span>
            <b>
              {monthly.restoredCount} / {monthly.count}건
            </b>
          </div>
          <p className="rpt-label">카테고리 비중</p>
          <RowBars
            items={monthly.categoryAmounts.map(([name, amount], index) => ({
              label: name,
              value: amount,
              text: `${monthly.categories[index]?.[1] ?? 0}%`,
            }))}
          />
          {monthly.mineChange !== undefined && (
            <p className="rpt-change">
              전월 대비 내 지출 <b>{monthly.mineChange >= 0 ? "+" : "−"}{won(Math.abs(monthly.mineChange))}</b>
            </p>
          )}
        </section>

        <Action className="main-card report-link" onClick={openSettlement}>
          <strong>정산 내역</strong>
          <ChevronRight size={17} strokeWidth={1.5} />
        </Action>
      </div>
    </>
  )
}
