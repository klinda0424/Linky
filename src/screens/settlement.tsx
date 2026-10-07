import {
  ArrowDown,
  ArrowLeft,
  Home,
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
  groupBasis,
  initialLedger,
  label,
  man,
  payments,
  shareOf,
  won as wonFull,
} from "@/lib/ledger"
import {
  MEMBERS,
  meeting,
  settlementDeposits,
  settlementItems,
  settlementPeriod,
  settlementTitle,
  summarize,
  won,
} from "@/lib/settlement"

// 마이페이지 > 정산 내역
export function SettlementList({
  back,
  goHome,
  open,
  completed,
  state,
}: {
  back: () => void
  // 홈 알림에서 시작한 정산 흐름이 끝나면 홈으로 바로 돌아간다
  goHome?: () => void
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
      {goHome ? (
        // 왼쪽 위: 뒤로 가기 + 홈
        <div className="main-subheader st-head">
          <div className="st-head-left">
            <Action className="main-back" onClick={back} label="뒤로 가기">
              <ArrowLeft size={20} strokeWidth={1.6} />
            </Action>
            <Action className="main-back st-home" onClick={goHome} label="홈으로">
              <Home size={20} strokeWidth={1.6} />
            </Action>
          </div>
          <p>정산 내역</p>
          <span />
        </div>
      ) : (
        <MainHeader back={back} title="정산 내역" />
      )}
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

// 정산 대기함 = 그룹 결제 확인: 결제가 그룹 지출로 보이는 근거와 인원·1인당을 보여 주고 "맞아요 / 아니요"를 받는다
export function SettlementInbox({
  back,
  openTable,
  excluded,
  state: stateProp,
  notGroup,
}: {
  back: () => void
  openTable: () => void
  excluded: string[]
  state?: LedgerState
  // "아니요 → 개인 지출". 연결되어 있을 때만 버튼을 보인다
  notGroup?: () => void
}) {
  const state = stateProp ?? initialLedger
  const summary = summarize(excluded)
  const basis = meeting ? groupBasis(meeting, state) : undefined
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="그룹 결제 확인" />
      <div className="settlement-scroll">
        <PageTitle
          sub={settlementPeriod}
          title={
            meeting
              ? `${meeting.merchant} ${man(meeting.amount)}\n그룹 지출 같아요`
              : `${settlementTitle}\n그룹 지출 같아요`
          }
        />
        <div className="group-basis">
          <span>근거</span>
          {settlementDeposits.length > 0 && (
            <p>입금 {settlementDeposits.length}건이 들어왔어요</p>
          )}
          {basis && basis.detail && (
            <p>
              {basis.source} {basis.count}명 · {basis.detail}
            </p>
          )}
        </div>
        <div className="settlement-summary">
          <div>
            <span>정산 대기</span>
            <strong>{won(summary.total)}</strong>
            <p>
              1인당 {won(summary.perPerson)} · {MEMBERS.length}명
            </p>
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
      <div className={cx("main-footer", notGroup && "split-footer")}>
        {notGroup && (
          <Action className="secondary-button" onClick={notGroup}>
            아니요, 개인 지출
          </Action>
        )}
        <Action className="primary-button" onClick={openTable}>
          맞아요, 정산표 보기
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
  // 내가 낸 금액, 나머지는 결제 후 입금한 금액
  const people = MEMBERS.map((name) => {
    const deposit = settlementDeposits.find((item) => item.from === name)
    return [
      name,
      name === "나" || !deposit
        ? `낸 금액 ${won(summary.paid[name])}`
        : `입금 ${won(deposit.amount)}`,
      "done",
    ] as const
  })
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
                <span>{amount}</span>
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

// 입금 3건이 이미 들어온 상태로 시작한다. notify·matched는 MainApp 연결 호환용(사용하지 않음)
export function SettlementConfirm({
  back,
  result,
  excluded,
}: {
  back: () => void
  result: () => void
  excluded: string[]
  notify?: () => void
  matched?: boolean
}) {
  const summary = summarize(excluded)
  const deposits = MEMBERS.filter((name) => name !== "나")
  const timeOf = (name: string) => settlementDeposits.find((item) => item.from === name)?.time
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산 확정" />
      <div className="confirm-content">
        <div className="auto-banner">
          <Check size={15} strokeWidth={2} />
          입금 {settlementDeposits.length}건이 확인됐어요.
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
              {deposits.length}명 중 {deposits.length}명 입금 완료
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
              <span className="deposit-done">
                ✓ {timeOf(name) ? `${timeOf(name)} ` : ""}입금 확인
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="confirm-bottom single">
        <Action className="primary-button" onClick={result}>
          결과 보기
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
