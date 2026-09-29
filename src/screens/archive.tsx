import { useState } from "react"
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Gift,
  Heart,
  Search,
  Shirt,
  ShoppingBag,
  Users,
  X,
} from "lucide-react"
import { Action, Badge, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

export function ArchiveSearch({
  back,
  results,
}: {
  back: () => void
  results: () => void
}) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const runSearch = (value: string) => {
    setQuery(value)
    setLoading(true)
    window.setTimeout(results, 1100)
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="기록 검색" />
      <div className="archive-search-content">
        <div className="focused-search">
          <Search size={18} strokeWidth={1.5} />
          <div
            contentEditable
            data-placeholder="기억나는 말로 찾아보세요"
            onInput={(event) => setQuery(event.currentTarget.textContent || "")}
            role="textbox"
            suppressContentEditableWarning
          >
            {query}
          </div>
          {query && (
            <Action onClick={() => setQuery("")}>
              <X size={16} strokeWidth={1.5} />
            </Action>
          )}
        </div>
        <p className="search-example-title">이렇게 찾아볼 수 있어요</p>
        <div className="search-examples">
          {["제주 갈 때 산 옷", "시험기간 배달", "그 카페 근처에서 쓴 돈"].map(
            (item) => (
              <Action
                className="search-example-chip"
                key={item}
                onClick={() => runSearch(item)}
              >
                {item}
              </Action>
            ),
          )}
        </div>
        {loading && (
          <div className="search-loading">
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
            <p>태그·일정·옷장에서 찾는 중</p>
          </div>
        )}
      </div>
    </div>
  )
}
export function ArchiveSearchResults({
  back,
  openExpense,
}: {
  back: () => void
  openExpense: () => void
}) {
  const [tab, setTab] = useState<"closet" | "place" | "payment">("closet")
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="검색 결과" />
      <div className="search-results-content">
        <div className="query-summary">
          <Search size={16} strokeWidth={1.5} />
          <strong>제주 갈 때 산 옷</strong>
        </div>
        <div className="interpretation-chips">
          <span>제주 여행</span>
          <span>의류</span>
          <span>12월</span>
        </div>
        <div className="result-tabs">
          <Action
            className={cx(tab === "closet" && "active")}
            onClick={() => setTab("closet")}
          >
            옷장
          </Action>
          <Action
            className={cx(tab === "place" && "active")}
            onClick={() => setTab("place")}
          >
            위치
          </Action>
          <Action
            className={cx(tab === "payment" && "active")}
            onClick={() => setTab("payment")}
          >
            결제
          </Action>
        </div>
        {tab === "closet" ? (
          <>
            <Action className="primary-search-result" onClick={openExpense}>
              <span className="search-product-image">
                <Shirt size={50} strokeWidth={1.1} />
                <Badge>제주 여행</Badge>
              </span>
              <div>
                <strong>원피스 (블랙 · M)</strong>
                <span>12월 12일 · 에이블리 40,000원</span>
                <p>여행 출발 10일 전에 구매했어요</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.5} />
            </Action>
            <p className="related-title">관련 아이템</p>
            <div className="related-items">
              {[
                ["울 카디건", "12월 7일"],
                ["니트 머플러", "11월 28일"],
              ].map(([name, date]) => (
                <Action
                  className="related-card"
                  key={name}
                  onClick={openExpense}
                >
                  <span>
                    <Shirt size={28} strokeWidth={1.2} />
                  </span>
                  <strong>{name}</strong>
                  <p>{date} 구매</p>
                </Action>
              ))}
            </div>
          </>
        ) : (
          <div className="search-tab-empty">
            <Search size={26} strokeWidth={1.4} />
            <p>
              {tab === "place"
                ? "관련 위치 2곳을 찾았어요"
                : "관련 결제 3건을 찾았어요"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
export function ArchivePage({
  openShopping,
  openHealth,
  openSearch,
}: {
  openShopping: () => void
  openHealth: () => void
  openSearch: () => void
}) {
  const sections = [
    [CalendarDays, "일정 보관함", "연결한 약속과 일정을 모아봐요", "blue"],
    [Heart, "감정 보관함", "그날의 기분 기록을 모아봐요", "pink"],
    [Activity, "건강 보관함", "건강과 지출 기록을 함께 봐요", "green"],
    [ShoppingBag, "쇼핑 보관함", "구매한 물건을 한곳에서 봐요", "purple"],
  ] as const
  return (
    <>
      <MainHeader title="보관함" />
      <div className="tab-content">
        <Action className="search-box" onClick={openSearch}>
          <Search size={17} strokeWidth={1.5} />
          <span>기록 검색</span>
        </Action>
        <p className="section-title">내 기록</p>
        <div className="archive-list">
          {sections.map(([Icon, title, copy, color]) => (
            <Action
              className="archive-card"
              key={title}
              onClick={
                title === "쇼핑 보관함"
                  ? openShopping
                  : title === "건강 보관함"
                    ? openHealth
                    : undefined
              }
            >
              <span className={cx("icon-box", color)}>
                <Icon size={19} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{title}</strong>
                <span>{copy}</span>
              </div>
              <ChevronRight size={17} strokeWidth={1.5} />
            </Action>
          ))}
        </div>
      </div>
    </>
  )
}
export function EmptyTab({ tab }: { tab: "fun" | "community" }) {
  const fun = tab === "fun"
  return (
    <>
      <MainHeader title={fun ? "재미요소" : "커뮤니티"} />
      <div className="tab-content">
        <p className="section-title">
          {fun ? "나의 발견" : "함께 나누는 기록"}
        </p>
        <div className="empty-block">
          <span>
            {fun ? (
              <Gift size={27} strokeWidth={1.5} />
            ) : (
              <Users size={27} strokeWidth={1.5} />
            )}
          </span>
          <p>
            {fun
              ? "기록이 쌓이면 새로운 발견을 보여드릴게요"
              : "커뮤니티 기능을 준비하고 있어요"}
          </p>
        </div>
      </div>
    </>
  )
}
