import { useState } from "react"
import {
  ArrowDown,
  Check,
  ChevronRight,
  Map,
  Refrigerator,
  Shirt,
  Sparkles,
} from "lucide-react"
import {
  Action,
  Badge,
  PageTitle,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type TodayExpense, todayExpenses } from "@/lib/today"

const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`

// 홈 "오늘" 지출의 옷 결제를 구매처별로 묶는다. 따로 결제한 건들을 한 구매처 아래에 모은다.
// 홈(home.tsx)의 오늘 지출 목록과 이 화면의 지출 상세가 같은 묶음을 쓴다.
export function shoppingGroups() {
  const groups: Array<{
    merchant: string
    items: TodayExpense[]
    total: number
  }> = []
  for (const expense of todayExpenses) {
    if (expense.category !== "쇼핑") continue
    let group = groups.find((item) => item.merchant === expense.merchant)
    if (!group) {
      group = { merchant: expense.merchant, items: [], total: 0 }
      groups.push(group)
    }
    group.items.push(expense)
    group.total += expense.amount
  }
  return groups
}

// 같은 옷은 지출 상세와 옷장에서 같은 색으로 보인다.
const closetVisuals = ["dress", "cardigan", "scarf", "coat"]
const closetVisual = (name: string) => {
  const index = todayExpenses
    .filter((expense) => expense.category === "쇼핑")
    .findIndex((expense) => expense.name === name)
  return closetVisuals[Math.max(index, 0) % closetVisuals.length]
}

// U3-1 구매항목 복원: 결제 내역(구매처·금액)에서 찾아낸 상품명과 수정 후보
const restoredNames: Record<string, string> = { 원피스: "원피스 (블랙 · M)" }
const itemCandidates: Record<string, string[]> = {
  원피스: ["원피스 (블랙 · M)", "원피스 (아이보리 · M)"],
  블라우스: ["블라우스", "셔츠"],
  "니트 가디건": ["니트 가디건", "니트 조끼"],
  "플리츠 스커트": ["플리츠 스커트", "미니 스커트"],
  "와이드 데님": ["와이드 데님", "스트레이트 데님"],
}
const travelItem = "원피스"

// U3-1 분기(수락/거절)는 이 파일 안에서 옷장(U3-2)으로 넘어간다.
export function ExpenseDetail({
  back,
  merchant,
  onTag,
}: {
  back: () => void
  // 홈에서 누른 구매처. 없으면 U3-1 대상(원피스)이 있는 구매처를 연다.
  merchant?: string
  // 여행 태그 수락(true)/거절(false) 알림 (UT 성공 지점 기록용)
  onTag?: (tagged: boolean) => void
}) {
  const groups = shoppingGroups()
  const group =
    groups.find((item) => item.merchant === merchant) ??
    groups.find((item) =>
      item.items.some((expense) => expense.name === travelItem),
    ) ??
    groups[0]
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      group.items.map((expense) => [
        expense.name,
        restoredNames[expense.name] ?? expense.name,
      ]),
    ),
  )
  const [editing, setEditing] = useState<string>()
  const [edited, setEdited] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [done, setDone] = useState<{ tagged?: boolean }>()
  const hasTravelItem = group.items.some(
    (expense) => expense.name === travelItem,
  )
  if (done)
    return (
      <ClosetPage
        added={{ merchant: group.merchant, names, tagged: done.tagged }}
        back={back}
      />
    )
  const finishEdit = (key: string) => {
    setNames((current) => ({ ...current, [key]: draft.trim() }))
    setEdited((current) => (current.includes(key) ? current : [...current, key]))
    setEditing(undefined)
  }
  const times = group.items
    .map((expense) => expense.time)
    .sort()
    .join(" · ")
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 상세" />
      <div className="detail-scroll">
        <div className="restored-product">
          <p>
            {group.merchant} {won(group.total)} · 결제 {group.items.length}건
          </p>
          <ArrowDown size={18} strokeWidth={1.5} />
          <p className="restored-caption">
            {edited.length
              ? "고친 이름으로 바꿨어요"
              : `구매 항목 ${group.items.length}개를 찾았어요`}
          </p>
        </div>
        <div className="restored-list">
          {group.items.map((expense) => (
            <div className="restored-item" key={expense.name}>
              <div className="restored-item-row">
                <span
                  className={cx("restored-thumb", closetVisual(expense.name))}
                >
                  <Shirt size={20} strokeWidth={1.4} />
                </span>
                <div className="restored-item-text">
                  <strong>
                    {editing === expense.name
                      ? draft || " "
                      : names[expense.name]}
                  </strong>
                  <span>
                    {expense.time} · {won(expense.amount)}
                  </span>
                </div>
                {editing !== expense.name && (
                  <Action
                    className="product-edit"
                    disabled={editing !== undefined}
                    onClick={() => {
                      setDraft(names[expense.name])
                      setEditing(expense.name)
                    }}
                  >
                    수정
                  </Action>
                )}
              </div>
              {editing === expense.name && (
                <div className="restored-editor">
                  <div className="suggestion-chips">
                    {(itemCandidates[expense.name] ?? [expense.name]).map(
                      (candidate) => (
                        <Action
                          className={cx(
                            "suggestion-chip",
                            draft === candidate && "selected",
                          )}
                          key={candidate}
                          onClick={() => setDraft(candidate)}
                        >
                          {candidate}
                        </Action>
                      ),
                    )}
                  </div>
                  <input
                    aria-label={`${expense.name} 이름`}
                    className="product-input"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="직접 입력"
                    value={draft}
                  />
                  <div className="restored-editor-actions">
                    <Action
                      className="mini-secondary"
                      onClick={() => setEditing(undefined)}
                    >
                      취소
                    </Action>
                    <Action
                      className="mini-primary"
                      disabled={!draft.trim()}
                      onClick={() => finishEdit(expense.name)}
                    >
                      완료
                    </Action>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="detail-info">
          {[
            ["결제일시", `12월 12일 ${times}`],
            ["카테고리", "쇼핑 > 의류"],
            ["결제수단", "토스카드"],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="location-card">
          <span className="map-thumb">
            <Map size={28} strokeWidth={1.2} />
          </span>
          <div>
            <strong>온라인 결제</strong>
            <span>{group.merchant} 앱</span>
          </div>
        </div>
        {hasTravelItem && (
          <div className="tag-suggestion">
            <span className="connect-icon">
              <Sparkles size={18} strokeWidth={1.5} />
            </span>
            <p>제주 여행 준비로 묶어둘 수 있어요</p>
            <span className="tag-reason">
              {names[travelItem]} · 12월 22일 제주 여행 열흘 전에 산 옷이에요
            </span>
          </div>
        )}
      </div>
      {hasTravelItem ? (
        <div className="ai-bottom">
          <Action
            className="secondary-button"
            disabled={editing !== undefined}
            onClick={() => {
              onTag?.(false)
              setDone({ tagged: false })
            }}
          >
            아니요
          </Action>
          <Action
            className="primary-button"
            disabled={editing !== undefined}
            onClick={() => {
              onTag?.(true)
              setDone({ tagged: true })
            }}
          >
            여행으로 묶기
          </Action>
        </div>
      ) : (
        <div className="ai-bottom single">
          <Action
            className="primary-button"
            disabled={editing !== undefined}
            onClick={() => setDone({})}
          >
            옷장에 넣기
          </Action>
        </div>
      )}
    </div>
  )
}
export function ShoppingStorage({
  back,
  closet,
  fridge,
}: {
  back: () => void
  closet: () => void
  fridge: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="쇼핑 보관함" />
      <div className="shopping-hub">
        <PageTitle
          sub="구매한 물건을 종류별로 모아봤어요"
          title="어디를 열어볼까요?"
        />
        <Action className="storage-card" onClick={closet}>
          <span className="icon-box purple">
            <Shirt size={21} strokeWidth={1.5} />
          </span>
          <div>
            <strong>옷장</strong>
            <p>옷과 패션 아이템 {closetCount}개</p>
          </div>
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
        <Action className="storage-card" onClick={fridge}>
          <span className="icon-box green">
            <Refrigerator size={21} strokeWidth={1.5} />
          </span>
          <div>
            <strong>냉장고</strong>
            <p>최근 구매한 식재료 4개</p>
          </div>
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
      </div>
    </div>
  )
}
// 옷장은 홈 "오늘"(12월 12일) 지출의 옷 결제와 같은 데이터를 쓴다(lib/today.ts).
// 원피스는 U3-1에서 태그를 정한 항목이고, 나머지는 시험기간 자동 묶음에 들어간다.
type ClosetAdded = {
  merchant: string
  // 지출 상세에서 복원·수정한 상품명 (원래 이름 → 보여줄 이름)
  names: Record<string, string>
  // 원피스 여행 태그 결정. 원피스가 없는 구매처면 undefined
  tagged?: boolean
}
const earlierClothes = [{ name: "롱 코트", date: "11월 19일 구매" }]

function closetItems(added?: ClosetAdded) {
  const today = todayExpenses
    .filter((expense) => expense.category === "쇼핑")
    .map((expense) => {
      const fromDetail = added?.merchant === expense.merchant
      return {
        key: `today-${expense.name}`,
        name: (fromDetail && added?.names[expense.name]) || expense.name,
        date: `12월 12일 · ${expense.merchant}`,
        tag:
          expense.name === travelItem && added?.tagged !== false
            ? "제주 여행"
            : "시험기간",
        visual: closetVisual(expense.name),
        isNew: added ? fromDetail : expense.name === travelItem,
      }
    })
  const earlier = earlierClothes.map((cloth, index) => ({
    key: `earlier-${index}`,
    name: cloth.name,
    date: cloth.date,
    tag: "",
    visual: closetVisuals[(today.length + index) % closetVisuals.length],
    isNew: false,
  }))
  return [...today, ...earlier]
}
const closetCount = closetItems().length

export function ClosetPage({
  back,
  added,
}: {
  back: () => void
  added?: ClosetAdded
}) {
  const [filter, setFilter] = useState("전체")
  const items = closetItems(added)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="옷장" />
      <div className="closet-content">
        {added && (
          <div className="closet-notice">
            <Check size={14} strokeWidth={2} />
            {added.tagged
              ? "옷장에 넣고 제주 여행으로 묶었어요"
              : `${added.merchant}에서 산 옷을 옷장에 넣었어요`}
          </div>
        )}
        <div className="filter-chips">
          {["전체", "제주 여행", "시험기간"].map((item) => (
            <Action
              className={cx("filter-chip", filter === item && "selected")}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </Action>
          ))}
        </div>
        <div className="closet-grid">
          {items
            .filter((item) => filter === "전체" || item.tag === filter)
            .map((item) => (
              <div className="closet-card" key={item.key}>
                <div className={cx("closet-image", item.visual)}>
                  <Shirt size={38} strokeWidth={1.1} />
                  {item.isNew && <Badge>NEW</Badge>}
                </div>
                <strong>{item.name}</strong>
                <span>{item.date}</span>
                {item.tag && <i>{item.tag}</i>}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
