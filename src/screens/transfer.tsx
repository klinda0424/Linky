import { CalendarDays, ImageIcon, Lock, MapPin } from "lucide-react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  events,
  label,
  photos,
  transferGuess,
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
const withWa = (text: string) => `${text}${hasBatchim(text) ? "과" : "와"}`
const withI = (text: string) => `${text}${hasBatchim(text) ? "이" : "가"}`

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
  // 근거 카드: 사진 · 일정 · 위치
  const photoItem = guess?.evidence.find((item) => item.kind === "photo")
  const photo = photos.find((item) => item.id === photoItem?.photoIds?.[0])
  const calendarItem = guess?.evidence.find((item) => item.kind === "calendar")
  const event = events.find((item) => `cal:${item.id}` === calendarItem?.key)
  const locationItem = guess?.evidence.find((item) => item.kind === "location")
  const parts = photo?.content?.split("·").map((part) => part.trim()) ?? []
  const photoText = photo
    ? parts.length >= 2
      ? `그날 ${photo.time} 사진에 ${withWa(parts[0])} ${withI(parts[1])} 있었어요`
      : `그날 ${photo.time} 사진에 ${withI(photo.content ?? photo.title)} 있었어요`
    : undefined
  const linked = [photo ? "사진" : undefined, event ? "일정" : undefined].filter(Boolean)
  const category = guess?.category.split("·")[0]

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="링키가 찾았어요" />
      <div className="tf-scroll">
        <section className="tf-origin">
          <div className="tf-origin-top">
            <strong>{payment.counterparty}</strong>
            <b>{won(payment.amount)}</b>
          </div>
          <div className="tf-origin-foot">
            <span className="tf-chip">가맹점 정보 없음 · 이체</span>
            <time>
              {label(payment.date)} {payment.time}
            </time>
          </div>
        </section>

        {guess ? (
          <>
            <div className="tf-dotline" aria-hidden="true">
              <i />
            </div>
            <h2 className="tf-question">{transferQuestion(payment, guess)}</h2>

            <h3 className="tf-title">링키가 확인한 기록</h3>
            <div className="tf-records">
              {photo && (
                <div className="tf-record">
                  <span className="tf-thumb">
                    <ImageIcon size={26} strokeWidth={1.4} />
                  </span>
                  <div>
                    <small>사진</small>
                    <p>{photoText}</p>
                  </div>
                </div>
              )}
              {event && (
                <div className="tf-record">
                  <span className="tf-icon">
                    <CalendarDays size={20} strokeWidth={1.6} />
                  </span>
                  <div>
                    <small>일정</small>
                    <p>
                      '{event.title}' {event.start}
                    </p>
                  </div>
                </div>
              )}
              {locationItem && (
                <div className="tf-record">
                  <span className="tf-icon">
                    <MapPin size={20} strokeWidth={1.6} />
                  </span>
                  <div>
                    <small>위치</small>
                    <p>{locationItem.text.replace("내 위치 · ", "")}</p>
                  </div>
                </div>
              )}
            </div>

            <Action className="tf-yes" onClick={confirm}>
              맞아요, {category}로 분류
            </Action>
            <Action className="tf-no" onClick={decline}>
              아니에요, 이체로 둘게요
            </Action>

            <section className="tf-after">
              <small>확인하면 이렇게 기록돼요</small>
              <p>
                이체 <span aria-hidden="true">→</span> <b>{category} {won(payment.amount)}</b>
              </p>
              {linked.length > 0 && (
                <em>
                  {linked.length === 2 ? "사진과 일정이" : `${linked[0]}이`} 연결돼요
                </em>
              )}
            </section>
          </>
        ) : (
          <p className="tf-empty">기록 없음</p>
        )}

        <p className="tf-privacy">
          <Lock size={15} strokeWidth={1.6} /> 사진 원본은 서버로 올라가지 않아요
        </p>
      </div>
    </div>
  )
}
