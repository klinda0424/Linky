import { useState, type TouchEvent } from "react"
import {
  Map,
  MapPin,
  Plane,
  Shirt,
  X,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

export function TravelStory({ close }: { close: () => void }) {
  const [page, setPage] = useState(0)
  const [touchY, setTouchY] = useState<number>()
  const stories = [
    {
      visual: "outfit",
      content: "시험기간에 골라둔 원피스, 드디어 입었어요",
      icon: <Shirt size={58} strokeWidth={1.1} />,
    },
    {
      visual: "route",
      content: "공항 → 성산일출봉 → 해녀 식당",
      icon: <Map size={58} strokeWidth={1.1} />,
    },
    {
      visual: "seongsan",
      content: "3일 동안 가장 많이 머문 곳은 성산이었어요",
      icon: <MapPin size={58} strokeWidth={1.1} />,
    },
    {
      visual: "cost",
      content: "내 몫 373,000원으로 다녀온 제주",
      caption: "공유하지 않고 나만 볼 수 있어요",
      icon: <Plane size={58} strokeWidth={1.1} />,
    },
  ]
  const story = stories[page]
  const endSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (touchY === undefined) return
    const delta = event.changedTouches[0].clientY - touchY
    if (delta < -45 && page < 3) setPage(page + 1)
    if (delta > 45 && page > 0) setPage(page - 1)
    setTouchY(undefined)
  }
  return (
    <div className="main-page story-page">
      <div className="story-progress">
        {[0, 1, 2, 3].map((item) => (
          <span className={item <= page ? "complete" : ""} key={item} />
        ))}
      </div>
      <div className="story-top">
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>제주 여행 이야기</span>
        </div>
        <Action className="story-close" onClick={close}>
          <X size={20} strokeWidth={1.6} />
        </Action>
      </div>
      <div
        className="story-card"
        onTouchEnd={endSwipe}
        onTouchStart={(event) => setTouchY(event.touches[0].clientY)}
      >
        <div className={cx("story-visual", story.visual)}>
          {story.icon}
          {story.visual === "route" && (
            <div className="route-dots">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
        <div className="story-copy">
          <span>{page + 1} / 4</span>
          <p>{story.content}</p>
          {story.caption && <small>{story.caption}</small>}
        </div>
      </div>
      <p className="story-hint">위로 밀어 다음 이야기 보기</p>
    </div>
  )
}
export function TravelCostReport({ back, goHome }: { back: () => void; goHome: () => void }) {
  return (
    <div className="main-page sub-page travel-cost-page">
      <MainHeader back={back} title="제주 여행 비용 리포트" />
      <div className="travel-cost-content">
        <div className="actual-cost-card">
          <span>1인 실제 비용</span>
          <strong>373,000원</strong>
          <p>내 몫만 가계에 반영했어요</p>
        </div>
        <div className="cost-compare">
          <div>
            <span>여행 준비</span>
            <strong>160,000원</strong>
          </div>
          <i />
          <div>
            <span>제주 현지</span>
            <strong>213,000원</strong>
          </div>
        </div>
        <div className="category-report">
          <p className="section-title">카테고리별 비용</p>
          <div className="donut-wrap">
            <div className="cost-donut">
              <span>373,000원</span>
            </div>
            <div className="cost-legend">
              {[
                ["교통", "128,000원", "transport"],
                ["숙박", "140,000원", "stay"],
                ["식비", "90,000원", "food"],
                ["관광", "15,000원", "tour"],
              ].map(([label, amount, color]) => (
                <div key={label}>
                  <i className={color} />
                  <span>{label}</span>
                  <strong>{amount}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="travel-cost-home-btn">
        <Action className="primary-button" onClick={goHome}>
          홈으로 돌아가기
        </Action>
      </div>
    </div>
  )
}
