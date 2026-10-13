import { useState } from "react"
import { ArrowDown, ChevronRight, Link2, Sparkles, X } from "lucide-react"
import { Action } from "@/components/common"
import {
  type LedgerState,
  type Payment,
  type TransferGuess,
  label,
  restoredOf,
  weekday,
  won,
} from "@/lib/ledger"
import { transferEvidenceLine } from "@/screens/transfer"

// ---------- 링키가 찾았어요: 송금 맥락 알림 (A 담당) ----------
// - 오늘 송금: 홈에 들어오면 가운데 팝업으로 한 번 띄운다 (TransferPopup)
// - 밀린 송금: 홈 상단에 알림 하나로 고정한다 (TransferNotice, 건별 카드 나열 없음)
// 두 곳 모두 받는 사람·금액·날짜를 함께 보인다.

export type FoundTransfer = { payment: Payment; guess: TransferGuess }

// "김지은 · 18,000원 · 10월 30일 (금) 21:30"
const factsOf = (payment: Payment) =>
  `${payment.counterparty} · ${won(payment.amount)} · ${label(payment.date)} (${weekday(payment.date)}) ${payment.time}`

// 맞아요로 확정했을 때 붙을 이름 (맥락 이름). 아직 확정 전이라 확정한 상태를 가정해 계산한다
const contextNameOf = (item: FoundTransfer, state: LedgerState) =>
  restoredOf(item.payment, {
    ...state,
    transferMatched: [...state.transferMatched, item.payment.id],
  })?.label

// 홈 상단 고정 알림: 밀린 송금이 몇 건이든 하나로 묶는다. 누르면 onClick (기본: 첫 건 확인 화면)
export function TransferNotice({
  items,
  onClick,
}: {
  items: FoundTransfer[]
  // 알림을 눌렀을 때. 다른 흐름(지출 정리 등)으로 이어 붙일 수 있게 열어 둔다
  onClick: (first: FoundTransfer, items: FoundTransfer[]) => void
}) {
  const first = items[0]
  if (!first) return null
  return (
    <Action className="hm-link tf-notice" onClick={() => onClick(first, items)}>
      <Sparkles size={20} strokeWidth={1.6} />
      <span className="hm-link-text">
        <strong>
          링키가 찾았어요 <em className="tf-notice-count">{items.length}건</em>
        </strong>
        <small>
          {factsOf(first.payment)}
          {items.length > 1 ? ` 외 ${items.length - 1}건` : ""}
        </small>
      </span>
      <ChevronRight size={18} strokeWidth={1.8} />
    </Action>
  )
}

// 오늘 송금 팝업 (2단계): 인사 → 화면 전환 → 찾은 기록과 바꿀 이름 + [수정][맞아요]. 닫으면 홈 상단 알림으로 남는다
export function TransferPopup({
  item,
  state,
  confirm,
  edit,
  close,
}: {
  item: FoundTransfer
  state: LedgerState
  // 맞아요: 맥락 이름으로 바꾼다
  confirm: () => void
  // 수정: 근거를 보고 고르는 확인 화면으로
  edit: () => void
  // 나중에: 팝업만 닫는다 (알림은 홈 상단에 남는다)
  close: () => void
}) {
  const [step, setStep] = useState<"hello" | "found">("hello")
  const { payment, guess } = item
  const name = contextNameOf(item, state)
  const evidence = transferEvidenceLine(guess)
  return (
    <div className="main-overlay center tf-popup-dim" onClick={close}>
      <div
        aria-label="링키가 찾았어요"
        className="tf-popup"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <Action className="tf-popup-close" label="나중에 보기" onClick={close}>
          <X size={18} strokeWidth={1.8} />
        </Action>
        {step === "hello" ? (
          <div className="tf-step tf-hello" key="hello">
            <span className="brand-mark tf-hello-mark">
              <Link2 size={22} strokeWidth={2.2} />
            </span>
            <p className="tf-hello-title">돌아오셨군요!</p>
            <p className="tf-hello-sub">링키가 발견한 기록이 있어요.</p>
            <Action className="primary-button" onClick={() => setStep("found")}>
              확인하기
            </Action>
          </div>
        ) : (
          <div className="tf-step tf-found" key="found">
            <p className="tf-found-facts">
              {label(payment.date)} ({weekday(payment.date)}) {payment.time},{" "}
              <b>{payment.counterparty}</b> 님께 보낸 <b>{won(payment.amount)}</b> 송금이 확인되었어요.
            </p>
            <div className="tf-rename-box">
              <span className="tf-rename-old">{payment.counterparty} 송금</span>
              <ArrowDown size={18} strokeWidth={2} aria-hidden="true" />
              <strong className="tf-rename-new">{name ?? "기록 없음"}</strong>
            </div>
            <p className="tf-found-ask">로 변경할까요?</p>
            {evidence && <p className="tf-popup-evidence">근거 · {evidence}</p>}
            <div className="tf-popup-actions">
              <Action className="secondary-button" onClick={edit}>
                수정
              </Action>
              <Action className="primary-button" onClick={confirm}>
                맞아요
              </Action>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
