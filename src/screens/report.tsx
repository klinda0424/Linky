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

// 근거 줄: 요약 문장 아래에 사실을 한 줄씩 적는다
function Facts({ lines }: { lines: (string | undefined)[] }) {
  const list = lines.filter(Boolean)
  if (list.length === 0) return null
  return (
    <ul className="rpt-facts">
      {list.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}

// ---------- 리포트 탭: 주간 · 내 지출 패턴 · 다음 주 예고 · 칭찬 · 월간 · 정산 내역 ----------
// 카드마다 한 줄 요약 문장 → 근거 줄. 판단 없는 사실만 쓰고, 조절 제안은 다음 주 예고에서만, 데이터가 없으면 "기록 없음".
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
  const topDay = weekly.daily.reduce((best, day) => (day.value > best.value ? day : best), weekly.daily[0])
  return (
    <>
      <div className="main-simple-header">
        <p>리포트</p>
      </div>
      <div className="report-scroll">
        <section className="main-card report-preview">
          <div className="block-heading">
            <strong>다음 주 예고</strong>
            <span>{preview ? `${label(preview.from)}부터` : ""}</span>
          </div>
          {preview ? (
            <>
              <p className="rpt-head">
                다음 주 약속이 <b>{preview.eventCount}건</b> 잡혀 있어요.
                {preview.foodAverage !== undefined && (
                  <>
                    {" "}이런 주엔 보통 식비·카페로 <b>{won(preview.foodAverage)}</b> 나갔어요.
                  </>
                )}
              </p>
              <Facts
                lines={[
                  preview.foodAverage === undefined ? "비슷한 주의 식비 기록 없음" : undefined,
                  `참고로 이번 주 식비·카페는 ${won(preview.thisWeekFood)}이에요`,
                ]}
              />
            </>
          ) : (
            <p className="report-line">다음 주 일정 기록 없음</p>
          )}
        </section>

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
              <p className="rpt-head">
                이번 주에 <b>{won(weekly.total)}</b>을 썼어요.
              </p>
              <Columns
                items={weekly.daily.map((day) => ({
                  label: day.weekday,
                  value: day.value,
                  today: day.today,
                }))}
              />
              <Facts
                lines={[
                  `${weekly.paidDays}일 동안 ${weekly.count}건 결제했어요`,
                  topDay.value > 0
                    ? `${topDay.weekday}요일에 ${man(topDay.value)}원으로 가장 많이 썼어요`
                    : undefined,
                  weekly.categories.length > 0
                    ? `${weekly.categories
                        .slice(0, 2)
                        .map(([name, amount]) => `${name} ${man(amount)}원`)
                        .join(", ")} 순으로 많았어요`
                    : undefined,
                  weekly.places[0]
                    ? `${weekly.places[0][0]}에서 ${man(weekly.places[0][1])}원을 썼어요`
                    : undefined,
                ]}
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
              <p className="rpt-head">
                주말에 지출의 <b>{pattern.weekendPercent}%</b>를 썼어요.
              </p>
              <SplitBar
                parts={[
                  { label: "주말", value: pattern.weekend, text: `${pattern.weekendPercent}%` },
                  {
                    label: "평일",
                    value: pattern.total - pattern.weekend,
                    text: `${100 - pattern.weekendPercent}%`,
                  },
                ]}
              />
              <Facts
                lines={[
                  `가장 많이 쓴 요일은 ${pattern.topWeekday}요일이에요`,
                  `${pattern.place}에는 ${pattern.placeVisits}번 갔고, 갈 때마다 평균 ${won(pattern.placeAverage)}이에요`,
                ]}
              />
            </>
          ) : (
            <p className="report-line">기록 없음</p>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>칭찬</strong>
          </div>
          {dropped ? (
            <p className="rpt-head">
              지난주보다 {dropped.category} 지출이 <b>{won(dropped.diff)}</b> 줄었어요.
            </p>
          ) : (
            <p className="report-line">기록 없음</p>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>월간 리포트</strong>
            <span>{monthly.month}월</span>
          </div>
          <p className="rpt-head">
            결제 총액 {won(monthly.total)} 중 내가 실제로 쓴 돈은 <b>{won(monthly.mine)}</b>이에요.
          </p>
          <Facts
            lines={[
              `결제 ${monthly.count}건 중 ${monthly.restoredCount}건을 내 기록으로 채웠어요`,
              monthly.categories.length > 0
                ? `${monthly.categories
                    .slice(0, 2)
                    .map(([name, percent]) => `${name} ${percent}%`)
                    .join(", ")} 순으로 많았어요`
                : undefined,
              monthly.mineChange !== undefined
                ? `전월보다 내 지출이 ${won(Math.abs(monthly.mineChange))} ${monthly.mineChange >= 0 ? "늘었어요" : "줄었어요"}`
                : undefined,
            ]}
          />
        </section>

        <Action className="main-card report-link" onClick={openSettlement}>
          <strong>정산 내역</strong>
          <ChevronRight size={17} strokeWidth={1.5} />
        </Action>
      </div>
    </>
  )
}
