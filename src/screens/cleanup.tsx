import { Link2, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  TODAY,
  evidenceOf,
  paymentsOn,
  restoredOf,
  won,
  type LedgerState,
  type Payment,
  type TransferGuess,
} from "@/lib/ledger"
import { transferEvidenceLine, transferQuestion } from "@/screens/transfer"

// ---------- 정리할 지출 ----------
// 오늘 결제 중 사용자가 한 번 확인해야 남는 건:
//  confirm = 근거로 복원됐지만 [맞아요]를 아직 누르지 않은 결제
//  empty   = 근거가 하나도 없어 "기록 없음"인 결제
// 송금·정산 대기 그룹 결제는 각자의 알림(링키가 찾았어요, 정산 팝업)이 맡으므로 여기서 건수에 넣지 않는다.
export type CleanupItem = { payment: Payment; kind: "confirm" | "empty" }

export function cleanupItems(state: LedgerState, skipped: string[]): CleanupItem[] {
  return paymentsOn(TODAY).flatMap((payment): CleanupItem[] => {
    if (payment.kind === "transfer" || skipped.includes(payment.id)) return []
    const pendingGroup =
      Boolean(payment.group) &&
      !state.splitConfirmed.includes(payment.id) &&
      !(state.personal ?? []).includes(payment.id)
    if (pendingGroup) return []
    const restored = restoredOf(payment, state)
    if (restored) {
      const verified = (state.verified ?? []).includes(payment.id) || restored.confirmed
      return verified ? [] : [{ payment, kind: "confirm" }]
    }
    return evidenceOf(payment, state).length === 0 ? [{ payment, kind: "empty" }] : []
  })
}

// 홈 카드: "링키가 찾았어요" 자리에 놓인다. 누르면 첫 건부터 대화로 이어진다.
export function CleanupCard({ count, open }: { count: number; open: () => void }) {
  if (count === 0) return null
  return (
    <Action
      className="hm-link"
      label="링키가 찾았어요 열기"
      onClick={open}
    >
      <Sparkles size={20} strokeWidth={1.6} />
      <span className="hm-link-text">
        <strong>링키가 찾았어요</strong>
        <small>확인할 지출 {count}건이 있어요</small>
      </span>
      <span className="hm-link-pill">확인</span>
    </Action>
  )
}

type Turn =
  | { id: string; kind: "confirm" | "empty"; payment: Payment }
  | { id: string; kind: "transfer"; payment: Payment; guess: TransferGuess }

// 챗봇 대화형: 링키가 한 건씩 묻고, 아래 답장 버튼으로 답한다. 처리한 건은 내 답장으로 남는다.
export function CleanupScreen({
  items,
  transfers = [],
  state,
  back,
  confirm,
  skip,
  edit,
  addRecord,
  confirmTransfer,
  declineTransfer,
  finish,
}: {
  // 대화가 끝났을 때 한 번 알린다 ("오늘 정리 끝" 팝업)
  finish: () => void
  items: CleanupItem[]
  // 링키가 찾은 송금 맥락: 정리할 건 뒤에 질문으로 이어 붙인다 (건마다 한 번씩)
  transfers?: { payment: Payment; guess: TransferGuess }[]
  state: LedgerState
  back: () => void
  confirm: (paymentId: string) => void
  skip: (paymentId: string) => void
  edit: (payment: Payment) => void
  addRecord: (paymentId: string) => void
  confirmTransfer: (payment: Payment) => void
  declineTransfer: (payment: Payment) => void
}) {
  // 처리해서 목록에서 빠져도 대화에는 남도록 처음 열 때의 순서를 고정해 둔다
  const [turns] = useState<Turn[]>(() => [
    ...items.map((item) => ({ id: item.payment.id, ...item })),
    ...transfers.map((item) => ({ id: item.payment.id, kind: "transfer" as const, ...item })),
  ])
  const [step, setStep] = useState(0)
  const [replies, setReplies] = useState<string[]>([])
  const pendingReply = useRef("확인했어요")
  const endRef = useRef<HTMLDivElement>(null)
  const current = turns[step]
  const waiting = replies.length > step
  const total = turns.filter((turn) => turn.kind !== "transfer").length

  // 건이 처리되어 목록에서 빠지면 내 답장을 남긴다
  useEffect(() => {
    if (!current || waiting) return
    const stillOpen =
      current.kind === "transfer"
        ? transfers.some((item) => item.payment.id === current.id)
        : items.some((item) => item.payment.id === current.id)
    if (stillOpen) return
    setReplies((value) => [...value, pendingReply.current])
    pendingReply.current = "확인했어요"
  }, [current, items, transfers, waiting])

  // 답장을 남긴 뒤 잠깐 있다가 링키가 다음 건을 묻는다
  useEffect(() => {
    if (!waiting) return
    const timer = window.setTimeout(() => setStep((value) => value + 1), 450)
    return () => window.clearTimeout(timer)
  }, [waiting, step])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [step, replies.length])

  const reply = (text: string, act: () => void) => {
    pendingReply.current = text
    act()
  }
  const shown = turns.slice(0, step + 1)
  const finished = step >= turns.length
  useEffect(() => {
    if (finished && turns.length > 0) finish()
  }, [finished])

  return (
    // 다른 화면처럼 상태바 아래(main-page)에서 시작한다. 없으면 헤더가 상태바와 겹친다
    <div className="main-page sub-page cl-page">
      <MainHeader back={back} title="링키" />
      <div className="main-scroll cl-thread">
        {total > 0 && <Linky>오늘 확인할 지출이 {total}건 있어요</Linky>}
        {shown.map((turn, index) => (
          <TurnView
            key={turn.id}
            reply={replies[index]}
            state={state}
            turn={turn}
          />
        ))}
        {finished && <Linky>오늘 정리 끝이에요</Linky>}
        <div ref={endRef} />
      </div>
      <div className="cl-chips">
        {finished ? (
          <Action className="pill primary" onClick={back}>
            홈으로
          </Action>
        ) : (
          current &&
          !waiting && (
            <ChipsFor
              addRecord={addRecord}
              confirm={confirm}
              confirmTransfer={confirmTransfer}
              declineTransfer={declineTransfer}
              edit={edit}
              reply={reply}
              skip={skip}
              turn={current}
            />
          )
        )}
      </div>
    </div>
  )
}

function Linky({ children }: { children: React.ReactNode }) {
  return (
    <div className="cl-row">
      <i className="cl-avatar">
        <Link2 size={14} strokeWidth={2.2} />
      </i>
      <div className="cl-bubble">{children}</div>
    </div>
  )
}

function TurnView({
  turn,
  reply,
  state,
}: {
  turn: Turn
  reply?: string
  state: LedgerState
}) {
  const { payment } = turn
  return (
    <>
      {turn.kind === "transfer" ? (
        <>
          <Linky>링키가 찾았어요</Linky>
          <Linky>
            <p className="cl-text">{transferQuestion(payment, turn.guess)}</p>
            <p className="cl-sub">{transferEvidenceLine(turn.guess)}</p>
          </Linky>
        </>
      ) : turn.kind === "confirm" ? (
        <ConfirmTurn payment={payment} state={state} />
      ) : (
        <Linky>
          <p className="cl-orig">{payment.time} 결제</p>
          <strong className="cl-title">{payment.merchant}</strong>
          <b className="cl-amount">{won(payment.amount)}</b>
          <p className="cl-sub">기록 없음</p>
        </Linky>
      )}
      {reply && (
        <div className="cl-row me">
          <div className="cl-bubble me">{reply}</div>
        </div>
      )}
    </>
  )
}

// 복원 결과는 근거와 함께 보여 준다 (원본 → 복원된 장소, 붙은 기록)
function ConfirmTurn({ payment, state }: { payment: Payment; state: LedgerState }) {
  const restored = restoredOf(payment, state)
  if (!restored) return null
  return (
    <Linky>
      <p className="cl-orig">
        {payment.time} · {restored.original}
      </p>
      <strong className="cl-title">
        {restored.label}
        {restored.spot ? ` · ${restored.spot}` : ""}
      </strong>
      <b className="cl-amount">{won(payment.amount)}</b>
      <ul className="cl-evidence">
        {restored.evidence.map((evidence) => (
          <li key={evidence.key}>{evidence.text}</li>
        ))}
      </ul>
    </Linky>
  )
}

function ChipsFor({
  turn,
  reply,
  confirm,
  skip,
  edit,
  addRecord,
  confirmTransfer,
  declineTransfer,
}: {
  turn: Turn
  reply: (text: string, act: () => void) => void
  confirm: (paymentId: string) => void
  skip: (paymentId: string) => void
  edit: (payment: Payment) => void
  addRecord: (paymentId: string) => void
  confirmTransfer: (payment: Payment) => void
  declineTransfer: (payment: Payment) => void
}) {
  const { payment } = turn
  if (turn.kind === "confirm")
    return (
      <>
        <Action className="pill" onClick={() => edit(payment)}>
          수정
        </Action>
        <Action
          className={cx("pill", "primary")}
          onClick={() => reply("맞아요", () => confirm(payment.id))}
        >
          맞아요
        </Action>
      </>
    )
  if (turn.kind === "empty")
    return (
      <>
        <Action
          className="pill"
          onClick={() => reply("기록 없음으로 둘게요", () => skip(payment.id))}
        >
          기록 없음으로 두기
        </Action>
        <Action
          className="pill primary"
          onClick={() => reply("앨범에서 불러왔어요", () => addRecord(payment.id))}
        >
          앨범에서 불러오기
        </Action>
      </>
    )
  return (
    <>
      <Action
        className="pill"
        onClick={() => reply("아니에요", () => declineTransfer(payment))}
      >
        아니에요
      </Action>
      <Action
        className="pill primary"
        onClick={() => reply("맞아요", () => confirmTransfer(payment))}
      >
        맞아요
      </Action>
    </>
  )
}
