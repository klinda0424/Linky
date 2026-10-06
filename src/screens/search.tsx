import { useState, type ReactNode } from "react"
import { ChevronRight, Search, X } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type LedgerState,
  type Payment,
  PLACES,
  evidenceOf,
  evidenceText,
  keyOf,
  label,
  photosFor,
  pinPoint,
  searchLedger,
  weekday,
  won,
  zoneNames,
} from "@/lib/ledger"

// 비정형 검색: 가맹점·내 위치·일정 제목·같이한 사람 말로 결제를 찾는다. 근거는 사용자 기록에서만 가져온다.
const examples = ["성수에서 쓴 돈", "지은이랑 약속", "스타벅스", "합정 생일"]

export function SearchScreen({
  state,
  back,
  openPayment,
  detail,
  closeDetail,
}: {
  state: LedgerState
  back: () => void
  openPayment: (payment: Payment) => void
  detail?: ReactNode
  closeDetail: () => void
}) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")
  const run = (value: string) => {
    const text = value.trim()
    if (!text) return
    setQuery(text)
    setSubmitted(text)
  }
  // 최근 달부터 보여 준다
  const results = submitted
    ? [...searchLedger(submitted, state)].sort(
        (a, b) => keyOf(b.date) - keyOf(a.date) || b.time.localeCompare(a.time),
      )
    : []
  const resultPhotos = [
    ...new Map(
      results.flatMap((payment) => photosFor(payment, state)).map((photo) => [photo.id, photo]),
    ).values(),
  ]
  const total = results.reduce((sum, payment) => sum + payment.amount, 0)

  if (detail)
    return (
      <div className="main-page sub-page">
        <MainHeader back={closeDetail} title="결제 상세" />
        <div className="search-content">{detail}</div>
      </div>
    )

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="검색" />
      <div className="search-content">
        <div className="focused-search">
          <Search size={18} strokeWidth={1.5} />
          <input
            aria-label="검색어"
            enterKeyHint="search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing)
                run(query)
            }}
            placeholder="기억나는 말로 찾아보세요"
            value={query}
          />
          {query && (
            <Action
              label="지우기"
              onClick={() => {
                setQuery("")
                setSubmitted("")
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </Action>
          )}
        </div>
        {!submitted && (
          <>
            <p className="section-title">이렇게 찾아볼 수 있어요</p>
            <div className="search-examples">
              {examples.map((item) => (
                <Action
                  className="search-example-chip"
                  key={item}
                  onClick={() => run(item)}
                >
                  {item}
                </Action>
              ))}
            </div>
          </>
        )}
        {submitted && (
          <>
            <p className="section-title">
              “{submitted}” 결과 {results.length}건
              {results.length > 0 && ` · ${won(total)}`}
            </p>
            {results.length === 0 && (
              <div className="main-card arc-empty">
                기록 없음. 가맹점·장소·일정 제목으로 다시 찾아보세요.
              </div>
            )}
            {results.length > 0 && (
              <>
                {resultPhotos.length > 0 && (
                  <div className="search-photos">
                    {resultPhotos.slice(0, 5).map((photo, index) => (
                      <i className={`photo-thumb t${index % 5}`} key={photo.id} />
                    ))}
                    <span>연결된 사진 {resultPhotos.length}장</span>
                  </div>
                )}
                <div className="map-canvas search-map">
                  {zoneNames.map((zone) => (
                    <span
                      className="map-zone"
                      key={zone}
                      style={{ left: `${PLACES[zone].x}%`, top: `${PLACES[zone].y + 7}%` }}
                    >
                      {zone}
                    </span>
                  ))}
                  {results.map((payment) => (
                    <span
                      aria-label={`${payment.merchant} 결제 당시 내 위치`}
                      className={cx("map-pin pay", !payment.place && "unrestored")}
                      key={payment.id}
                      style={{
                        left: `${pinPoint(payment.zone, payment.id).x}%`,
                        top: `${pinPoint(payment.zone, payment.id).y}%`,
                      }}
                    />
                  ))}
                </div>
                <p className="search-map-note">핀은 결제 당시 내 위치예요. 점선 핀은 위치 기록 없음</p>
              </>
            )}
            <div className="search-results">
              {results.map((payment, index) => (
                <div key={payment.id}>
                  {(index === 0 || results[index - 1].date.m !== payment.date.m) && (
                    <p className="search-month">{payment.date.m}월</p>
                  )}
                <Action
                  className="main-card linked-pay"
                  onClick={() => openPayment(payment)}
                >
                  <div>
                    <strong>{payment.merchant}</strong>
                    <span>
                      {label(payment.date)} ({weekday(payment.date)}){" "}
                      {payment.time} · {evidenceText(evidenceOf(payment, state).length)}
                    </span>
                  </div>
                  <b>{won(payment.amount)}</b>
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Action>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
