import { useState } from "react"
import { ArrowDown, CalendarDays, Check, Minus, Plus, RotateCcw, UserPlus, X } from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  type LedgerState,
  type Payment,
  categoryOf,
  eventsFor,
  groupBasis,
  label,
  weekday,
  won,
} from "@/lib/ledger"

// ---------- 정산 바텀시트: 제안 → 그룹 결제 확인 → 결과(정산 완료) ----------
// 일정 인원과 입금 내역을 근거로 인원을 제안하고, 확인을 거쳐 내 몫만 가계에 반영한다.
// 정산 흐름은 전부 이 시트 안에서 이어지고, "정산 완료"를 누를 때 원장에 반영된다.
type Step = "suggest" | "edit" | "result"

// "동기 저녁 모임" + 4명 → "동기 4명 저녁 모임": 첫 단어 뒤에 인원을 끼워 넣는다
const meetingText = (title: string, count: number) => {
  const [first, ...rest] = title.split(" ")
  return rest.length > 0 ? `${first} ${count}명 ${rest.join(" ")}` : `${title} ${count}명`
}

// 사람마다 고정 틴트 (앱 아바타와 같은 색): 나 pink, 지은 blue, 민지 green, 수진 purple
const toneOf = (name: string) =>
  ({ 나: "me", 지은: "su", 민지: "min", 수진: "jin" })[name] ?? "other"

export function GroupSuggestSheet({
  payment,
  state,
  close,
  complete,
  notGroup,
  onHeadcountConfirmed,
}: {
  payment: Payment
  state: LedgerState
  close: () => void
  // 결과 단계의 "정산 완료": 내 몫을 확정하고 시트를 닫는다
  complete: () => void
  // "그룹 지출이 아니에요" · "아니요, 개인 지출" → 개인 지출로 둔다
  notGroup: () => void
  // "N명으로 확인": 뺀 사람·더한 빈 자리를 원장에 남겨 내 몫·입금 건수를 갱신한다
  onHeadcountConfirmed?: (headcount: number, edit: { removed: string[]; extras: number }) => void
}) {
  const [step, setStep] = useState<Step>("suggest")
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  const people = event?.people ? ["나", ...event.people] : (payment.group ?? ["나"])
  // 인원 수정 전 입금 내역 (바꿔 둔 입금이 있으면 그것)
  const deposits = state.depositOverride?.[payment.id] ?? payment.deposits ?? []
  // 인원 수정은 시트 안에서만 보여 주는 목업이다: 인원이 바뀌면 총액을 균등하게 나눈 값으로 보여 준다
  // 일정에 있던 사람은 X로 빼고(다시 눌러 되돌리기), 일정에 없던 사람은 +로 빈 자리를 더한다
  // 이미 인원을 고친 결제면 그 상태에서 다시 시작한다
  const saved = state.groupEdit?.[payment.id]
  const [removed, setRemoved] = useState<string[]>(saved?.removed ?? [])
  const [extras, setExtras] = useState(saved?.extras ?? 0)
  const members = people.filter((name) => !removed.includes(name))
  const headcount = members.length + extras
  const perPerson = Math.round(payment.amount / headcount)
  const receivable = payment.amount - perPerson
  // 뺀 사람의 입금은 이 결제의 입금에서 제외한다
  const activeDeposits = deposits.filter((item) => !removed.includes(item.from))
  const resetEdit = () => {
    setRemoved(saved?.removed ?? [])
    setExtras(saved?.extras ?? 0)
  }
  // −: 더한 빈 자리부터 줄이고, 없으면 마지막 사람을 뺀다 (최소 2명)
  const decrease = () => {
    if (headcount <= 2) return
    if (extras > 0) setExtras((value) => value - 1)
    else setRemoved((value) => [...value, members[members.length - 1]])
  }
  const toggleMember = (name: string) =>
    setRemoved((value) =>
      value.includes(name)
        ? value.filter((item) => item !== name)
        : headcount > 2
          ? [...value, name]
          : value,
    )
  const basis = event
    ? `캘린더 '${event.title}' 참석 ${event.people?.length ?? 0}명${deposits.length > 0 ? ` + 입금 ${deposits.length}건` : ""}으로 ${people.length}명이에요`
    : `함께 결제한 ${people.length}명이에요`
  const groupDetail = groupBasis(payment, state)
  const category = categoryOf(payment, state)?.split("·")[0]

  return (
    <div className="main-overlay split-overlay" onClick={close}>
      <div
        className={"split-sheet gs-sheet tall"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        {step === "suggest" && (
          <>
            {/* 첫 화면: ① 무슨 결제인지(크게) ② 근거 두 줄 ③ 함께한 사람·입금 ④ 1인당·내 몫 */}
            <div className="gs-body gs3">
              <span className="gs3-tag">그룹 지출 같아요</span>
              <p className="gs3-merchant">{payment.merchant}</p>
              <p className="gs3-amount">{won(payment.amount)}</p>
              <p className="gs3-meta">
                {label(payment.date)} ({weekday(payment.date)}) {payment.time} · {payment.place ?? payment.zone}
                {category ? ` · ${category}` : ""}
              </p>

              <div className="gs3-why">
                {groupDetail.detail && (
                  <p>
                    <CalendarDays size={16} strokeWidth={1.8} />
                    {meetingText(groupDetail.detail, groupDetail.count)} 한 날
                  </p>
                )}
                {activeDeposits.length > 0 && (
                  <p>
                    <Check size={16} strokeWidth={2} />
                    입금 {activeDeposits.length}건이 들어왔어요
                  </p>
                )}
              </div>

              <div className="gs3-section">
                <strong>함께한 사람 {headcount}명</strong>
                <Action className="gs3-edit" onClick={() => setStep("edit")}>
                  인원 수정
                </Action>
              </div>
              <div className="gs3-people">
                {members.map((name) => {
                  const paid = activeDeposits.find((item) => item.from === name)
                  return (
                    <div key={name}>
                      <span className={cx("gs3-avatar", toneOf(name))}>{name.slice(0, 1)}</span>
                      <b>{name}</b>
                      <small className={cx(paid && "paid")}>
                        {name === "나" ? "결제" : paid ? `${paid.time} 입금` : "입금 전"}
                      </small>
                    </div>
                  )
                })}
              </div>

              <div className="gs3-share">
                <div className="gs3-share-main">
                  <span>1인당</span>
                  <strong>{won(perPerson)}</strong>
                </div>
                <div className="gs3-share-split">
                  <div>
                    <span>내 몫</span>
                    <b>{won(perPerson)}</b>
                  </div>
                  <div>
                    <span>받을 돈</span>
                    <b>{won(receivable)}</b>
                  </div>
                </div>
              </div>
            </div>
            <div className="gs-foot split">
              <Action className="secondary-button" onClick={notGroup}>
                그룹 지출이 아니에요
              </Action>
              <Action className="primary-button" onClick={() => setStep("result")}>
                맞아요, 정산할게요
              </Action>
            </div>
          </>
        )}
        {step === "edit" && (
          <>
            <div className="gs-body">
              <div className="gs-head">
                <strong>인원 수정</strong>
                <i aria-hidden="true" />
              </div>
              <p className="gs-sub">
                {payment.merchant} {won(payment.amount)} · 함께한 인원 수를 조절해요
              </p>
              {/* 일정에 있던 사람: X로 빼고, 뺀 사람은 흐리게 남겨 다시 눌러 되돌린다. 더한 사람은 빈 자리로 보여 준다 */}
              <div className="gs-crowd">
                {people.map((name) => {
                  const out = removed.includes(name)
                  if (name === "나")
                    return (
                      <span key={name} className="gs-crowd-item">
                        <span className="gs-avatar me">{name.slice(0, 1)}</span>
                      </span>
                    )
                  return (
                    <Action
                      key={name}
                      className={cx("gs-crowd-item", out && "out")}
                      label={out ? `${name} 다시 넣기` : `${name} 빼기`}
                      onClick={() => toggleMember(name)}
                    >
                      <span className="gs-avatar">{name.slice(0, 1)}</span>
                      <i className="gs-crowd-x" aria-hidden="true">
                        {out ? <RotateCcw size={11} strokeWidth={2.4} /> : <X size={11} strokeWidth={2.6} />}
                      </i>
                    </Action>
                  )
                })}
                {Array.from({ length: extras }, (_, index) => (
                  <span key={`extra-${index}`} className="gs-crowd-item">
                    <span className="gs-avatar extra">
                      <UserPlus size={18} strokeWidth={1.6} />
                    </span>
                  </span>
                ))}
              </div>
              {removed.length > 0 && (
                <p className="gs-crowd-note">{removed.join("·")} 빠짐 · 다시 누르면 되돌려요</p>
              )}
              <div className="gs-stepper">
                <Action
                  className="gs-step-btn"
                  label="인원 줄이기"
                  onClick={decrease}
                >
                  <Minus size={20} strokeWidth={1.8} />
                </Action>
                <div>
                  <strong>{headcount}명</strong>
                  <span>나 포함</span>
                </div>
                <Action
                  className="gs-step-btn"
                  label="인원 늘리기"
                  onClick={() => headcount < 10 && setExtras((value) => value + 1)}
                >
                  <Plus size={20} strokeWidth={1.8} />
                </Action>
              </div>
              {/* 총액을 인원 수만큼 나눈 막대: 라임 칸이 내 몫 */}
              <div className="gs-split-bar" aria-hidden="true">
                {Array.from({ length: headcount }, (_, index) => (
                  <i key={index} className={cx(index === 0 && "me")} />
                ))}
              </div>
              <div className="gs-split-legend">
                <span>
                  <i className="me" /> 내 몫 {won(perPerson)}
                </span>
                <span>
                  <i /> 받을 돈 {won(receivable)}
                </span>
              </div>
              <div className="gs-result">
                <span>1인당</span>
                <strong>{won(perPerson)}</strong>
                <p>
                  총 {won(payment.amount)} ÷ {headcount}명
                </p>
              </div>
            </div>
            <div className="gs-foot split">
              <Action
                className="secondary-button"
                onClick={() => {
                  resetEdit()
                  setStep("suggest")
                }}
              >
                취소
              </Action>
              <Action className="primary-button" onClick={() => {
                onHeadcountConfirmed?.(headcount, { removed, extras })
                setStep("suggest")
              }}>
                {headcount}명으로 확인
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
