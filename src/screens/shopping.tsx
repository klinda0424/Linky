import { useState } from "react"
import {
  ArrowDown,
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

export function ExpenseDetail({
  back,
  confirm,
}: {
  back: () => void
  confirm: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [linked, setLinked] = useState(false)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 상세" />
      <div className="detail-scroll">
        <div className="restored-product">
          <p>에이블리 40,000원</p>
          <ArrowDown size={18} strokeWidth={1.5} />
          <div>
            <div>
              {editing ? (
                <div
                  className="detail-editable"
                  contentEditable
                  role="textbox"
                  suppressContentEditableWarning
                >
                  원피스 (블랙 · M)
                </div>
              ) : (
                <strong>원피스 (블랙 · M)</strong>
              )}
              <span>구매 항목을 찾았어요</span>
            </div>
            <span className="product-thumb">
              <Shirt size={36} strokeWidth={1.3} />
            </span>
          </div>
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
        <div className={cx("tag-suggestion", linked && "linked")}>
          <span className="connect-icon">
            <Sparkles size={18} strokeWidth={1.5} />
          </span>
          <p>
            {linked
              ? "제주 여행 준비로 묶었어요"
              : "제주 여행 준비로 묶을까요?"}
          </p>
          {!linked && (
            <div>
              <Action className="mini-secondary">아니요</Action>
              <Action className="mini-primary" onClick={() => setLinked(true)}>
                묶기
              </Action>
            </div>
          )}
        </div>
      </div>
      <div className="ai-bottom">
        <Action className="secondary-button" onClick={() => setEditing(true)}>
          수정
        </Action>
        <Action className="primary-button" onClick={confirm}>
          맞아요
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
export function ClosetPage({ back }: { back: () => void }) {
  const [filter, setFilter] = useState("전체")
  const items = [
    ["원피스", "12월 12일 구매", "제주 여행", "dress"],
    ["울 카디건", "12월 7일 구매", "", "cardigan"],
    ["니트 머플러", "11월 28일 구매", "시험기간", "scarf"],
    ["롱 코트", "11월 19일 구매", "", "coat"],
  ]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="옷장" />
      <div className="closet-content">
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
                  {name === "원피스" && <Badge>NEW</Badge>}
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
