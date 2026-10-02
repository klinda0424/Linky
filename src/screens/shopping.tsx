import { useState } from "react"
import {
  ArrowDown,
  Check,
  ChevronRight,
  Footprints,
  Gem,
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
  onAdd,
}: {
  back: () => void
  // 홈에서 누른 구매처. 없으면 U3-1 대상(원피스)이 있는 구매처를 연다.
  merchant?: string
  // 옷장에 넣었을 때 알림 (UT 성공 지점 기록용)
  onAdd?: () => void
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
  const [done, setDone] = useState(false)
  if (done)
    return (
      <ClosetPage
        added={{ merchant: group.merchant, names }}
        back={back}
      />
    )
  const finishEdit = (key: string) => {
    setNames((current) => ({ ...current, [key]: draft.trim() }))
    setEdited((current) => (current.includes(key) ? current : [...current, key]))
    setEditing(undefined)
  }
  // 같은 쇼핑몰에서 같은 시각에 산 옷은 한 번에 결제한 것 (결제 시각 = 결제 건)
  const times = [...new Set(group.items.map((expense) => expense.time))].sort()
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 상세" />
      <div className="detail-scroll">
        <div className="restored-product">
          <p>
            {group.merchant} {won(group.total)} · 결제 {times.length}건
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
                    {times.length > 1
                      ? `${expense.time} · ${won(expense.amount)}`
                      : won(expense.amount)}
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
            ["결제일시", `12월 12일 ${times.join(" · ")}`],
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
      </div>
      <div className="ai-bottom single">
        <Action
          className="primary-button"
          disabled={editing !== undefined}
          onClick={() => {
            onAdd?.()
            setDone(true)
          }}
        >
          옷장에 넣기
        </Action>
      </div>
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
}
// 옷장은 종류(카테고리)로만 나눈다. 시험기간·제주 여행 같은 태그는 붙이지 않는다.
const closetCategories = ["상의", "하의", "원피스", "아우터", "신발", "악세서리"] as const
type ClosetCategory = (typeof closetCategories)[number]
const categoryIcons: Record<ClosetCategory, typeof Shirt> = {
  상의: Shirt,
  하의: Shirt,
  원피스: Shirt,
  아우터: Shirt,
  신발: Footprints,
  악세서리: Gem,
}
// 홈 "오늘" 옷 결제의 종류. 지출 상세에서 복원한 상품명에 맞춰 분류한다.
const todayCategory: Record<string, ClosetCategory> = {
  원피스: "원피스",
  블라우스: "상의",
  "니트 가디건": "아우터",
  "와이드 데님": "하의",
  "플리츠 스커트": "하의",
}
// 시험기간 이전에 산 옷(옷장에 원래 있던 것)
const earlierClothes: Array<{
  name: string
  category: ClosetCategory
  month: number
  day: number
}> = [
  { name: "스트라이프 니트", category: "상의", month: 11, day: 25 },
  { name: "슬랙스", category: "하의", month: 11, day: 12 },
  { name: "롱 코트", category: "아우터", month: 11, day: 19 },
  { name: "첼시 부츠", category: "신발", month: 11, day: 3 },
  { name: "스니커즈", category: "신발", month: 10, day: 21 },
  { name: "니트 머플러", category: "악세서리", month: 11, day: 28 },
  { name: "가죽 크로스백", category: "악세서리", month: 11, day: 9 },
]

function closetItems(added?: ClosetAdded) {
  const today = todayExpenses
    .filter((expense) => expense.category === "쇼핑")
    .map((expense) => {
      const fromDetail = added?.merchant === expense.merchant
      return {
        key: `today-${expense.name}`,
        name: (fromDetail && added?.names[expense.name]) || expense.name,
        category: todayCategory[expense.name] ?? ("상의" as ClosetCategory),
        date: `12월 12일 · ${expense.merchant}`,
        visual: closetVisual(expense.name),
        isNew: added ? fromDetail : expense.name === travelItem,
      }
    })
  const earlier = earlierClothes.map((cloth, index) => ({
    key: `earlier-${index}`,
    name: cloth.name,
    category: cloth.category,
    date: `${cloth.month}월 ${cloth.day}일 구매`,
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
  const [filter, setFilter] = useState<"전체" | ClosetCategory>("전체")
  const items = closetItems(added)
  const countOf = (category: ClosetCategory) =>
    items.filter((item) => item.category === category).length
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="옷장" />
      <div className="closet-content">
        {added && (
          <div className="closet-notice">
            <Check size={14} strokeWidth={2} />
            {added.merchant}에서 산 옷을 옷장에 넣었어요
          </div>
        )}
        <div className="filter-chips wrap">
          {(["전체", ...closetCategories] as const).map((item) => (
            <Action
              className={cx("filter-chip", filter === item && "selected")}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item} {item === "전체" ? items.length : countOf(item)}
            </Action>
          ))}
        </div>
        <div className="closet-grid">
          {items
            .filter((item) => filter === "전체" || item.category === filter)
            .map((item) => {
              const Icon = categoryIcons[item.category]
              return (
                <div className="closet-card" key={item.key}>
                  <div className={cx("closet-image", item.visual)}>
                    <Icon size={38} strokeWidth={1.1} />
                    {item.isNew && <Badge>NEW</Badge>}
                  </div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.category} · {item.date}
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
