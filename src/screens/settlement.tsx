import { ArrowDown, Check, ChevronRight, Info, ReceiptText } from "lucide-react"
import { useState, type TouchEvent } from "react"
import {
  Action,
  PageTitle,
  PersonAvatar,
  StatusChip,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import { won as wonFull, type Payment } from "@/lib/ledger"
import {
  MEMBERS,
  type Member,
  settlementItems,
  settlementPeriod,
  settlementTitle,
  summarize,
  won,
} from "@/lib/settlement"

// 그룹 결제 카드의 뱃지를 누르면 뜨는 인원 분할 시트: 결제 → 1인당 금액
export function GroupSplitSheet({
  payment,
  close,
  confirm,
}: {
  payment: Payment
  close: () => void
  confirm: () => void
}) {
  const people = payment.group ?? ["나"]
  return (
    <div className="main-overlay" onClick={close}>
      <div className="split-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-grip" />
        <p className="sheet-title">몇 명이서 나눌까요?</p>
        <p className="sheet-sub">
          {payment.merchant} · {wonFull(payment.amount)}
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
          <strong>{wonFull(Math.round(payment.amount / people.length))}</strong>
        </div>
        <Action className="primary-button" onClick={confirm}>
          확인
        </Action>
      </div>
    </div>
  )
}

// 마이페이지 > 정산 내역
export function SettlementList({
  back,
  open,
  completed,
}: {
  back: () => void
  open: () => void
  completed: boolean
}) {
  const summary = summarize([])
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
              <StatusChip type={status} />
            </div>
          ))}
        </div>
        <div className="warning-banner">
          <Info size={16} strokeWidth={1.6} />
          <p>
            {excluded.length > 0
              ? `${excluded.length}건을 제외하고 다시 계산했어요`
              : "잘못 묶인 항목이 있나요? 모임과 상관없는 결제는 제외할 수 있어요"}
          </p>
          <Action onClick={edit}>수정</Action>
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={proceed}>
          정산 진행하기
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
