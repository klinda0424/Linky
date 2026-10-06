import { CalendarDays, ImageIcon, MapPin } from "lucide-react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  events,
  label,
  photos,
  transferGuess,
  weekday,
  type TransferGuess,
  won,
  type LedgerState,
  type Payment,
} from "@/lib/ledger"

// "김지은" → "지은": 성을 뗀 이름으로 부른다 (세 글자일 때만)
const givenName = (name: string) => (name.length === 3 ? name.slice(1) : name)

// 사진 내용 인식 문구("파스타 · 2인 세팅")에서 첫 단어만 쓴다
const subjectOf = (contents: string[]) => contents[0]?.split("·")[0]?.trim()

// 받침 유무로 조사를 고른다
const hasBatchim = (text: string) => {
  const code = text.charCodeAt(text.length - 1)
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
}

// 홈 알림·확인 화면이 같은 질문 문구를 쓴다
export function transferQuestion(payment: Payment, guess: TransferGuess) {
  const name = givenName(payment.counterparty ?? "")
  const subject = subjectOf(guess.photoContents)
  return `이 송금, ${guess.place ? `${guess.place}에서 ` : ""}${name}님과 먹은 ${subject ?? "식사"} 정산 아닌가요?`
}

// 근거 한 줄: 그날 사진 · 일정 · 체류 (사실만)
export function transferEvidenceLine(guess: TransferGuess) {
  const subject = subjectOf(guess.photoContents)
  return [
    subject ? `그날 사진 ${subject}` : undefined,
    guess.eventTitle ? `일정 '${guess.eventTitle}'` : undefined,
    guess.place ? `${guess.place} 체류` : undefined,
  ]
    .filter(Boolean)
    .join(" · ")
}

// ---------- 링키가 찾았어요 · 송금 맥락 제안 (F2-6) ----------
// 대화형: 상단 맥락 카드(언제·누구에게·얼마) → 링키의 질문 → 근거
// → 하단 고정 [아니에요][맞아요]와 누르면 어떻게 기록되는지 한 줄
export function TransferConfirm({
  payment,
  state,
  back,
  confirm,
  decline,
}: {
  payment: Payment
  state: LedgerState
  back: () => void
  confirm: () => void
  decline: () => void
}) {
  const guess = transferGuess(payment, state)
  const photoItem = guess?.evidence.find((item) => item.kind === "photo")
  const photo = photos.find((item) => item.id === photoItem?.photoIds?.[0])
  const calendarItem = guess?.evidence.find((item) => item.kind === "calendar")
  const event = events.find((item) => `cal:${item.id}` === calendarItem?.key)
  const locationItem = guess?.evidence.find((item) => item.kind === "location")
  const name = givenName(payment.counterparty ?? "")
  const subject = guess ? subjectOf(guess.photoContents) : undefined
  // "파스타 · 2인 세팅" → "19:40 파스타 사진 · 2인 세팅"
  const [what, ...rest] = photo?.content?.split("·").map((part) => part.trim()) ?? []
  const photoText = photo
    ? `${photo.time} ${what ?? photo.title} 사진${rest.length ? ` · ${rest.join(" · ")}` : ""}`
    : undefined
  const placeText = locationItem?.text.replace("내 위치 · ", "").replace(" 체류 ", " · ")

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="링키가 찾았어요" />
      <div className="tf-scroll">
        {/* 맥락: 다른 화면에 다녀와도 무엇을 묻는 화면인지 바로 알 수 있게 */}
        <section className="tf-context">
          <span>
            {label(payment.date)} ({weekday(payment.date)}) {payment.time} · 계좌 이체
          </span>
          <p>
            <strong>{payment.counterparty}</strong>님에게 보낸 <b>{won(payment.amount)}</b>
          </p>
        </section>
        <div className="tf-chat">
          {guess ? (
            <>
              <div className="tf-row">
                <span className="tf-avatar">L</span>
                <div className="tf-bubble">
                  <p>
                    {name}님과 먹은 {subject ?? "식사"}값이 맞나요?
                  </p>
                </div>
              </div>
              <div className="tf-row">
                <span className="tf-avatar hidden" />
                <div className="tf-bubble tf-evidence">
                  {photoText && (
                    <p>
                      <ImageIcon size={16} strokeWidth={1.6} />
                      {photoText}
                    </p>
                  )}
                  {event && (
                    <p>
                      <CalendarDays size={16} strokeWidth={1.6} />'{event.title}' · {event.start}
                    </p>
                  )}
                  {placeText && (
                    <p>
                      <MapPin size={16} strokeWidth={1.6} />
                      {placeText}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="tf-empty">기록 없음</p>
          )}
        </div>
      </div>
      {guess && (
        <div className="tf-bar">
          <p className="tf-result">
            맞아요 → {guess.category.split("·")[0]} {won(payment.amount)}으로 기록돼요 · 아니에요 → 이체로
            그대로 둬요
          </p>
          <Action className="tf-no" onClick={decline}>
            아니에요
          </Action>
          <Action className="tf-yes" onClick={confirm}>
            맞아요
          </Action>
        </div>
      )}
    </div>
  )
}
