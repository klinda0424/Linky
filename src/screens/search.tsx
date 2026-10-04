import { useState } from "react"
import { ChevronRight, Search, X } from "lucide-react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type LedgerState,
  type Payment,
  evidenceOf,
  label,
  searchLedger,
  weekday,
  won,
} from "@/lib/ledger"

// 비정형 검색: 가맹점·내 위치·일정 제목·같이한 사람 말로 결제를 찾는다. 근거는 사용자 기록에서만 가져온다.
const examples = ["성수에서 쓴 돈", "지은이랑 약속", "스타벅스", "합정 생일"]

export function SearchScreen({
  state,
  back,
  openPayment,
}: {
  state: LedgerState
  back: () => void
  openPayment: (payment: Payment) => void
}) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")
  const run = (value: string) => {
    const text = value.trim()
    if (!text) return
    setQuery(text)
    setSubmitted(text)
  }
  const results = submitted ? searchLedger(submitted, state) : []
  const total = results.reduce((sum, payment) => sum + payment.amount, 0)
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
            <div className="search-results">
              {results.map((payment) => (
                <Action
                  className="main-card linked-pay"
                  key={payment.id}
                  onClick={() => openPayment(payment)}
                >
                  <div>
                    <strong>{payment.merchant}</strong>
                    <span>
                      {label(payment.date)} ({weekday(payment.date)}){" "}
                      {payment.time} · 근거 {evidenceOf(payment, state).length}개
                    </span>
                  </div>
                  <b>{won(payment.amount)}</b>
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Action>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
