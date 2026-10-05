import { ChevronRight } from "lucide-react"
import { Action } from "@/components/common"
import { label, man, won, type LedgerState } from "@/lib/ledger"
import {
  monthlyReport,
  nextWeekPreview,
  patternReport,
  praise,
  weeklyReport,
} from "@/lib/report"

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
              <p className="report-line">
                {weekly.paidDays}일 동안 {weekly.count}건 결제했어요
              </p>
              <p className="report-line">
                {weekly.categories
                  .map(([category, amount]) => `${category} ${man(amount)}원`)
                  .join(" · ")}
              </p>
              <p className="report-line">
                많이 쓴 곳: {weekly.places.map(([place, amount]) => `${place} ${man(amount)}원`).join(", ")}
              </p>
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
              <p className="report-line">주말에 지출의 {pattern.weekendPercent}%를 썼어요</p>
              <p className="report-line">가장 많이 쓴 요일은 {pattern.topWeekday}요일이에요</p>
              <p className="report-line">
                {pattern.place}에는 {pattern.placeVisits}번 갔고, 한 번에 평균 {won(pattern.placeAverage)}이에요
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
            <>
              <p className="report-line">약속 {preview.eventCount}건 잡혀 있어요</p>
              <p className="report-line">
                {preview.foodAverage !== undefined
                  ? `이런 주엔 보통 식비·카페 ${won(preview.foodAverage)} 나갔어요`
                  : "비슷한 주의 식비 기록 없음"}
              </p>
            </>
          ) : (
            <p className="report-line">다음 주 일정 기록 없음</p>
          )}
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>칭찬</strong>
          </div>
          <p className="report-line">
            {dropped
              ? `지난주보다 ${dropped.category} 지출이 ${won(dropped.diff)} 줄었어요`
              : "기록 없음"}
          </p>
        </section>

        <section className="main-card">
          <div className="block-heading">
            <strong>월간 리포트</strong>
            <span>{monthly.month}월</span>
          </div>
          <div className="report-pair">
            <div>
              <span>결제 총액</span>
              <strong>{won(monthly.total)}</strong>
            </div>
            <div>
              <span>내가 실제로 쓴 돈</span>
              <strong>{won(monthly.mine)}</strong>
            </div>
          </div>
          <p className="report-line">
            결제 {monthly.count}건 중 {monthly.restoredCount}건을 내 기록으로 채웠어요
          </p>
          <p className="report-line">
            {monthly.categories.map(([category, percent]) => `${category} ${percent}%`).join(" · ")}
          </p>
          {monthly.mineChange !== undefined && (
            <p className="report-line">
              전월보다 내 지출이 {won(Math.abs(monthly.mineChange))}{" "}
              {monthly.mineChange >= 0 ? "늘었어요" : "줄었어요"}
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
