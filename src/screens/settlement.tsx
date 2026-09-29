import {
  ArrowDown,
  Check,
  Info,
  Plane,
  Plus,
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

export const settlementItems = [
  ["항공권", "교통", 360000],
  ["숙소 에어비앤비", "숙박", 420000],
  ["렌터카", "교통", 150000],
  ["해녀 식당", "식비", 132000],
  ["성산일출봉 입장료", "관광", 15000],
  ["제주 공항 편의점", "간식", 18000],
  ["편의점 야식", "간식", 24000],
] as const
export function GroupSplitSheet({
  close,
  confirm,
}: {
  close: () => void
  confirm: () => void
}) {
  return (
    <div className="main-overlay" onClick={close}>
      <div className="split-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-grip" />
        <p className="sheet-title">몇 명이서 나눌까요?</p>
        <p className="sheet-sub">여행 일정에서 함께한 사람을 불러왔어요</p>
        <div className="split-people">
          {(["나", "수현", "민지"] as const).map((name) => (
            <div key={name}>
              <PersonAvatar name={name} />
              <span>{name}</span>
            </div>
          ))}
          <Action className="add-person">
            <Plus size={20} strokeWidth={1.5} />
          </Action>
        </div>
        <div className="per-person">
          <span>1인당</span>
          <strong>120,000원</strong>
        </div>
        <Action className="primary-button" onClick={confirm}>
          확인
        </Action>
      </div>
    </div>
  )
}
export function GroupExpenseDetail({
  back,
  confirm,
}: {
  back: () => void
  confirm: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 상세" />
      <div className="group-detail-content">
        <div className="group-total">
          <span className="icon-box blue">
            <Plane size={21} strokeWidth={1.5} />
          </span>
          <div>
            <span>결제 총액</span>
            <strong>360,000원</strong>
            <p>제주행 항공권 · 3명</p>
          </div>
        </div>
        <div className="split-result">
          <div>
            <span>내 지출</span>
            <strong>120,000원</strong>
          </div>
          <i />
          <div>
            <span>받을 돈</span>
            <strong>240,000원</strong>
          </div>
        </div>
        <div className="participant-summary">
          <p>함께 나눈 사람</p>
          <div>
            {(["나", "수현", "민지"] as const).map((name) => (
              <div key={name}>
                <PersonAvatar name={name} size="small" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ai-bottom">
        <Action className="secondary-button" onClick={back}>
          수정
        </Action>
        <Action className="primary-button" onClick={confirm}>
          맞아요
        </Action>
      </div>
    </div>
  )
}
export function SettlementInbox({
  back,
  openTable,
}: {
  back: () => void
  openTable: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산 대기함" />
      <div className="settlement-scroll">
        <PageTitle
          sub="12월 22일~24일 · 2박 3일"
          title={"제주 여행 정산을\n시작할게요"}
        />
        <div className="settlement-summary">
          <div>
            <span>정산 대기</span>
            <strong>1,119,000원</strong>
            <p>7건의 결제 · 3명</p>
          </div>
          <div className="stacked-avatars">
            {(["나", "수현", "민지"] as const).map((name) => (
              <PersonAvatar key={name} name={name} />
            ))}
          </div>
        </div>
        <p className="section-title settlement-list-title">포함된 결제</p>
        <div className="settlement-items">
          {settlementItems.map(([name, category, amount]) => (
            <div className="settlement-item" key={name}>
              <span className="expense-icon">
                <ReceiptText size={17} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{name}</strong>
                <span className="category-chip">{category}</span>
              </div>
              {name === "숙소 에어비앤비" && <StatusChip type="check" />}
              <p>{amount.toLocaleString()}원</p>
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
}: {
  back: () => void
  edit: () => void
  proceed: () => void
}) {
  const people = [
    ["나", "628,000원", "done"],
    ["수현", "250,000원", "done"],
    ["민지", "241,000원", "waiting"],
  ] as const
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="정산표" />
      <div className="table-content">
        <div className="table-total">
          <div>
            <span>총 지출</span>
            <strong>1,119,000원</strong>
          </div>
          <div>
            <span>1인당</span>
            <strong>373,000원</strong>
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
            잘못 묶인 항목이 있나요?숙소 결제 항목이 실제 3명인지 확인해보세요
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
}: {
  back: () => void
  done: () => void
}) {
  const [items, setItems] = useState(
    settlementItems.map((item) => [...item] as [string, string, number]),
  )
  const [swiped, setSwiped] = useState<number>()
  const [touchX, setTouchX] = useState<number>()
  const total = items.reduce((sum, item) => sum + item[2], 0)
  const perPerson = Math.round(total / 3)
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
        <Action className="primary-button" onClick={done}>
          완료
        </Action>
      </div>
    </div>
  )
}
export function SettlementConfirm({
  back,
  result,
}: {
  back: () => void
  result: () => void
}) {
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
          <strong>613,000원</strong>
          <p>항공권·렌터카·성산일출봉 등 대표 결제 기준</p>
          <div>
            <span>입금 현황</span>
            <strong>2명 중 1명 입금 완료</strong>
          </div>
        </div>
        <div className="deposit-list">
          <div>
            <PersonAvatar name="수현" />
            <strong>수현</strong>
            <span className="deposit-done">✓ 입금 확인</span>
          </div>
          <div>
            <PersonAvatar name="민지" />
            <strong>민지</strong>
            <span className="deposit-waiting">◷ 대기 중</span>
          </div>
        </div>
      </div>
      <div className="confirm-bottom">
        <Action className="secondary-button">친구에게 알림 보내기</Action>
        <Action className="primary-button" onClick={result}>
          결과 보기
        </Action>
      </div>
    </div>
  )
}
export function SettlementResult({ finish }: { finish: () => void }) {
  return (
    <div className="main-page sub-page">
      <MainHeader title="정산 결과" />
      <div className="result-comparison">
        <span className="complete-check">
          <Check size={28} strokeWidth={2.2} />
        </span>
        <p>결제 총액</p>
        <strong className="original-total">1,119,000원</strong>
        <ArrowDown size={20} strokeWidth={1.5} />
        <p>내가 실제로 쓴 돈</p>
        <strong className="actual-total">373,000원</strong>
        <span>여행 지출은 내 몫만 가계에 반영했어요</span>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={finish}>
          여행 돌아보기
        </Action>
      </div>
    </div>
  )
}
