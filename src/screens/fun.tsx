import { useState } from "react"
import {
  Check,
  ChevronDown,
  Coins,
  Footprints,
  Gift,
  History,
  Sparkles,
  Utensils,
  Smile,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import { type Day, dayCategories, dayTotal, days } from "@/lib/days"
import { type UTMode } from "@/lib/ut"

// 놀이터 탭: 시간 날 때 가볍게 즐기는 것들. 무언가를 하라고 재촉하지 않는다.
// 날짜·결제는 지금 홈 단계(lib/days.ts)를 따른다.

const stageOrder: UTMode[] = [
  "confirm",
  "exam",
  "prepare",
  "travel",
  "after",
  "monthLater",
]
const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`

// 탭을 오가도 받은 포인트가 유지되도록 모듈에 둔다 (목업)
const funState = {
  points: 1240,
  stamped: false,
  claimed: [] as string[],
}

const missions = [
  {
    key: "mood",
    icon: <Smile size={17} strokeWidth={1.6} />,
    title: "기분 원탭 기록",
    sub: "오늘 기분을 남기면 자동으로 쌓여요",
    points: 20,
  },
  {
    key: "steps",
    icon: <Footprints size={17} strokeWidth={1.6} />,
    title: "걸음 3,000보",
    sub: "건강 앱 걸음수로 확인했어요",
    points: 20,
  },
  {
    key: "food",
    icon: <Utensils size={17} strokeWidth={1.6} />,
    title: "식단 사진 1장",
    sub: "사진만 올리면 링키가 알아봐요",
    points: 30,
  },
]
const rewardGoal = 2000

// 오늘의 운세: 단계(날짜)마다 하나씩. 평가 없이 가볍게.
const fortunes: Record<
  UTMode,
  { title: string; copy: string; menu: string; color: string; number: number }
> = {
  confirm: {
    title: "계획이 술술 풀리는 날",
    copy: "미뤄둔 약속 하나가 자연스럽게 정해질지도 몰라요.",
    menu: "김치볶음밥",
    color: "라임",
    number: 3,
  },
  exam: {
    title: "작은 쉼표가 필요한 날",
    copy: "바쁜 하루 사이에 좋아하는 것 하나쯤 챙겨도 좋아요.",
    menu: "따뜻한 우동",
    color: "하늘색",
    number: 12,
  },
  prepare: {
    title: "설렘이 차오르는 날",
    copy: "곧 떠날 곳을 떠올리면 하루가 조금 가벼워질 거예요.",
    menu: "제주 감귤 주스",
    color: "주황",
    number: 22,
  },
  travel: {
    title: "발길 닿는 대로 좋은 날",
    copy: "계획에 없던 장소에서 오래 기억할 장면을 만날지도 몰라요.",
    menu: "고기국수",
    color: "바다색",
    number: 7,
  },
  after: {
    title: "일상으로 천천히 돌아오는 날",
    copy: "여행의 여운을 사진 한 장으로 다시 꺼내 봐도 좋아요.",
    menu: "분식",
    color: "베이지",
    number: 27,
  },
  monthLater: {
    title: "익숙한 하루가 편안한 날",
    copy: "평소 가던 카페에서 새로운 메뉴를 골라봐도 재미있어요.",
    menu: "바닐라 라떼",
    color: "크림",
    number: 24,
  },
}

export function FunPage({ stage }: { stage: UTMode }) {
  const [points, setPoints] = useState(funState.points)
  const [stamped, setStamped] = useState(funState.stamped)
  const [claimed, setClaimed] = useState<string[]>(funState.claimed)
  const [fortuneOpen, setFortuneOpen] = useState(false)
  const [openReport, setOpenReport] = useState<UTMode>()
  const [answer, setAnswer] = useState<string>()

  const addPoints = (amount: number) => {
    funState.points += amount
    setPoints(funState.points)
  }
  const stamp = () => {
    if (stamped) return
    funState.stamped = true
    setStamped(true)
    addPoints(10)
  }
  const claim = (key: string, amount: number) => {
    if (claimed.includes(key)) return
    funState.claimed = [...funState.claimed, key]
    setClaimed(funState.claimed)
    addPoints(amount)
  }

  const today = days[stage]
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
  // 출석 스탬프: 이번 주 오늘 전까지는 출석한 것으로 (목업)
  const todayWeekday = weekdayOf(today.date)
  const fortune = fortunes[stage]
  const pastStages = stageOrder.slice(0, stageOrder.indexOf(stage))
  const quizCategories = dayCategories(today)
  const quizAnswer = quizCategories[0]?.[0]
  const quizOptions = [...quizCategories.map(([label]) => label)]
    .concat(["배달", "쇼핑", "카페", "교통"])
    .filter((label, index, list) => list.indexOf(label) === index)
    .slice(0, 4)
    .sort()

  return (
    <>
      <MainHeader title="놀이터" />
      <div className="fun-content">
        {/* 1. 앱테크: 링키 포인트 */}
        <div className="main-card fun-points">
          <div className="fun-heading">
            <span>
              <Coins size={14} strokeWidth={1.7} /> 링키 포인트
            </span>
            <small>기록하면 자동으로 쌓여요</small>
          </div>
          <strong className="fun-points-total">
            {points.toLocaleString("ko-KR")}
            <small>P</small>
          </strong>
          <div className="fun-progress" aria-hidden="true">
            <i style={{ width: `${Math.min((points / rewardGoal) * 100, 100)}%` }} />
          </div>
          <p className="fun-caption">
            {points >= rewardGoal
              ? "커피 쿠폰으로 바꿀 수 있어요"
              : `커피 쿠폰까지 ${(rewardGoal - points).toLocaleString("ko-KR")}P`}
          </p>

          <div className="fun-stamps">
            {weekdays.map((day, index) => {
              const done = index < todayWeekday || (index === todayWeekday && stamped)
              const isToday = index === todayWeekday
              return (
                <Action
                  className={cx(
                    "fun-stamp",
                    done && "done",
                    isToday && "today",
                  )}
                  disabled={!isToday || stamped}
                  key={day}
                  label={`${day}요일 출석`}
                  onClick={stamp}
                >
                  <span>{day}</span>
                  <i>{done ? <Check size={13} strokeWidth={2.4} /> : isToday ? "+10" : ""}</i>
                </Action>
              )
            })}
          </div>
          <p className="fun-caption">
            {stamped ? "오늘 출석했어요 · +10P" : "오늘 칸을 누르면 출석이에요"}
          </p>

          <div className="fun-missions">
            {missions.map((mission) => {
              const done = claimed.includes(mission.key)
              return (
                <div className="fun-mission" key={mission.key}>
                  <span className="fun-mission-icon">{mission.icon}</span>
                  <div>
                    <strong>{mission.title}</strong>
                    <span>{mission.sub}</span>
                  </div>
                  <Action
                    className={cx("fun-claim", done && "done")}
                    disabled={done}
                    onClick={() => claim(mission.key, mission.points)}
                  >
                    {done ? "받았어요" : `+${mission.points}P`}
                  </Action>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. 오늘의 운세 */}
        <Action
          className={cx("main-card fun-fortune", fortuneOpen && "open")}
          onClick={() => setFortuneOpen(true)}
        >
          <div className="fun-heading">
            <span>
              <Sparkles size={14} strokeWidth={1.7} /> 오늘의 운세
            </span>
            <small>{today.date}</small>
          </div>
          {fortuneOpen ? (
            <>
              <strong className="fun-fortune-title">{fortune.title}</strong>
              <p className="fun-fortune-copy">{fortune.copy}</p>
              <div className="fun-lucky">
                <span>
                  행운의 메뉴<b>{fortune.menu}</b>
                </span>
                <span>
                  행운의 색<b>{fortune.color}</b>
                </span>
                <span>
                  행운의 숫자<b>{fortune.number}</b>
                </span>
              </div>
            </>
          ) : (
            <div className="fun-fortune-cover">
              <Gift size={26} strokeWidth={1.4} />
              <span>카드를 눌러 오늘의 운세를 열어봐요</span>
            </div>
          )}
        </Action>

        {/* 3. 퀴즈 */}
        {quizAnswer && (
          <div className="main-card fun-quiz">
            <div className="fun-heading">
              <span>
                <Sparkles size={14} strokeWidth={1.7} /> 기록 퀴즈
              </span>
              <small>오늘 {today.expenses.length}건</small>
            </div>
            <p className="fun-quiz-question">
              오늘 가장 많이 쓴 곳은 어디일까요?
            </p>
            <div className="fun-quiz-options">
              {quizOptions.map((option) => (
                <Action
                  className={cx(
                    "fun-quiz-option",
                    answer && option === quizAnswer && "correct",
                    answer === option && option !== quizAnswer && "wrong",
                  )}
                  disabled={answer !== undefined}
                  key={option}
                  onClick={() => setAnswer(option)}
                >
                  {option}
                </Action>
              ))}
            </div>
            {answer && (
              <p className="fun-caption">
                {answer === quizAnswer ? "정답이에요! " : ""}
                {/* 금액은 항상 '원'으로 끝나서 조사는 '으로' */}
                {quizAnswer} {won(quizCategories[0][1])}으로 오늘 가장 많았어요
              </p>
            )}
          </div>
        )}

        {/* 4. 과거 리포트 */}
        <div className="main-card fun-history">
          <div className="fun-heading">
            <span>
              <History size={14} strokeWidth={1.7} /> 지난 하루 다시 보기
            </span>
          </div>
          {pastStages.length ? (
            <div className="fun-history-list">
              {[...pastStages].reverse().map((past) => (
                <PastDay
                  day={days[past]}
                  key={past}
                  open={openReport === past}
                  toggle={() =>
                    setOpenReport(openReport === past ? undefined : past)
                  }
                />
              ))}
            </div>
          ) : (
            <p className="fun-caption">
              기록이 쌓이면 지난 하루를 다시 볼 수 있어요
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function PastDay({
  day,
  open,
  toggle,
}: {
  day: Day
  open: boolean
  toggle: () => void
}) {
  const total = dayTotal(day)
  const categories = dayCategories(day)
  return (
    <div className={cx("fun-past", open && "open")}>
      <Action className="fun-past-row" onClick={toggle}>
        <div>
          <strong>{day.date}</strong>
          <span>
            {day.expenses.length}건 · {won(total)} · {categories[0]?.[0]} 가장 많음
          </span>
        </div>
        <ChevronDown size={16} strokeWidth={1.6} />
      </Action>
      {open && (
        <div className="fun-past-detail">
          {categories.map(([label, amount]) => (
            <div className="fun-past-bar" key={label}>
              <span>{label}</span>
              <i>
                <b style={{ width: `${(amount / total) * 100}%` }} />
              </i>
              <strong>{Math.round((amount / total) * 100)}%</strong>
            </div>
          ))}
          <p>
            {day.expenses.map((expense) => expense.name).join(" · ")}
          </p>
        </div>
      )}
    </div>
  )
}

// "12월 12일" → 요일 번호(일=0). 2024년 11·12월, 2025년 1월 기준.
function weekdayOf(date: string) {
  const [month, dayOfMonth] = date.match(/\d+/g)!.map(Number)
  const year = month === 1 ? 2025 : 2024
  return new Date(year, month - 1, dayOfMonth).getDay()
}
