import { useEffect, useRef, useState } from "react"
import { Camera, ChevronRight, Send, UtensilsCrossed } from "lucide-react"
import { Action, Toggle, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  archiveEvents,
  archiveNow,
  daysUntil,
  eventSpend,
  eventStatus,
} from "@/lib/archive"
import { dayCategories, dayTotal, days } from "@/lib/days"
import { summarize } from "@/lib/settlement"
import {
  todayByCategory,
  todayExpenses,
  todayTotal,
  usualDaily,
  usualTotal,
  won,
} from "@/lib/today"
import { type UTMode } from "@/lib/ut"
import { dietByStage } from "@/screens/home"
import { type Tone } from "@/types"

const stageDate = (mode: UTMode) => days[mode].date

// ---------- 대화하기 ----------
type Reply = string | "recipes"
const trip = summarize([])
const scripts: Record<UTMode, Array<{ q: string; a: Reply }>> = {
  confirm: [
    {
      q: "다이어트를 시작했는데 뭐부터 보면 좋아?",
      a: `먼저 식비·배달 흐름만 모아서 보여드릴게요. 이번 주는 배달 ${dietByStage.confirm.delivery}회, 식비 ${won(dietByStage.confirm.food)}이에요.`,
    },
    {
      q: "오늘 얼마 썼어?",
      a: `오늘은 3건, ${won(dayTotal(days.confirm))}이에요. 학식과 카페, 지하철 결제가 있었어요.`,
    },
  ],
  exam: [
    { q: "냉장고 있는 걸로 뭐 해먹지?", a: "recipes" },
    {
      q: "오늘 소비가 평소랑 뭐가 달라?",
      a: `오늘은 ${todayExpenses.length}건, ${won(todayTotal)}이에요. 평소 하루 평균 ${won(usualTotal)}보다 많았고, 옷이 ${won(todayByCategory.쇼핑)}으로 가장 컸어요. 쇼핑은 평소 ${won(usualDaily.쇼핑)} 정도예요.`,
    },
  ],
  prepare: [
    {
      q: "제주 여행 경비는 지금까지 얼마야?",
      a: `지금까지 여행에 묶인 지출은 항공권 1건, ${won(360000)}이에요. 3명이 나누면 1인당 ${won(120000)}이에요.`,
    },
    {
      q: "항공권은 왜 그룹 지출이야?",
      a: "여행 일정에 3명(나, 수현, 민지)이 들어 있고 12/22 출발편이라서 그룹 지출로 보였어요. 아니라면 알림에서 '아니요'를 고르면 개인 지출로 남겨요.",
    },
  ],
  travel: [
    {
      q: "정산 대기는 얼마야?",
      a: `정산 대기는 ${trip.items.length}건, ${won(trip.total)}이에요. 돌아온 뒤 정산표에서 한 번에 나눠요.`,
    },
    {
      q: "오늘 제주에서 얼마 썼어?",
      a: `오늘은 3건, ${won(dayTotal(days.travel))}이에요. 식비가 ${won(dayCategories(days.travel)[0][1])}으로 가장 컸어요.`,
    },
  ],
  after: [
    {
      q: "이번 여행 내 몫은 얼마야?",
      a: `${won(trip.total)}을 3명이 나눠서 내 몫은 ${won(trip.perPerson)}이에요. 여행 지출은 내 몫만 가계에 반영했어요.`,
    },
    {
      q: "어디에 제일 많이 썼어?",
      a: `내 몫 기준으로 교통 ${won(trip.byCategory.교통)}, 숙박 ${won(trip.byCategory.숙박)}, 식비 ${won(trip.byCategory.식비)} 순이에요.`,
    },
  ],
  monthLater: [
    {
      q: "제주 갈 때 산 옷이 뭐였지?",
      a: "12월 12일에 산 원피스, 니트 가디건, 와이드 데님, 블라우스, 플리츠 스커트 5벌이에요. 옷장에서 종류별로 볼 수 있어요.",
    },
    {
      q: "지난 한 달 해먹은 날은 며칠이야?",
      a: "해먹은 날은 9일, 아낀 돈은 80,000원이에요.",
    },
  ],
}

type Message = { from: "me" | "rini"; text?: string; recipes?: boolean }

export function CoachTalk({ back, mode }: { back: () => void; mode: UTMode }) {
  const script = scripts[mode]
  const [messages, setMessages] = useState<Message[]>([])
  const [asked, setAsked] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages])
  const recipes = [
    ["닭가슴살 샐러드", "10분", "salad"],
    ["요거트 볼", "5분", "bowl"],
  ]
  const ask = (question: string, answer?: Reply) => {
    const found = script.find((item) => item.q === question)
    const reply = answer ?? found?.a
    setAsked((current) => [...current, question])
    setMessages((current) => [
      ...current,
      { from: "me", text: question },
      reply === "recipes"
        ? { from: "rini", text: "지금 있는 재료로 가볍게 만들 수 있는 메뉴를 골라봤어요.", recipes: true }
        : {
            from: "rini",
            text:
              reply ??
              "아직 그 질문은 배우는 중이에요. 아래 질문 중에서 골라 주세요.",
          },
    ])
  }
  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    // 비슷한 말이면 준비된 질문으로 연결, 아니면 안내
    const matched = script.find(
      (item) =>
        text.includes(item.q.slice(0, 4)) ||
        (item.a === "recipes" && /냉장고|해먹|레시피/.test(text)),
    )
    if (matched) ask(text, matched.a)
    else ask(text)
  }
  const rest = script.filter((item) => !asked.includes(item.q))
  return (
    <div className="main-page sub-page chat-page">
      <MainHeader back={back} title="린이와 대화" />
      <div className="chat-content">
        <div className="rini-message">
          <span className="rini-avatar">L</span>
          <div>
            <p>
              {stageDate(mode)}이에요. 궁금한 걸 물어보세요. 아래 질문을 눌러도
              되고, 직접 써도 돼요.
            </p>
          </div>
        </div>
        {messages.map((message, index) =>
          message.from === "me" ? (
            <div className="user-bubble chat-gap" key={index}>
              {message.text}
            </div>
          ) : (
            <div className="rini-message" key={index}>
              <span className="rini-avatar">L</span>
              <div>
                <p>{message.text}</p>
                {message.recipes && (
                  <div className="recipe-list">
                    {recipes.map(([name, time, visual]) => (
                      <div className="recipe-card" key={name}>
                        <span className={cx("recipe-image", visual)}>
                          <UtensilsCrossed size={24} strokeWidth={1.3} />
                        </span>
                        <div>
                          <strong>
                            {name} · {time}
                          </strong>
                          <span>보유 재료 4/5</span>
                        </div>
                        <ChevronRight size={16} strokeWidth={1.5} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {rest.length > 0 && (
          <div className="chat-chips">
            {rest.map((item) => (
              <Action
                className="suggestion-chip"
                key={item.q}
                onClick={() => ask(item.q)}
              >
                {item.q}
              </Action>
            ))}
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="chat-input">
        <Action className="chat-photo" label="사진 추가">
          <Camera size={19} strokeWidth={1.5} />
        </Action>
        <input
          aria-label="린이에게 물어보기"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) send()
          }}
          placeholder="린이에게 물어보기"
          value={draft}
        />
        <Action className="chat-send" label="보내기" onClick={send}>
          <Send size={17} strokeWidth={1.6} />
        </Action>
      </div>
    </div>
  )
}

// ---------- 맞춤 리포트 ----------
export function CoachReport({
  back,
  mode,
  tone,
  dietMode,
}: {
  back: () => void
  mode: UTMode
  tone: Tone
  dietMode: boolean
}) {
  const day = days[mode]
  const total = dayTotal(day)
  const diet = dietByStage[mode]
  const now = archiveNow[mode]
  const events = archiveEvents.filter((event) => {
    const status = eventStatus(event, now)
    return status !== "past" || mode === "after" || mode === "monthLater"
  })
  const week =
    total - day.previousWeekTotal >= 0
      ? `지난주 같은 요일보다 ${won(total - day.previousWeekTotal)} 많아요`
      : `지난주 같은 요일보다 ${won(day.previousWeekTotal - total)} 적어요`
  const lead = dayCategories(day)[0]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="맞춤 리포트" />
      <div className="insight-content">
        <div className="insight-hero">
          <span>{day.date} 기준 · 나에게 맞춘 요약</span>
          <strong>{won(total)}</strong>
          <p>
            오늘 {day.expenses.length}건 · {week}
          </p>
        </div>
        {tone === "narrative" ? (
          <div className="main-card insight-card">
            <strong>오늘의 흐름</strong>
            <p>
              {lead[0]} 결제가 {won(lead[1])}으로 가장 컸어요.{" "}
              {day.expenses
                .slice(0, 3)
                .map((expense) => expense.name)
                .join(", ")}
              {day.expenses.length > 3 ? " 등" : ""}이 기록돼 있어요.
            </p>
          </div>
        ) : (
          <div className="main-card insight-compare">
            <div className="block-heading">
              <strong>카테고리별 지출</strong>
              <span>오늘</span>
            </div>
            {dayCategories(day).map(([label, amount]) => (
              <div className="home-bar" key={label}>
                <span>{label}</span>
                <i>
                  <b style={{ width: `${(amount / total) * 100}%` }} />
                </i>
                <strong>{Math.round((amount / total) * 100)}%</strong>
              </div>
            ))}
          </div>
        )}
        {dietMode && (
          <div className="main-card insight-card">
            <strong>다이어트 모드 · 이번 주</strong>
            <p>
              배달 {diet.delivery}회, 식비 {won(diet.food)}이에요. 목표 모드를 켜서
              식비·배달을 먼저 모아 보여드리고 있어요.
            </p>
          </div>
        )}
        <div className="main-card insight-card">
          <strong>내 일정과 연결된 기록</strong>
          {events.length === 0 ? (
            <p>아직 연결된 일정이 없어요. 일정을 등록하면 지출을 자동으로 묶어요.</p>
          ) : (
            <p>
              {events
                .map((event) => {
                  const status = eventStatus(event, now)
                  const spend = eventSpend(event, now)
                  return `${event.title} ${
                    status === "upcoming"
                      ? `D-${daysUntil(now, event.start)}`
                      : status === "ongoing"
                        ? "진행 중"
                        : "지남"
                  } · ${spend.count > 0 ? `${spend.count}건 ${won(spend.total)}` : "묶인 지출 없음"}`
                })
                .join("\n")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- 지출 조언 ----------
type Advice = { title: string; copy: string; facts: string[]; link?: [string, "fridge" | "closet" | "settlement"] }
const advices: Record<UTMode, Advice[]> = {
  confirm: [
    {
      title: "식비·배달을 먼저 모아볼 수 있어요",
      copy: "다이어트 모드를 켜면 식비와 배달 횟수를 홈 맨 위에서 볼 수 있어요. 켜는 건 언제든 내가 정해요.",
      facts: [`이번 주 배달 ${dietByStage.confirm.delivery}회`, `식비 ${won(dietByStage.confirm.food)}`],
    },
    {
      title: "일정을 등록하면 지출이 자동으로 묶여요",
      copy: "시험기간과 여행을 등록해 두면 그 기간의 지출을 따로 모아 드려요.",
      facts: ["시험기간 12/9~20", "제주 여행 12/22~24"],
    },
  ],
  exam: [
    {
      title: "늦은 밤 결제가 이어진 날이 있었어요",
      copy: "밤 11시대에 옷 결제가 5건 이어졌고 새벽 1시에는 택시를 탔어요. 비슷한 날을 미리 알려드릴 수 있어요.",
      facts: [`오늘 ${won(todayTotal)}`, `평소 하루 ${won(usualTotal)}`],
    },
    {
      title: "냉장고에 해먹을 재료가 있어요",
      copy: "배달이 겹치는 주에는 냉장고 재료로 만들 수 있는 메뉴를 먼저 보여드릴게요.",
      facts: [`이번 주 배달 ${dietByStage.exam.delivery}회`, "보유 재료 4개"],
      link: ["냉장고 보기", "fridge"],
    },
  ],
  prepare: [
    {
      title: "항공권은 그룹 지출로 나눌 수 있어요",
      copy: "3명이 나누면 1인당 120,000원이에요. 정산은 여행이 끝난 뒤 한 번에 해요.",
      facts: ["항공권 360,000원", "1인당 120,000원"],
    },
    {
      title: "여행 전 지출은 따로 모아둘게요",
      copy: "출발 전에 결제한 항목은 '준비'로, 현지 결제는 '현지'로 나눠서 여행 리포트에 담아요.",
      facts: ["준비 / 현지로 구분"],
    },
  ],
  travel: [
    {
      title: "여행 중에는 알림을 줄였어요",
      copy: "결제는 제주 위치 기준으로 여행에 자동으로 묶고 있어요. 정산은 돌아와서 해도 늦지 않아요.",
      facts: [`정산 대기 ${trip.items.length}건`, `${won(trip.total)}`],
      link: ["정산 대기함 보기", "settlement"],
    },
    {
      title: "오늘 식비가 가장 컸어요",
      copy: "해녀 식당 한 곳이 오늘 지출의 대부분이에요. 3명이 함께 먹었다면 정산에서 나눠져요.",
      facts: [`오늘 ${won(dayTotal(days.travel))}`, "식비 132,000원"],
    },
  ],
  after: [
    {
      title: "이번 여행 내 몫은 이렇게 쓰였어요",
      copy: "교통과 숙박이 대부분이었고 현지 식비와 관광은 비교적 적었어요.",
      facts: [`내 몫 ${won(trip.perPerson)}`, `교통 ${won(trip.byCategory.교통)}`, `숙박 ${won(trip.byCategory.숙박)}`],
    },
    {
      title: "입은 옷은 옷장에 남아 있어요",
      copy: "여행 전에 산 옷들을 종류별로 볼 수 있어요.",
      facts: ["옷 12벌"],
      link: ["옷장 보기", "closet"],
    },
  ],
  monthLater: [
    {
      title: "지난 한 달, 해먹은 날이 늘었어요",
      copy: "해먹은 날 9일, 아낀 돈 80,000원이에요. 다음 한 달도 같은 목표로 이어갈 수 있어요.",
      facts: ["해먹은 날 9일", "아낀 돈 80,000원"],
    },
    {
      title: "평소 하루로 돌아왔어요",
      copy: "오늘 결제는 카페와 편의점, 지하철이에요. 평소 하루와 비슷한 흐름이에요.",
      facts: [`오늘 ${won(dayTotal(days.monthLater))}`],
    },
  ],
}

export function CoachAdvice({
  back,
  mode,
  nudgeOn,
  toggleNudge,
  open,
}: {
  back: () => void
  mode: UTMode
  nudgeOn: boolean
  toggleNudge: () => void
  open: (target: "fridge" | "closet" | "settlement") => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 조언" />
      <div className="insight-content">
        <div className="main-card advice-optin">
          <div>
            <strong>비슷한 날 미리 알려주기</strong>
            <p>평가하지 않고, 패턴이 겹치는 순간에만 조용히 알려드려요.</p>
          </div>
          <Toggle on={nudgeOn} onClick={toggleNudge} />
        </div>
        <p className="section-title">{stageDate(mode)} 기준 조언</p>
        {advices[mode].map((advice) => (
          <div className="main-card insight-card" key={advice.title}>
            <strong>{advice.title}</strong>
            <p>{advice.copy}</p>
            <div className="reason-chips">
              {advice.facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            {advice.link && (
              <Action
                className="mini-secondary advice-link"
                onClick={() => open(advice.link![1])}
              >
                {advice.link[0]}
              </Action>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
