import { useLayoutEffect, useRef, useState } from "react"
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
  total,
  onClick,
}: {
  items: FoundTransfer[]
  // 함께 정리할 다른 밀린 기록까지 합친 건수 (없으면 송금 건수)
  total?: number
  // 알림을 눌렀을 때. 다른 흐름(지출 정리 등)으로 이어 붙일 수 있게 열어 둔다
  onClick: (first: FoundTransfer, items: FoundTransfer[]) => void
}) {
  const first = items[0]
  if (!first) return null
  const count = total ?? items.length
  return (
    <Action className="hm-link tf-notice" onClick={() => onClick(first, items)}>
      <Sparkles size={20} strokeWidth={1.6} />
      <span className="hm-link-text">
        <strong>
          링키가 찾았어요 <em className="tf-notice-count">{count}건</em>
        </strong>
        <small>
          {factsOf(first.payment)}
          {count > 1 ? ` 외 ${count - 1}건` : ""}
        </small>
      </span>
      <ChevronRight size={18} strokeWidth={1.8} />
    </Action>
  )
}

// 오늘 찾은 기록을 홈 진입 때 한 팝업으로 이어 보여 준다 (팝업이 연달아 뜨지 않게):
// 인사 → (오늘 송금이 있으면) 찾은 송금·바꿀 이름 → (오늘 그룹 결제가 있으면) 무슨 결제인지·그룹 지출 같아요
// 닫으면 홈 상단 알림·그룹 지출 알림으로 다시 열 수 있다
export type FoundGroup = {
  payment: Payment
  // 근거 사실 두 줄: "입금 내역 3건 확인", "동기 4명 저녁 모임 한 날"
  facts: string[]
}

export function TransferPopup({
  item,
  group,
  state,
  confirm,
  edit,
  openGroup,
  close,
}: {
  item?: FoundTransfer
  group?: FoundGroup
  state: LedgerState
  // 맞아요: 맥락 이름으로 바꾼다 (다음 단계가 있으면 팝업에 머문다)
  confirm: (item: FoundTransfer, last: boolean) => void
  // 수정: 근거를 보고 고르는 확인 화면으로
  edit: (item: FoundTransfer) => void
  // 정산하러 가기: 그룹 지출 시트로
  openGroup: (payment: Payment) => void
  // 나중에: 팝업만 닫는다
  close: () => void
}) {
  // 단계 목록은 팝업을 열 때 고정한다. 송금을 맞아요로 확정하면 item이 빠지지만, 그룹 단계는 그대로 "2 / 2"로 보인다
  const [steps] = useState(
    () => [item && "found", group && "group"].filter(Boolean) as Array<"found" | "group">,
  )
  const [step, setStep] = useState<"hello" | "found" | "group">("hello")
  const next = () => {
    const index = step === "hello" ? 0 : steps.indexOf(step as "found" | "group") + 1
    if (steps[index]) setStep(steps[index])
    else close()
  }
  const isLast = (current: "found" | "group") => steps.indexOf(current) === steps.length - 1
  // 1 / 2 → 2 / 2로 넘어가도 팝업 크기가 변하지 않게, 지금까지 보인 단계 중 가장 큰 높이를 최소 높이로 둔다 (인사 단계는 제외)
  const popupRef = useRef<HTMLDivElement>(null)
  const [minHeight, setMinHeight] = useState<number>()
  useLayoutEffect(() => {
    if (step === "hello" || !popupRef.current) return
    const height = popupRef.current.offsetHeight
    setMinHeight((value) => Math.max(value ?? 0, height))
  }, [step])
  return (
    <div className="main-overlay center tf-popup-dim" onClick={close}>
      <div
        aria-label="링키가 찾았어요"
        className="tf-popup"
        ref={popupRef}
        style={step === "hello" ? undefined : { minHeight }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <Action className="tf-popup-close" label="나중에 보기" onClick={close}>
          <X size={18} strokeWidth={1.8} />
        </Action>
        {step === "hello" && (
          <div className="tf-step tf-hello" key="hello">
            <span className="brand-mark tf-hello-mark">
              <Link2 size={18} strokeWidth={2.2} />
            </span>
            <p className="tf-hello-title">돌아오셨군요!</p>
            <p className="tf-hello-sub">
              링키가 발견한 기록이 {steps.length > 1 && <b>{steps.length}건</b>} 있어요.
            </p>
            <Action className="primary-button" onClick={next}>
              확인하기
            </Action>
          </div>
        )}
        {step === "found" && item && (
          <div className="tf-step tf-found" key="found">
            {steps.length > 1 && <p className="tf-step-count">1 / {steps.length}</p>}
            <p className="tf-found-facts">
              {label(item.payment.date)} ({weekday(item.payment.date)}) {item.payment.time},{" "}
              <b>{item.payment.counterparty}</b> 님께 보낸 <b>{won(item.payment.amount)}</b> 송금이
              확인되었어요.
            </p>
            <div className="tf-rename-box">
              <span className="tf-rename-old">{item.payment.counterparty} 송금</span>
              <ArrowDown size={18} strokeWidth={2} aria-hidden="true" />
              <strong className="tf-rename-new">{contextNameOf(item, state) ?? "기록 없음"}</strong>
            </div>
            <p className="tf-found-ask">로 변경할까요?</p>
            {transferEvidenceLine(item.guess) && (
              <p className="tf-popup-evidence">근거 · {transferEvidenceLine(item.guess)}</p>
            )}
            <div className="tf-popup-actions">
              <Action className="secondary-button" onClick={() => edit(item)}>
                수정
              </Action>
              <Action
                className="primary-button"
                onClick={() => {
                  const last = isLast("found")
                  confirm(item, last)
                  if (!last) next()
                }}
              >
                맞아요
              </Action>
            </div>
          </div>
        )}
        {step === "group" && group && (
          <div className="tf-step tf-found" key="group">
            {steps.length > 1 && <p className="tf-step-count">{steps.indexOf("group") + 1} / {steps.length}</p>}
            <p className="tf-found-facts">
              {label(group.payment.date)} ({weekday(group.payment.date)}) {group.payment.time},{" "}
              <b>{group.payment.merchant}</b>에서 결제한 <b>{won(group.payment.amount)}</b>
            </p>
            <div className="tf-rename-box tf-group-box">
              <strong className="tf-rename-new">그룹 지출 같아요</strong>
              {group.facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <div className="tf-popup-actions">
              <Action className="secondary-button" onClick={close}>
                나중에
              </Action>
              <Action className="primary-button" onClick={() => openGroup(group.payment)}>
                정산하러 가기
              </Action>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
