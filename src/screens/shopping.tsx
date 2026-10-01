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

const restoredItem = "원피스 (블랙 · M)"
const itemCandidates = [
  restoredItem,
  "원피스 (아이보리 · M)",
  "블라우스 (블랙 · M)",
]

// U3-1 분기(수락/거절)는 이 파일 안에서 옷장(U3-2)으로 넘어간다.
export function ExpenseDetail({
  back,
}: {
  back: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(false)
  const [item, setItem] = useState(restoredItem)
  const [draft, setDraft] = useState(restoredItem)
  const [tagged, setTagged] = useState<boolean>()
  if (tagged !== undefined)
    return <ClosetPage added={{ name: item, tagged }} back={back} />
  const finishEdit = () => {
    setItem(draft.trim())
    setEdited(true)
    setEditing(false)
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 상세" />
      <div className="detail-scroll">
        <div className="restored-product">
          <p>에이블리 40,000원</p>
          <ArrowDown size={18} strokeWidth={1.5} />
          <div>
            <div>
              <strong>{editing ? draft || " " : item}</strong>
              <span>
                {editing
                  ? "맞는 항목을 골라주세요"
                  : edited
                    ? "고친 이름으로 바꿨어요"
                    : "구매 항목을 찾았어요"}
                {!editing && (
                  <Action
                    className="product-edit"
                    onClick={() => {
                      setDraft(item)
                      setEditing(true)
                    }}
                  >
                    수정
                  </Action>
                )}
              </span>
            </div>
            <span className="product-thumb">
              <Shirt size={36} strokeWidth={1.3} />
            </span>
          </div>
          {editing && (
            <div className="product-editor">
              <div className="suggestion-chips">
                {itemCandidates.map((candidate) => (
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
                ))}
              </div>
              <input
                aria-label="구매 항목 이름"
                className="product-input"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="직접 입력"
                value={draft}
              />
              <div className="product-editor-actions">
                <Action
                  className="mini-secondary"
                  onClick={() => setEditing(false)}
                >
                  취소
                </Action>
                <Action
                  className="mini-primary"
                  disabled={!draft.trim()}
                  onClick={finishEdit}
                >
                  완료
                </Action>
              </div>
            </div>
          )}
        </div>
        <div className="detail-info">
          {[
            ["결제일시", "12월 12일 23:41"],
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
            <span>에이블리 앱</span>
          </div>
        </div>
        <div className="tag-suggestion">
          <span className="connect-icon">
            <Sparkles size={18} strokeWidth={1.5} />
          </span>
          <p>제주 여행 준비로 묶어둘 수 있어요</p>
          <span className="tag-reason">
            12월 22일 제주 여행 열흘 전에 산 옷이에요
          </span>
        </div>
      </div>
      <div className="ai-bottom">
        <Action
          className="secondary-button"
          disabled={editing}
          onClick={() => setTagged(false)}
        >
          아니요
        </Action>
        <Action
          className="primary-button"
          disabled={editing}
          onClick={() => setTagged(true)}
        >
          여행으로 묶기
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
            <p>옷과 패션 아이템 8개</p>
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
export function ClosetPage({
  back,
  added,
}: {
  back: () => void
  added?: { name: string; tagged: boolean }
}) {
  const [filter, setFilter] = useState("전체")
  const items = [
    [
      added?.name ?? "원피스",
      "12월 12일 구매",
      !added || added.tagged ? "제주 여행" : "",
      "dress",
    ],
    ["울 카디건", "12월 7일 구매", "", "cardigan"],
    ["니트 머플러", "11월 28일 구매", "시험기간", "scarf"],
    ["롱 코트", "11월 19일 구매", "", "coat"],
  ]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="옷장" />
      <div className="closet-content">
        {added && (
          <div className="closet-notice">
            <Check size={14} strokeWidth={2} />
            {added.tagged
              ? "옷장에 넣고 제주 여행으로 묶었어요"
              : "옷장에 넣었어요"}
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
            .filter(([, , tag]) => filter === "전체" || tag === filter)
            .map(([name, date, tag, visual]) => (
              <div className="closet-card" key={name}>
                <div className={cx("closet-image", visual)}>
                  <Shirt size={38} strokeWidth={1.1} />
                  {visual === "dress" && <Badge>NEW</Badge>}
                </div>
                <strong>{name}</strong>
                <span>{date}</span>
                {tag && <i>{tag}</i>}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
