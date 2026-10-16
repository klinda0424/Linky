import {
  Bus,
  CalendarDays,
  Camera,
  ImagePlus,
  Link2,
  MapPin,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Utensils,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  TODAY,
  type Category,
  type Evidence,
  categoryOf,
  evidenceOf,
  label as dateLabel,
  paymentsOn,
  restoredOf,
  weekday,
  won,
  type LedgerState,
  type Payment,
  type TransferGuess,
} from "@/lib/ledger"
import { AlbumArtwork, pickedArt } from "@/screens/record"
import { transferQuestion } from "@/screens/transfer"
import { type FoundGroup } from "@/screens/transferNotice"

// ---------- 정리할 지출 ----------
// 밀린 기록 정리: 오늘 이전 최근 7일(10/24~10/30) 결제 중 사용자가 한 번 확인해야 남는 건
//  confirm = 근거로 복원됐지만 [맞아요]를 아직 누르지 않은 결제
//  empty   = 근거가 하나도 없어 "기록 없음"인 결제
// 오늘 건은 홈 진입 팝업이 맡는다. 송금·정산 대기 그룹 결제는 각자의 흐름이 맡으므로 여기서 건수에 넣지 않는다.
export type CleanupItem = { payment: Payment; kind: "confirm" | "empty" }
export const CLEANUP_DAYS = 7
const pastDays = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(TODAY.y, TODAY.m - 1, TODAY.d - count + index)
    return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }
  })

export function cleanupItems(state: LedgerState, skipped: string[]): CleanupItem[] {
  return pastDays(CLEANUP_DAYS).flatMap((day) => paymentsOn(day)).flatMap((payment): CleanupItem[] => {
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

// 정렬용 "2026-10-28 12:30"
const pad = (value: number) => String(value).padStart(2, "0")
const whenOf = (payment: Payment) =>
  `${payment.date.y}-${pad(payment.date.m)}-${pad(payment.date.d)} ${payment.time.padStart(5, "0")}`

type Turn =
  | { id: string; kind: "confirm" | "empty"; payment: Payment }
  | { id: string; kind: "transfer"; payment: Payment; guess: TransferGuess }
  | { id: string; kind: "group"; payment: Payment; facts: string[] }

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
  editTransfer,
  groups = [],
  openGroup,
  markPersonal,
  finish,
}: {
  // 확인하지 않은 그룹 결제(오늘 것과 지난 7일 것): 송금 다음에 이어 붙인다 (정산은 정산 시트에서)
  groups?: FoundGroup[]
  openGroup: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  // 대화가 끝났을 때 한 번 알린다 ("정리 끝" 팝업)
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
  // 송금 [수정]: 근거를 보고 고르는 확인 화면으로 (끝나면 이 대화로 돌아온다)
  editTransfer: (payment: Payment) => void
}) {
  // 처리해서 목록에서 빠져도 대화에는 남도록 처음 열 때의 순서를 고정해 둔다
  // 종류와 상관없이 오래된 날짜·시각부터 묻는다 (10/28 → 10/30)
  const [turns] = useState<Turn[]>(() =>
    [
      ...items.map((item) => ({ id: item.payment.id, ...item })),
      ...transfers.map((item) => ({ id: item.payment.id, kind: "transfer" as const, ...item })),
      ...groups.map((item) => ({ id: item.payment.id, kind: "group" as const, ...item })),
    ].sort((a, b) => whenOf(a.payment).localeCompare(whenOf(b.payment))),
  )
  const [step, setStep] = useState(0)
  const [replies, setReplies] = useState<string[]>([])
  const pendingReply = useRef("확인했어요")
  const endRef = useRef<HTMLDivElement>(null)
  const current = turns[step]
  const waiting = replies.length > step

  // 건이 처리되어 목록에서 빠지면 내 답장을 남긴다
  useEffect(() => {
    if (!current || waiting) return
    const stillOpen =
      current.kind === "transfer"
        ? transfers.some((item) => item.payment.id === current.id)
        : current.kind === "group"
          ? groups.some((item) => item.payment.id === current.id)
          : items.some((item) => item.payment.id === current.id)
    if (stillOpen) return
    setReplies((value) => [...value, pendingReply.current])
    pendingReply.current = "확인했어요"
  }, [current, items, transfers, groups, waiting])

  // 답장을 남긴 뒤 잠깐 있다가 링키가 다음 건을 묻는다
  useEffect(() => {
    if (!waiting) return
    // 내 답장과 링키의 마무리 말을 읽을 시간을 두고 다음 건을 묻는다
    const timer = window.setTimeout(() => setStep((value) => value + 1), 900)
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
        {turns.length > 0 && (
          <Linky>
            <p className="cl-plain">
              아직 확인하지 못한 기록이 <b>{turns.length}건</b> 있어요. 하나씩 같이 볼게요.
            </p>
          </Linky>
        )}
        {shown.map((turn, index) => (
          <TurnView
            key={turn.id}
            reply={replies[index]}
            state={state}
            turn={turn}
          />
        ))}
        {finished && <Linky>확인하지 못한 기록을 모두 정리했어요</Linky>}
        <div ref={endRef} />
      </div>
      <div className="cl-chips">
        {finished ? (
          <Action className="primary-button cl-home" onClick={back}>
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
              editTransfer={editTransfer}
              markPersonal={markPersonal}
              openGroup={openGroup}
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

function Linky({ children, card }: { children: React.ReactNode; card?: boolean }) {
  return (
    <div className="cl-row">
      <i className="cl-avatar">
        <Link2 size={14} strokeWidth={2.2} />
      </i>
      <div className={card ? "cl-bubble cl-card" : "cl-bubble"}>{children}</div>
    </div>
  )
}

// 홈 "오늘 지출" 행과 같은 모양: 분류 아이콘 · 이름 · 날짜·시각 · 금액
const categoryIcon: Record<Category, typeof Utensils> = {
  "식비·카페": Utensils,
  쇼핑: ShoppingBag,
  "문화·여가": Ticket,
  "생활·기타": Package,
  교통: Bus,
}
function PayRow({ payment, state, name }: { payment: Payment; state: LedgerState; name: string }) {
  const category = categoryOf(payment, state)
  const Icon = category ? categoryIcon[category] : Receipt
  return (
    <div className="hm-today-row cl-payrow">
      <span className="hm-today-icon">
        <Icon size={20} strokeWidth={1.6} />
      </span>
      <div>
        <strong>{name}</strong>
        <small>
          {dateLabel(payment.date)} ({weekday(payment.date)}) · {payment.time}
        </small>
      </div>
      <b>{won(payment.amount)}</b>
    </div>
  )
}

// 근거 한 줄씩: 위치·일정·사진 아이콘 + 사실
const evidenceIcon = { location: MapPin, calendar: CalendarDays, photo: Camera, added: ImagePlus }
function EvidenceList({ items }: { items: Evidence[] }) {
  if (items.length === 0) return null
  return (
    <ul className="cl-evidence2">
      {items.map((item) => {
        const Icon = evidenceIcon[item.kind]
        return (
          <li key={item.key}>
            <Icon size={14} strokeWidth={1.8} />
            <span>{item.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

// 링키의 질문: 복원된 장소·이동을 사실로 묻는다 (추측·평가 없이)
function questionOf(payment: Payment, state: LedgerState) {
  const restored = restoredOf(payment, state)
  if (!restored) return undefined
  if (payment.transit) return `${payment.transit.from} 인근에서 택시를 타셨나요?`
  return `${restored.spot ? `${restored.spot} ` : ""}${restored.label}에서 결제하셨나요?`
}

// 대화 한 건: 결제 사실 → 링키의 질문(+근거) → 내 답장 → 링키의 마무리
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
  if (turn.kind === "group")
    return (
      <>
        <Linky card>
          <PayRow name={payment.merchant} payment={payment} state={state} />
          <p className="cl-ask">그룹 지출 같아요</p>
          {turn.facts.length > 0 && (
            <ul className="cl-evidence2">
              {turn.facts.map((fact) => (
                <li key={fact}>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          )}
        </Linky>
        {reply && (
          <div className="cl-row me">
            <div className="cl-bubble me">{reply}</div>
          </div>
        )}
        {reply === "개인 지출이에요" && <Linky>알겠어요. 개인 지출로 둘게요.</Linky>}
        {reply === "정산했어요" && <Linky>내 몫만 가계에 반영했어요.</Linky>}
      </>
    )
  const restored = restoredOf(payment, state)
  const original = turn.kind === "transfer" ? `${payment.counterparty} 송금` : payment.merchant
  const question =
    turn.kind === "transfer"
      ? transferQuestion(payment, turn.guess)
      : turn.kind === "confirm"
        ? questionOf(payment, state)
        : "이 결제를 설명할 기록이 아직 없어요."
  const evidence =
    turn.kind === "transfer" ? turn.guess.evidence : turn.kind === "confirm" ? (restored?.evidence ?? []) : []
  // 앨범에서 불러온 사진: 이 결제에 마지막으로 붙인 기록
  const added = reply === "앨범에서 불러왔어요" ? state.added[payment.id]?.at(-1) : undefined
  const pickedPhoto = added
    ? { art: pickedArt(added.text), time: added.text.match(/\d{2}:\d{2}/)?.[0] }
    : undefined
  // 마무리: 맞아요면 바뀐 이름 카드, 그 밖에는 한 줄
  const renamed = reply === "맞아요" && restored ? restored.label : undefined
  const closing =
    reply === "아니에요"
      ? "알겠어요. 송금으로 그대로 둘게요."
      : reply === "기록 없음으로 둘게요"
        ? "알겠어요. '기록 없음'으로 둘게요."
        : reply === "앨범에서 불러왔어요"
          ? "사진을 근거로 붙였어요."
          : undefined
  return (
    <>
      <Linky card>
        <PayRow name={original} payment={payment} state={state} />
        {/* 앨범에서 불러왔으면 "기록 없음" 질문 자리에 고른 사진을 넣는다 */}
        {pickedPhoto ? (
          <div className="cl-photo">
            {pickedPhoto.art ? <AlbumArtwork art={pickedPhoto.art} wide /> : <ImagePlus size={22} strokeWidth={1.6} />}
            <small>
              추가한 사진{pickedPhoto.time ? ` · ${pickedPhoto.time}` : ""}
            </small>
          </div>
        ) : (
          <>
            <p className="cl-ask">{question}</p>
            <EvidenceList items={evidence} />
            {turn.kind === "empty" && <p className="cl-why">그때 찍은 사진이 있으면 붙여 둘 수 있어요.</p>}
          </>
        )}
      </Linky>
      {reply && (
        <div className="cl-row me">
          <div className="cl-bubble me">{reply}</div>
        </div>
      )}
      {renamed && (
        <Linky card>
          <p className="cl-plain">그러면 이렇게 바꿔 둘게요.</p>
          <div className="cl-rename">
            <s>{original}</s>
            <span aria-hidden="true">→</span>
            <strong>{renamed}</strong>
          </div>
        </Linky>
      )}
      {closing && <Linky>{closing}</Linky>}
    </>
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
  editTransfer,
  openGroup,
  markPersonal,
}: {
  turn: Turn
  editTransfer: (payment: Payment) => void
  openGroup: (payment: Payment) => void
  markPersonal: (paymentId: string) => void
  reply: (text: string, act: () => void) => void
  confirm: (paymentId: string) => void
  skip: (paymentId: string) => void
  edit: (payment: Payment) => void
  addRecord: (paymentId: string) => void
  confirmTransfer: (payment: Payment) => void
  declineTransfer: (payment: Payment) => void
}) {
  const { payment } = turn
  if (turn.kind === "group")
    return (
      <>
        <Action
          className="secondary-button"
          onClick={() => reply("개인 지출이에요", () => markPersonal(payment.id))}
        >
          개인 지출이에요
        </Action>
        <Action
          className="primary-button"
          onClick={() => reply("정산했어요", () => openGroup(payment))}
        >
          정산하러 가기
        </Action>
      </>
    )
  if (turn.kind === "confirm")
    return (
      <>
        <Action className="secondary-button" onClick={() => edit(payment)}>
          수정
        </Action>
        <Action
          className="primary-button"
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
          className="secondary-button"
          onClick={() => reply("기록 없음으로 둘게요", () => skip(payment.id))}
        >
          기록 없음으로 두기
        </Action>
        <Action
          className="primary-button"
          onClick={() => reply("앨범에서 불러왔어요", () => addRecord(payment.id))}
        >
          앨범에서 불러오기
        </Action>
      </>
    )
  return (
    <>
      <Action className="secondary-button" onClick={() => editTransfer(payment)}>
        수정
      </Action>
      <Action
        className="secondary-button"
        onClick={() => reply("아니에요", () => declineTransfer(payment))}
      >
        아니에요
      </Action>
      <Action
        className="primary-button"
        onClick={() => reply("맞아요", () => confirmTransfer(payment))}
      >
        맞아요
      </Action>
    </>
  )
}
