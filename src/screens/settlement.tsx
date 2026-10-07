import { ArrowLeft, ChevronRight, Home } from "lucide-react"
import { Action, StatusChip } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type LedgerState,
  label,
  payments,
  shareOf,
  won as wonFull,
} from "@/lib/ledger"
import { settlementPeriod, settlementTitle, summarize, won } from "@/lib/settlement"

// 마이페이지 > 정산 내역
export function SettlementList({
  back,
  goHome,
  open,
  completed,
  state,
}: {
  back: () => void
  // 홈 알림에서 시작한 정산 흐름이 끝나면 홈으로 바로 돌아간다
  goHome?: () => void
  // 정산 대기 중일 때만 정산 시트를 연다. 완료분은 눌러서 갈 곳이 없다
  open?: () => void
  completed: boolean
  // 있으면 인원 분할을 확정한 그룹 결제를 함께 보여 준다
  state?: LedgerState
}) {
  const summary = summarize([])
  const splits = state
    ? payments
        .filter((payment) => payment.group && state.splitConfirmed.includes(payment.id))
        .sort((a, b) => b.date.m - a.date.m || b.date.d - a.date.d)
    : []
  return (
    <div className="main-page sub-page">
      {goHome ? (
        // 왼쪽 위: 뒤로 가기 + 홈
        <div className="main-subheader st-head">
          <div className="st-head-left">
            <Action className="main-back" onClick={back} label="뒤로 가기">
              <ArrowLeft size={20} strokeWidth={1.6} />
            </Action>
            <Action className="main-back st-home" onClick={goHome} label="홈으로">
              <Home size={20} strokeWidth={1.6} />
            </Action>
          </div>
          <p>정산 내역</p>
          <span />
        </div>
      ) : (
        <MainHeader back={back} title="정산 내역" />
      )}
      <div className="settlement-scroll">
        <p className="section-title settlement-list-title">그룹 지출 정산</p>
        {(() => {
          const body = (
            <>
              <div>
                <strong>{settlementTitle}</strong>
                <span>{settlementPeriod}</span>
                <p>
                  결제 {summary.items.length}건 · {won(summary.total)}
                </p>
              </div>
              <StatusChip type={completed ? "done" : "waiting"} />
              {open && !completed && <ChevronRight size={17} strokeWidth={1.5} />}
            </>
          )
          return open && !completed ? (
            <Action className="main-card settlement-history" onClick={open}>
              {body}
            </Action>
          ) : (
            <div className="main-card settlement-history">{body}</div>
          )
        })()}
        {state && (
          <>
            <p className="section-title settlement-list-title">내 몫으로 나눈 결제</p>
            {splits.length === 0 ? (
              <p className="settlement-empty">기록 없음</p>
            ) : (
              <div className="split-history">
                {splits.map((payment) => (
                  <div key={payment.id}>
                    <div>
                      <strong>{payment.merchant}</strong>
                      <span>
                        {label(payment.date)} · {payment.group?.length}명
                      </span>
                    </div>
                    <p>
                      결제 {wonFull(payment.amount)}
                      <strong>내 몫 {wonFull(shareOf(payment, state))}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
