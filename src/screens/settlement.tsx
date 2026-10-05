import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  Info,
  ReceiptText,
} from "lucide-react"
import { useState, type TouchEvent } from "react"
import {
  Action,
  PageTitle,
  PersonAvatar,
  StatusChip,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type LedgerState,
  type Payment,
  dayMine,
  dayTotal,
  eventsFor,
  groupBasis,
  initialLedger,
  label,
  man,
  monthSummary,
  payments,
  shareOf,
  won as wonFull,
} from "@/lib/ledger"
import {
  MEMBERS,
  type Member,
  settlementItems,
  settlementPeriod,
  settlementTitle,
  summarize,
  won,
} from "@/lib/settlement"

// 그룹 결제 카드에서 여는 인원 분할 시트
// 1) 분할: 같은 시간대 내 일정의 인원을 자동으로 채운다 (없으면 결제에 묶인 인원)
// 2) 반영 결과: 확인하면 그날·그달의 "결제 → 내 지출"을 보여 준다
export function GroupSplitSheet({
  payment,
  state: stateProp,
  close,
  confirm,
  openHistory,
}: {
  payment: Payment
  // 원장 상태 (연동을 끈 소스·확정한 분할 반영). 없으면 초기 원장 기준
  state?: LedgerState
  close: () => void
  confirm: () => void
  // 반영 결과의 "내역" → 마이페이지 정산 내역
  openHistory?: () => void
}) {
  const state = stateProp ?? initialLedger
  const [done, setDone] = useState(false)
  const basis = groupBasis(payment, state)
  const event = eventsFor(payment, state).find((item) => item.people?.length)
  const people = event?.people ? ["나", ...event.people] : (payment.group ?? ["나"])
  // 1인당 금액은 확정 후 원장이 계산하는 내 몫과 같은 값
  const perPerson = shareOf(payment, {
    ...state,
    splitConfirmed: [...state.splitConfirmed, payment.id],
  })
  const { y, m } = payment.date
  const month = monthSummary(y, m, state)
  return (
    <div className="main-overlay split-overlay" onClick={close}>
      <div className="split-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-grip" />
        {done ? (
          <>
            <p className="sheet-title">내 몫으로 반영했어요</p>
            <p className="sheet-sub">
              {payment.merchant} · {people.length}명 · 내 몫 {wonFull(perPerson)}
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
            <p className="sheet-title">몇 명이서 나눌까요?</p>
            <p className="sheet-sub">
              {payment.merchant} · {wonFull(payment.amount)}
            </p>
            <p className="split-basis">
              {event
                ? `내 일정 · ${event.title}에서 ${basis.count}명을 가져왔어요`
                : `결제에 함께 묶인 ${people.length}명이에요`}
            </p>
            <div className="split-people">
              {people.map((name) => (
                <div key={name}>
                  <PersonAvatar name={name as Member} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <div className="per-person">
              <span>1인당</span>
              <strong>{wonFull(perPerson)}</strong>
            </div>
            <Action
              className="primary-button"
              onClick={() => {
                confirm()
                setDone(true)
              }}
            >
              확인
            </Action>
          </>
        )}
      </div>
    </div>
  )
}

// 마이페이지 > 정산 내역
export function SettlementList({
  back,
  open,
  completed,
  state,
}: {
  back: () => void
  open: () => void
  completed: boolean
  // 있으면 인원 분할을 확정한 그룹 결제를 함께 보여 준다
  state?: LedgerState
}) {
  const summary = summarize([])
  const splits = state
    ? payments
        .filter((payment) => payment.group && state.splitConfirmed.includes(payment.id))
        .sort((a, b) => b.date.m - a.date.m || b.date.d - a.date.d)
    : []
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산 내역" />
      <div className="settlement-scroll">
        <p className="section-title settlement-list-title">그룹 지출 정산</p>
        <Action className="main-card settlement-history" onClick={open}>
          <div>
            <strong>{settlementTitle}</strong>
            <span>{settlementPeriod}</span>
            <p>
              결제 {summary.items.length}건 · {won(summary.total)}
            </p>
          </div>
          <StatusChip type={completed ? "done" : "waiting"} />
          <ChevronRight size={17} strokeWidth={1.5} />
        </Action>
        {state && (
          <>
            <p className="section-title settlement-list-title">내 몫으로 나눈 결제</p>
            {splits.length === 0 ? (
              <p className="settlement-empty">기록 없음</p>
            ) : (
              <div className="split-history">
                {splits.map((payment) => (
                  <div key={payment.id}>
                    <div>
                      <strong>{payment.merchant}</strong>
                      <span>
                        {label(payment.date)} · {payment.group?.length}명
                      </span>
                    </div>
                    <p>
                      결제 {wonFull(payment.amount)}
                      <strong>내 몫 {wonFull(shareOf(payment, state))}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function SettlementInbox({
  back,
  openTable,
  excluded,
}: {
  back: () => void
  openTable: () => void
  excluded: string[]
}) {
  const summary = summarize(excluded)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산 대기함" />
      <div className="settlement-scroll">
        <PageTitle
          sub={settlementPeriod}
          title={`${settlementTitle} 정산을\n시작할게요`}
        />
        <div className="settlement-summary">
          <div>
            <span>정산 대기</span>
            <strong>{won(summary.total)}</strong>
            <p>{summary.items.length}건의 결제 · {MEMBERS.length}명</p>
          </div>
          <div className="stacked-avatars">
            {MEMBERS.map((name) => (
              <PersonAvatar key={name} name={name} />
            ))}
          </div>
        </div>
        <p className="section-title settlement-list-title">포함된 결제</p>
        {summary.items.length === 0 && (
          <p className="settlement-empty">
            모든 결제를 제외해서 정산할 결제가 없어요. 정산표의 수정에서 다시 넣을 수 있어요
          </p>
        )}
        <div className="settlement-items">
          {summary.items.map(({ name, category, amount, payer }) => (
            <div className="settlement-item" key={name}>
              <span className="expense-icon">
                <ReceiptText size={17} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{name}</strong>
                <span className="category-chip">
                  {category} · {payer} 결제
                </span>
              </div>
              <p>{won(amount)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={openTable}>
          정산표 보기
        </Action>
      </div>
    </div>
  )
}

export function SettlementTable({
  back,
  edit,
  proceed,
  excluded,
}: {
  back: () => void
  edit: () => void
  proceed: () => void
  excluded: string[]
}) {
  const summary = summarize(excluded)
  const empty = summary.items.length === 0
  // 민지만 아직 대기 (입금 확인 시연용)
  const people = MEMBERS.map(
    (name) =>
      [name, won(summary.paid[name]), name === "민지" ? "waiting" : "done"] as const,
  )
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산표" />
      <div className="table-content">
        <div className="table-total">
          <div>
            <span>총 지출</span>
            <strong>{won(summary.total)}</strong>
          </div>
          <div>
            <span>1인당</span>
            <strong>{won(summary.perPerson)}</strong>
          </div>
        </div>
        <div className="people-settlement">
          {people.map(([name, amount, status]) => (
            <div key={name}>
              <PersonAvatar name={name} />
              <div>
                <strong>{name}</strong>
                <span>낸 금액 {amount}</span>
              </div>
              {!empty && <StatusChip type={status} />}
            </div>
          ))}
        </div>
        <div className="warning-banner">
          <Info size={16} strokeWidth={1.6} />
          <p>
            {empty
              ? `모든 결제를 제외해서 정산할 금액이 ${won(summary.total)}이에요. 수정에서 다시 넣을 수 있어요`
              : excluded.length > 0
              ? `${excluded.length}건을 제외하고 다시 계산했어요`
              : "잘못 묶인 항목이 있나요? 모임과 상관없는 결제는 제외할 수 있어요"}
          </p>
          <Action onClick={edit}>수정</Action>
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" disabled={empty} onClick={proceed}>
          {empty ? "정산할 결제가 없어요" : "정산 진행하기"}
        </Action>
      </div>
    </div>
  )
}

export function SettlementEdit({
  back,
  done,
  excluded,
}: {
  back: () => void
  done: (excluded: string[]) => void
  excluded: string[]
}) {
  const [items, setItems] = useState(
    settlementItems
      .filter((item) => !excluded.includes(item.name))
      .map((item) => [item.name, item.category, item.amount] as [string, string, number]),
  )
  const [swiped, setSwiped] = useState<number>()
  const [touchX, setTouchX] = useState<number>()
  const total = items.reduce((sum, item) => sum + item[2], 0)
  const perPerson = Math.round(total / MEMBERS.length)
  const finishSwipe = (event: TouchEvent<HTMLDivElement>, index: number) => {
    if (touchX === undefined) return
    if (event.changedTouches[0].clientX - touchX < -35) setSwiped(index)
    setTouchX(undefined)
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="항목 수정" />
      <div className="edit-banner">
        <span>
          ← 좌로 밀면 제외할 수 있어요 · 항목 제외 시 금액이 즉시 다시 계산돼요
        </span>
        <strong>1인당 {perPerson.toLocaleString()}원</strong>
      </div>
      <div className="edit-list">
        {items.length === 0 && (
          <div className="settlement-zero">
            <strong>정산할 금액이 {won(total)}이에요</strong>
            <p>
              모든 결제를 제외해서 친구에게 받을 돈도, 보낼 돈도 없어요.
              완료하면 정산을 진행하지 않아요.
            </p>
            <Action
              className="secondary-button"
              onClick={() =>
                setItems(
                  settlementItems.map(
                    (item) => [item.name, item.category, item.amount] as [string, string, number],
                  ),
                )
              }
            >
              제외한 결제 다시 넣기
            </Action>
          </div>
        )}
        {items.map(([name, category, amount], index) => (
          <div className="swipe-shell" key={name}>
            <div
              className={cx("edit-row", swiped === index && "swiped")}
              onClick={() => setSwiped(index)}
              onTouchEnd={(event) => finishSwipe(event, index)}
              onTouchStart={(event) => setTouchX(event.touches[0].clientX)}
            >
              <span className="expense-icon">
                <ReceiptText size={17} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{name}</strong>
                <span>{category}</span>
              </div>
              <p>{amount.toLocaleString()}원</p>
              <small>← 밀기</small>
            </div>
            <Action
              className="exclude-action"
              onClick={() => {
                setItems((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
                setSwiped(undefined)
              }}
            >
              제외
            </Action>
          </div>
        ))}
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          onClick={() =>
            // 남은 항목에 없는 이름이 제외된 항목 → 정산표에 반영
            done(
              settlementItems
                .map((item) => item.name)
                .filter((name) => !items.some((item) => item[0] === name)),
            )
          }
        >
          완료
        </Action>
      </div>
    </div>
  )
}

export function SettlementConfirm({
  back,
  result,
  notify,
  excluded,
  matched,
}: {
  back: () => void
  result: () => void
  notify: () => void
  excluded: string[]
  // 민지 입금까지 매칭되면 true → 결과 확인 가능
  matched: boolean
}) {
  const summary = summarize(excluded)
  const deposits = MEMBERS.filter((name) => name !== "나")
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산 확정" />
      <div className="confirm-content">
        <div className="auto-banner">
          <Check size={15} strokeWidth={2} />
          입금이 확인되면 자동으로 반영돼요. 수동으로 확인할 수도 있어요.
        </div>
        <div className="receive-card">
          <span>내가 받아야 할 금액</span>
          <strong>{won(summary.receive)}</strong>
          <p>
            내가 낸 {won(summary.paid["나"])} − 내 몫 {won(summary.perPerson)}
          </p>
          <div>
            <span>입금 현황</span>
            <strong>
              {deposits.length}명 중 {matched ? deposits.length : deposits.length - 1}명 입금 완료
            </strong>
          </div>
        </div>
        <div className="deposit-list">
          {deposits.map((name) => (
            <div key={name}>
              <PersonAvatar name={name} />
              <strong>
                {name} · {won(summary.owes[name])}
              </strong>
              {name !== "민지" || matched ? (
                <span className="deposit-done">✓ 입금 확인</span>
              ) : (
                <span className="deposit-waiting">◷ 대기 중</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="confirm-bottom">
        <Action className="secondary-button" onClick={notify}>
          친구에게 알림 보내기
        </Action>
        <Action
          className="primary-button"
          disabled={!matched}
          onClick={result}
        >
          {matched ? "결과 보기" : "입금 확인 중"}
        </Action>
      </div>
    </div>
  )
}

export function SettlementResult({
  finish,
  excluded,
}: {
  finish: () => void
  excluded: string[]
}) {
  const summary = summarize(excluded)
  return (
    <div className="main-page sub-page">
      <MainHeader title="정산 결과" />
      <div className="result-comparison">
        <span className="complete-check">
          <Check size={28} strokeWidth={2.2} />
        </span>
        <p>결제 총액</p>
        <strong className="original-total">{won(summary.total)}</strong>
        <ArrowDown size={20} strokeWidth={1.5} />
        <p>내가 실제로 쓴 돈</p>
        <strong className="actual-total">{won(summary.perPerson)}</strong>
        <span>모임 지출은 내 몫만 가계에 반영했어요</span>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={finish}>
          정산 내역으로
        </Action>
      </div>
    </div>
  )
}
