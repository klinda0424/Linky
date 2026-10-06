import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  type LedgerState,
  type Payment,
  dayMine,
  dayTotal,
  eventsFor,
  label,
  man,
  monthSummary,
  receivableOf,
  shareOf,
  won,
} from "@/lib/ledger"

// ---------- 그룹 지출 같아요: 정산 제안 시트 ----------
// 일정 인원과 입금 내역을 근거로 인원을 제안하고, 맞아요를 누르면 내 몫으로 반영한다.
export function GroupSuggestSheet({
  payment,
  state,
  close,
  confirm,
  notGroup,
  editPeople,
  openHistory,
}: {
  payment: Payment
  state: LedgerState
  close: () => void
  confirm: () => void
  // "그룹 지출이 아니에요" → 개인 지출로 둔다
  notGroup: () => void
  // "인원 수정" → 정산 흐름(정산표 수정)으로 이동
  editPeople: () => void
  // 반영 결과의 "내역" → 정산 내역
  openHistory?: () => void
}) {
  const [done, setDone] = useState(false)
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  const people = event?.people ? ["나", ...event.people] : (payment.group ?? ["나"])
  const deposits = payment.deposits ?? []
  // 확정 후 원장이 계산하는 내 몫과 같은 값
  const perPerson = shareOf(payment, {
    ...state,
    splitConfirmed: [...state.splitConfirmed, payment.id],
  })
  const { y, m } = payment.date
  const month = monthSummary(y, m, state)
  const sameAmount = deposits.length > 0 && deposits.every((item) => item.amount === deposits[0].amount)
  const basis = event
    ? `캘린더 '${event.title}' 참석 ${event.people?.length ?? 0}명${deposits.length > 0 ? ` + 입금 ${deposits.length}건` : ""}으로 ${people.length}명이에요`
    : `함께 결제한 ${people.length}명이에요`

  return (
    <div className="main-overlay split-overlay" onClick={close}>
      <div className="split-sheet gs-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {done ? (
          <>
            <p className="sheet-title">내 몫으로 반영했어요</p>
            <p className="sheet-sub">
              {payment.merchant} · {people.length}명 · 내 몫 {won(perPerson)}
            </p>
            <div className="split-result">
              <div>
                <span>{label(payment.date)}</span>
                <p>
                  결제 {man(dayTotal(payment.date))} <ArrowRight size={13} strokeWidth={1.8} />{" "}
                  <strong>내 지출 {man(dayMine(payment.date, state))}</strong>
                </p>
              </div>
              <div>
                <span>{m}월</span>
                <p>
                  결제 {man(month.total)} <ArrowRight size={13} strokeWidth={1.8} />{" "}
                  <strong>내 지출 {man(month.mine)}</strong>
                </p>
              </div>
            </div>
            <div className={cx("split-actions", !openHistory && "single")}>
              {openHistory && (
                <Action className="secondary-button" onClick={openHistory}>
                  내역
                </Action>
              )}
              <Action className="primary-button" onClick={close}>
                확인
              </Action>
            </div>
          </>
        ) : (
          <>
            <div className="gs-head">
              <strong>그룹 지출 같아요</strong>
              <i aria-hidden="true" />
            </div>
            <p className="gs-sub">
              {payment.merchant} {won(payment.amount)} · {label(payment.date)} {payment.time}
            </p>
            <div className="gs-people">
              {people.map((name) => (
                <div key={name}>
                  <span className={cx("gs-avatar", name === "나" && "me")}>{name.slice(0, 1)}</span>
                  <em className={cx(name === "나" && "me")}>{name}</em>
                </div>
              ))}
            </div>
            <p className="gs-basis">{basis}</p>
            <div className="gs-result">
              <span>1인당</span>
              <strong>{won(perPerson)}</strong>
              <p>
                내 몫 {won(perPerson)} · 받을 돈 {won(receivableOf(payment))}
              </p>
            </div>
            {deposits.length > 0 && (
              <p className="gs-deposit">
                입금 {deposits.length}건이 들어왔어요
                {sameAmount
                  ? ` (${payment.date.m}/${payment.date.d} ${won(deposits[0].amount)} × ${deposits.length})`
                  : ""}
              </p>
            )}
            <div className="gs-actions">
              <Action
                className="gs-yes"
                onClick={() => {
                  confirm()
                  setDone(true)
                }}
              >
                맞아요, 정산할게요
              </Action>
              <Action className="gs-edit" onClick={editPeople}>
                인원 수정
              </Action>
            </div>
            <Action className="gs-no" onClick={notGroup}>
              그룹 지출이 아니에요
            </Action>
          </>
        )}
      </div>
    </div>
  )
}
