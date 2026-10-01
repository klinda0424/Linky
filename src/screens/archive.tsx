import { useRef, useState, type KeyboardEvent } from "react"
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Gift,
  Heart,
  MapPin,
  ReceiptText,
  Search,
  Shirt,
  ShoppingBag,
  Users,
  X,
} from "lucide-react"
import { Action, Badge, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

type SearchTab = "closet" | "place" | "payment"

type ArchiveResult = {
  id: string
  tab: SearchTab
  title: string
  meta: string
  description: string
  badge?: string
}

type SearchProfile = {
  chips: string[]
  results: Record<SearchTab, ArchiveResult[]>
}

const defaultArchiveQuery = "제주 갈 때 산 옷"
let activeArchiveQuery = defaultArchiveQuery

const travelProfile: SearchProfile = {
  chips: ["제주 여행", "의류", "12월"],
  results: {
    closet: [
      {
        id: "jeju-dress",
        tab: "closet",
        title: "원피스 (블랙 · M)",
        meta: "12월 12일 · 에이블리 40,000원",
        description: "여행 출발 10일 전에 구매했어요",
        badge: "제주 여행",
      },
      {
        id: "jeju-cardigan",
        tab: "closet",
        title: "울 카디건",
        meta: "12월 7일 구매",
        description: "제주 여행 준비 기록과 연결됐어요",
        badge: "제주 여행",
      },
      {
        id: "jeju-scarf",
        tab: "closet",
        title: "니트 머플러",
        meta: "11월 28일 구매",
        description: "제주 여행 준비 기록과 연결됐어요",
        badge: "제주 여행",
      },
    ],
    place: [
      {
        id: "jeju-sunrise-peak",
        tab: "place",
        title: "성산일출봉",
        meta: "12월 23일 · 제주 성산",
        description: "제주 여행 동선과 연결된 장소예요",
      },
      {
        id: "jeju-restaurant",
        tab: "place",
        title: "해녀 식당",
        meta: "12월 23일 · 제주 성산",
        description: "132,000원 결제와 연결됐어요",
      },
    ],
    payment: [
      {
        id: "jeju-dress-payment",
        tab: "payment",
        title: "에이블리 원피스",
        meta: "12월 12일 · 쇼핑",
        description: "40,000원",
      },
      {
        id: "jeju-restaurant-payment",
        tab: "payment",
        title: "해녀 식당",
        meta: "12월 23일 · 식비",
        description: "132,000원",
      },
      {
        id: "jeju-entry-payment",
        tab: "payment",
        title: "성산일출봉 입장료",
        meta: "12월 23일 · 관광",
        description: "15,000원",
      },
    ],
  },
}

const examProfile: SearchProfile = {
  chips: ["시험기간", "배달", "12월"],
  results: {
    closet: [],
    place: [
      {
        id: "exam-delivery-app",
        tab: "place",
        title: "배달의민족",
        meta: "온라인 주문",
        description: "시험기간 배달 기록과 연결됐어요",
      },
      {
        id: "exam-convenience-store",
        tab: "place",
        title: "CU 편의점",
        meta: "12월 15일",
        description: "시험기간 결제 기록과 연결됐어요",
      },
    ],
    payment: [
      {
        id: "exam-tteokbokki",
        tab: "payment",
        title: "떡볶이",
        meta: "12월 15일 · 배달의민족",
        description: "6,500원",
      },
      {
        id: "exam-convenience-payment",
        tab: "payment",
        title: "CU 편의점",
        meta: "12월 15일 · 편의점",
        description: "1,500원",
      },
    ],
  },
}

const cafeProfile: SearchProfile = {
  chips: ["카페", "주변 결제", "한 달 뒤"],
  results: {
    closet: [],
    place: [
      {
        id: "cafe-starbucks",
        tab: "place",
        title: "스타벅스",
        meta: "카페",
        description: "주변 결제 기록의 기준 장소예요",
      },
      {
        id: "cafe-convenience-store",
        tab: "place",
        title: "편의점",
        meta: "간식",
        description: "카페 근처 결제로 연결됐어요",
      },
    ],
    payment: [
      {
        id: "cafe-starbucks-payment",
        tab: "payment",
        title: "스타벅스",
        meta: "카페",
        description: "6,500원",
      },
      {
        id: "cafe-snack-payment",
        tab: "payment",
        title: "편의점",
        meta: "간식",
        description: "3,200원",
      },
    ],
  },
}

const emptyProfile: SearchProfile = {
  chips: ["검색어 분석", "연결 기록"],
  results: { closet: [], place: [], payment: [] },
}

const getSearchProfile = (query: string) => {
  if (/시험|배달/.test(query)) return examProfile
  if (/제주|옷|원피스|의류/.test(query)) return travelProfile
  if (/카페|스타벅스|근처/.test(query)) return cafeProfile
  return emptyProfile
}

const searchTabs: Array<{ key: SearchTab; label: string }> = [
  { key: "closet", label: "옷장" },
  { key: "place", label: "위치" },
  { key: "payment", label: "결제" },
]

function ResultIcon({ tab, size = 19 }: { tab: SearchTab; size?: number }) {
  if (tab === "place") return <MapPin size={size} strokeWidth={1.5} />
  if (tab === "payment") return <ReceiptText size={size} strokeWidth={1.5} />
  return <Shirt size={size} strokeWidth={1.5} />
}

function ArchiveResultList({
  results,
  select,
}: {
  results: ArchiveResult[]
  select: (result: ArchiveResult) => void
}) {
  if (results.length === 0) {
    return (
      <div className="search-tab-empty">
        <Search size={26} strokeWidth={1.4} />
        <p>이 검색어와 연결된 기록이 없어요</p>
      </div>
    )
  }

  return (
    <div className="archive-list" style={{ marginTop: 14 }}>
      {results.map((result) => (
        <Action
          className="archive-card"
          key={result.id}
          onClick={() => select(result)}
        >
          <span
            className={cx(
              "icon-box",
              result.tab === "closet"
                ? "purple"
                : result.tab === "place"
                  ? "blue"
                  : "green",
            )}
          >
            <ResultIcon tab={result.tab} />
          </span>
          <div>
            <strong>{result.title}</strong>
            <span>{result.meta}</span>
            <span>{result.description}</span>
          </div>
          <ChevronRight size={17} strokeWidth={1.5} />
        </Action>
      ))}
    </div>
  )
}

function ArchiveResultDetail({
  result,
  back,
}: {
  result: ArchiveResult
  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="기록 상세" />
      <div className="search-results-content">
        <div className="query-summary">
          <ResultIcon tab={result.tab} size={16} />
          <strong>{result.title}</strong>
        </div>
        <div className="primary-search-result">
          <span className="search-product-image">
            <ResultIcon tab={result.tab} size={50} />
            {result.badge && <Badge>{result.badge}</Badge>}
          </span>
          <div>
            <strong>{result.title}</strong>
            <span>{result.meta}</span>
            <p>{result.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArchiveSearch({
  back,
  results,
}: {
  back: () => void
  results: () => void
}) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const queryInput = useRef<HTMLDivElement>(null)
  const resetQueryInput = () => {
    setQuery("")
    if (queryInput.current) queryInput.current.textContent = ""
  }
  const runSearch = (value: string) => {
    const nextQuery = value.trim()
    if (!nextQuery || loading) return
    setQuery(nextQuery)
    if (queryInput.current) queryInput.current.textContent = nextQuery
    activeArchiveQuery = nextQuery
    setLoading(true)
    window.setTimeout(() => {
      resetQueryInput()
      results()
    }, 1100)
  }
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return
    event.preventDefault()
    runSearch(query)
  }
  const clearQuery = () => {
    resetQueryInput()
    queryInput.current?.focus()
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="기록 검색" />
      <div className="archive-search-content">
        <div className="focused-search">
          <Search size={18} strokeWidth={1.5} />
          <div
            aria-label="기록 검색어"
            contentEditable={!loading}
            data-placeholder="기억나는 말로 찾아보세요"
            onInput={(event) => setQuery(event.currentTarget.textContent || "")}
            onKeyDown={handleSearchKeyDown}
            ref={queryInput}
            role="textbox"
            suppressContentEditableWarning
          />
          {query && !loading && (
            <Action aria-label="검색어 지우기" onClick={clearQuery}>
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
}: {
  back: () => void
  openExpense: () => void
}) {
  const [tab, setTab] = useState<SearchTab>("closet")
  const [selectedResult, setSelectedResult] = useState<ArchiveResult | null>(
    null,
  )
  const [resultQuery, setResultQuery] = useState(activeArchiveQuery)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const profile = getSearchProfile(resultQuery)
  const runSearch = () => {
    const nextQuery = query.trim()
    if (!nextQuery || loading) return
    setLoading(true)
    window.setTimeout(() => {
      activeArchiveQuery = nextQuery
      setResultQuery(nextQuery)
      setQuery("")
      setTab("closet")
      setLoading(false)
    }, 1100)
  }
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return
    event.preventDefault()
    runSearch()
  }

  if (selectedResult) {
    return (
      <ArchiveResultDetail
        back={() => setSelectedResult(null)}
        result={selectedResult}
      />
    )
  }

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="검색 결과" />
      <div className="search-results-content">
        <div className="query-summary">
          <Action
            disabled={!query.trim() || loading}
            label="검색 실행"
            onClick={runSearch}
          >
            <Search size={16} strokeWidth={1.5} />
          </Action>
          <input
            aria-label="결과에서 다시 검색"
            disabled={loading}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="기억나는 말로 찾아보세요"
            style={{
              minWidth: 0,
              flex: 1,
              border: 0,
              outline: "none",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              fontSize: 12,
            }}
            value={query}
          />
        </div>
        {loading ? (
          <div className="search-loading">
            <span className="loading-dots">
              <i />
              <i />
              <i />
            </span>
            <p>태그·일정·옷장에서 찾는 중</p>
          </div>
        ) : (
          <>
            <div className="interpretation-chips">
              {profile.chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
            <div className="result-tabs">
              {searchTabs.map(({ key, label }) => (
                <Action
                  className={cx(tab === key && "active")}
                  key={key}
                  onClick={() => setTab(key)}
                >
                  {label} {profile.results[key].length}
                </Action>
              ))}
            </div>
            <ArchiveResultList
              results={profile.results[tab]}
              select={setSelectedResult}
            />
          </>
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
