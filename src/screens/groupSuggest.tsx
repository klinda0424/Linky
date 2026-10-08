import { useState } from "react"
import { ArrowDown, Check } from "lucide-react"
import { Action, PersonAvatar, cx } from "@/components/common"
import {
  type LedgerState,
  type Payment,
  categoryOf,
  eventsFor,
  groupBasis,
  label,
  man,
  receivableOf,
  shareOf,
  won,
} from "@/lib/ledger"

// ---------- 정산 바텀시트: 제안 → 그룹 결제 확인 → 결과(정산 완료) ----------
// 일정 인원과 입금 내역을 근거로 인원을 제안하고, 확인을 거쳐 내 몫만 가계에 반영한다.
// 정산 흐름은 전부 이 시트 안에서 이어지고, "정산 완료"를 누를 때 원장에 반영된다.
type Step = "suggest" | "confirm" | "result"
type Member = "나" | "지은" | "민지" | "수진"
const isMember = (name: string): name is Member => ["나", "지은", "민지", "수진"].includes(name)

// "동기 저녁 모임" + 4명 → "동기 4명 저녁 모임": 첫 단어 뒤에 인원을 끼워 넣는다
const meetingText = (title: string, count: number) => {
  const [first, ...rest] = title.split(" ")
  return rest.length > 0 ? `${first} ${count}명 ${rest.join(" ")}` : `${title} ${count}명`
}

export function GroupSuggestSheet({
  payment,
  state,
  close,
  complete,
  notGroup,
}: {
  payment: Payment
  state: LedgerState
  close: () => void
  // 결과 단계의 "정산 완료": 내 몫을 확정하고 시트를 닫는다
  complete: () => void
  // "그룹 지출이 아니에요" · "아니요, 개인 지출" → 개인 지출로 둔다
  notGroup: () => void
}) {
  const [step, setStep] = useState<Step>("suggest")
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  const people = event?.people ? ["나", ...event.people] : (payment.group ?? ["나"])
  const deposits = payment.deposits ?? []
  // 확정 후 원장이 계산하는 내 몫과 같은 값
  const perPerson = shareOf(payment, {
    ...state,
    splitConfirmed: [...state.splitConfirmed, payment.id],
  })
  const sameAmount = deposits.length > 0 && deposits.every((item) => item.amount === deposits[0].amount)
  const basis = event
    ? `캘린더 '${event.title}' 참석 ${event.people?.length ?? 0}명${deposits.length > 0 ? ` + 입금 ${deposits.length}건` : ""}으로 ${people.length}명이에요`
    : `함께 결제한 ${people.length}명이에요`
  const groupDetail = groupBasis(payment, state)
  const category = categoryOf(payment, state)?.split("·")[0]

  return (
    <div className="main-overlay split-overlay" onClick={close}>
      <div
        className={cx("split-sheet gs-sheet", step !== "suggest" && "tall")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        {step === "suggest" && (
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
              {/* 인원 수정 화면은 없앴다: 같은 인원·입금 내역을 다음 단계에서 확인한다 */}
              <Action className="gs-edit" onClick={() => setStep("confirm")}>
                인원 수정
              </Action>
              <Action className="gs-yes" onClick={() => setStep("confirm")}>
                맞아요, 정산할게요
              </Action>
            </div>
            <Action className="gs-no" onClick={notGroup}>
              그룹 지출이 아니에요
            </Action>
          </>
        )}
        {step === "confirm" && (
          <>
            <div className="gs-body">
              <p className="gs-confirm-title">
                {payment.merchant} {man(payment.amount)}원
                <br />
                그룹 지출 같아요
              </p>
              <p className="gs-sub">
                {label(payment.date)} · {payment.place ?? payment.zone} · {people.length}명
              </p>
              <div className="group-basis">
                {deposits.length > 0 && <p>입금 내역 {deposits.length}건 확인</p>}
                {groupDetail.detail && (
                  <p>{meetingText(groupDetail.detail, groupDetail.count)} 한 날</p>
                )}
              </div>
              <div className="settlement-summary">
                <div>
                  <span>정산 대기</span>
                  <strong>{won(payment.amount)}</strong>
                  <p>
                    1인당 {won(perPerson)} · {people.length}명
                  </p>
                </div>
                <div className="stacked-avatars">
                  {people.filter(isMember).map((name) => (
                    <PersonAvatar key={name} name={name} />
                  ))}
                </div>
              </div>
              {deposits.length > 0 && (
                <div className="people-settlement">
                  {deposits.map((item) => (
                    <div key={`${item.from}-${item.time}`}>
                      {isMember(item.from) ? (
                        <PersonAvatar name={item.from} />
                      ) : (
                        <span className="gs-avatar">{item.from.slice(0, 1)}</span>
                      )}
                      <div>
                        <strong>{item.from}</strong>
                        <span>{won(item.amount)}</span>
                      </div>
                      <span className="status-chip done">✓ {item.time} 입금 확인</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="section-title settlement-list-title">포함된 결제</p>
              <div className="settlement-items">
                <div className="settlement-item">
                  <div>
                    <strong>{payment.merchant}</strong>
                    <span className="category-chip">{category ? `${category} · ` : ""}나 결제</span>
                  </div>
                  <p>{won(payment.amount)}</p>
                </div>
              </div>
            </div>
            <div className="gs-foot split">
              <Action className="secondary-button" onClick={notGroup}>
                아니요, 개인 지출
              </Action>
              <Action className="primary-button" onClick={() => setStep("result")}>
                맞아요, 정산 결과 보기
              </Action>
            </div>
          </>
        )}
        {step === "result" && (
          <>
            <div className="gs-body">
              <div className="result-comparison">
                <span className="complete-check">
                  <Check size={28} strokeWidth={2.2} />
                </span>
                <p>결제 총액</p>
                <strong className="original-total">{won(payment.amount)}</strong>
                <ArrowDown size={20} strokeWidth={1.5} />
                <p>내가 실제로 쓴 돈</p>
                <strong className="actual-total">{won(perPerson)}</strong>
                <span>모임 지출은 내 몫만 가계에 반영했어요</span>
              </div>
            </div>
            <div className="gs-foot">
              <Action className="primary-button" onClick={complete}>
                정산 완료
              </Action>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
