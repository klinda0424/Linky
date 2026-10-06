import { CalendarDays, Camera, MapPin } from "lucide-react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  label,
  transferGuess,
  type TransferGuess,
  weekday,
  won,
  type Evidence,
  type LedgerState,
  type Payment,
} from "@/lib/ledger"

// "김지은" → "지은": 성을 뗀 이름으로 부른다 (세 글자일 때만)
const givenName = (name: string) => (name.length === 3 ? name.slice(1) : name)

// 사진 내용 인식 문구("파스타 · 2인 세팅")에서 첫 단어만 쓴다
const subjectOf = (contents: string[]) => contents[0]?.split("·")[0]?.trim()

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

const evidenceIcon = (kind: Evidence["kind"]) =>
  kind === "location" ? MapPin : kind === "calendar" ? CalendarDays : Camera

// ---------- 링키가 찾았어요 · 송금 맥락 확인 (F2-6) ----------
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
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="링키가 찾았어요" />
      <div className="transfer-scroll">
        <div className="transfer-origin">
          <span>
            {label(payment.date)} {weekday(payment.date)}요일 {payment.time}
          </span>
          <strong>
            {payment.counterparty} {won(payment.amount)}
          </strong>
          <small>가맹점 없는 이체</small>
        </div>
        {guess ? (
          <>
            <h2 className="transfer-question">
              {transferQuestion(payment, guess)}
            </h2>
            <p className="transfer-lead">내 기록에서 이런 근거를 찾았어요.</p>
            <ul className="transfer-basis">
              {guess.evidence.map((item) => {
                const Icon = evidenceIcon(item.kind)
                return (
                  <li key={item.key}>
                    <span className="basis-icon">
                      <Icon size={15} strokeWidth={1.7} />
                    </span>
                    <div>
                      <p>{item.text}</p>
                      {item.photoIds && (
                        <div className="thumbs">
                          {item.photoIds.slice(0, 4).map((id, index) => (
                            <i className={`photo-thumb t${index % 5}`} key={id} />
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="transfer-result">
              맞아요를 누르면 이체가 <b>식비 {won(payment.amount)}</b>으로 바뀌고, 사진·일정이
              연결돼요. 원본 금액은 그대로예요.
            </p>
          </>
        ) : (
          <p className="transfer-lead">기록 없음</p>
        )}
      </div>
      {guess && (
        <div className="main-footer split-footer">
          <Action className="secondary-button" onClick={decline}>
            아니에요
          </Action>
          <Action className="primary-button" onClick={confirm}>
            맞아요
          </Action>
        </div>
      )}
    </div>
  )
}
