import {
  ChevronRight,
  CircleDollarSign,
  CalendarDays,
  Car,
  MapPin,
  MessageCircleMore,
  Plane,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { Action, StatusChip, cx } from "@/components/common"
import { HomeSegments } from "@/components/layout"
import { HealthCard } from "@/screens/health"
import { shoppingGroups } from "@/screens/shopping"
import {
  todayByCategory,
  todayExpenses,
  todayTotal,
  usualDaily,
  usualTotal,
  won,
} from "@/lib/today"
import { MainHeader } from "@/components/layout"
import { type UTMode } from "@/lib/ut"
import { type Tone } from "@/types"

export function WeekCalendar({
  confirmMode = false,
  scheduleRegistered = false,
  travelMode = false,
  prepareMode = false,
  afterMode = false,
  monthLaterMode = false,
}: {
  confirmMode?: boolean
  scheduleRegistered?: boolean
  travelMode?: boolean
  prepareMode?: boolean
  afterMode?: boolean
  monthLaterMode?: boolean
}) {
  // 여행 확정: 시험 3주 전(11월 18일 주). 일정은 아직 이 주에 걸리지 않는다.
  const dates = confirmMode
    ? [
        ["월", "18"],
        ["화", "19"],
        ["수", "20"],
        ["목", "21"],
        ["금", "22"],
        ["토", "23"],
        ["일", "24"],
      ]
    : monthLaterMode
    ? [
        ["월", "20"],
        ["화", "21"],
        ["수", "22"],
        ["목", "23"],
        ["금", "24"],
        ["토", "25"],
        ["일", "26"],
      ]
    : travelMode || afterMode
      ? [
          ["일", "22"],
          ["월", "23"],
          ["화", "24"],
          ["수", "25"],
          ["목", "26"],
          ["금", "27"],
          ["토", "28"],
        ]
      : prepareMode
        ? [
            ["월", "16"],
            ["화", "17"],
            ["수", "18"],
            ["목", "19"],
            ["금", "20"],
            ["토", "21"],
            ["일", "22"],
          ]
        : [
            ["월", "9"],
            ["화", "10"],
            ["수", "11"],
            ["목", "12"],
            ["금", "13"],
            ["토", "14"],
            ["일", "15"],
          ]
  return (
    <div className="main-card calendar-strip">
      <div className="block-heading">
        <strong>이번 주</strong>
        <span>
          {confirmMode ? "11월" : monthLaterMode ? "1월" : "12월"}
        </span>
      </div>
      <div className="week-grid">
        {dates.map(([day, date], index) => (
          <div
            className={cx(
              "week-day",
              (monthLaterMode
                ? index === 4
                : afterMode
                  ? index === 5
                  : travelMode
                    ? index === 1
                    : prepareMode
                      ? index === 4
                      : index === 3) && "today",
            )}
            key={date}
          >
            <span>{day}</span>
            <strong>{date}</strong>
            <i className={cx([0, 2, 3, 5].includes(index) && "has-payment")} />
          </div>
        ))}
      </div>
      {confirmMode ? (
        scheduleRegistered && (
          <div className="upcoming-lines">
            <span className="upcoming-exam">시험기간 12/9~20</span>
            <span className="upcoming-travel">제주 여행 12/22~24</span>
          </div>
        )
      ) : monthLaterMode ? null : afterMode ? (
        <div className="after-event-lines">
          <span className="past-exam">시험기간</span>
          <span className="past-travel">제주 여행 · 12/22~24</span>
        </div>
      ) : prepareMode ? (
        <div className="prepare-event-lines">
          <span className="exam-ending">시험기간</span>
          <span className="travel-start">제주 여행</span>
        </div>
      ) : (
        <div
          className={cx(
            "event-line",
            travelMode ? "travel-event-line" : "exam-event-line",
          )}
        >
          <span>
            {travelMode ? "제주 여행 · 12/22~24" : "시험기간 · 12/20까지"}
          </span>
        </div>
      )}
    </div>
  )
}
export function SpendingCard({
  confirmMode,
  pendingCount,
  flightPersonal,
  openExpense,
  travelMode,
  prepareMode,
  afterMode,
  monthLaterMode,
  openSettlement,
}: {
  confirmMode: boolean
  pendingCount: number
  flightPersonal: boolean
  // 구매처를 누르면 그 구매처의 지출 상세(U3-1)를 연다
  openExpense: (merchant?: string) => void
  travelMode: boolean
  prepareMode: boolean
  afterMode: boolean
  monthLaterMode: boolean
  openSettlement: () => void
}) {
  const todayIcons = {
    쇼핑: <ShoppingBag size={17} strokeWidth={1.5} />,
    배달: <UtensilsCrossed size={17} strokeWidth={1.5} />,
    교통: <Car size={17} strokeWidth={1.5} />,
  }
  const standardRows = todayExpenses.map((expense) => ({
    icon: todayIcons[expense.category],
    name: expense.name,
    merchant: expense.merchant,
    note: expense.note,
    amount: won(expense.amount),
    status: false,
  }))
  // 시험기간 오늘 지출: 옷 결제는 구매처별로 묶어 보여주고, 누르면 구매 항목을 복원한다(U3-1)
  const examRows = [
    ...shoppingGroups().map((group) => ({
      icon: todayIcons["쇼핑"],
      name: group.merchant,
      merchant: `옷 ${group.items.length}건`,
      amount: won(group.total),
      status: false,
      expenseMerchant: group.merchant,
    })),
    ...standardRows.filter(
      (_, index) => todayExpenses[index].category !== "쇼핑",
    ),
  ]
  const confirmRows = [
    {
      icon: <UtensilsCrossed size={17} strokeWidth={1.5} />,
      name: "학식",
      merchant: "학생식당",
      amount: "6,000원",
      status: false,
    },
    {
      icon: <ShoppingBag size={17} strokeWidth={1.5} />,
      name: "카페",
      merchant: "스터디 카페",
      amount: "4,500원",
      status: false,
    },
    {
      icon: <CircleDollarSign size={17} strokeWidth={1.5} />,
      name: "지하철",
      merchant: "교통",
      amount: "1,500원",
      status: false,
    },
  ]
  // 여행 후(D+5, 12월 27일): 여행에서 돌아온 뒤의 일상 결제
  const afterRows = [
    {
      icon: <Car size={17} strokeWidth={1.5} />,
      name: "공항버스",
      merchant: "교통",
      amount: "17,000원",
      status: false,
    },
    {
      icon: <UtensilsCrossed size={17} strokeWidth={1.5} />,
      name: "해장국",
      merchant: "식비",
      amount: "9,000원",
      status: false,
    },
    {
      icon: <ShoppingBag size={17} strokeWidth={1.5} />,
      name: "카페",
      merchant: "스터디 카페",
      amount: "5,500원",
      status: false,
    },
  ]
  // 여행 준비 날(12월 20일)은 옷 쇼핑 없이 생활 결제만 (항공권과 함께)
  const lifeIndexes = todayExpenses
    .map((expense, index) => (expense.category === "쇼핑" ? -1 : index))
    .filter((index) => index >= 0)
  const lifeRows = lifeIndexes.map((index) => standardRows[index])
  const lifeTotal = lifeIndexes.reduce(
    (sum, index) => sum + todayExpenses[index].amount,
    0,
  )
  const rows: Array<{
    icon: ReactNode
    name: string
    merchant: string
    note?: string
    tripTag?: boolean
    amount: string
    status: boolean
    expenseMerchant?: string
  }> = confirmMode
    ? confirmRows
    : afterMode
    ? afterRows
    : monthLaterMode
    ? [
        {
          icon: <UtensilsCrossed size={17} strokeWidth={1.5} />,
          name: "스타벅스",
          merchant: "카페",
          amount: "6,500원",
          status: false,
        },
        {
          icon: <ShoppingBag size={17} strokeWidth={1.5} />,
          name: "편의점",
          merchant: "간식",
          amount: "3,200원",
          status: false,
        },
        {
          icon: <CircleDollarSign size={17} strokeWidth={1.5} />,
          name: "지하철",
          merchant: "교통",
          amount: "1,500원",
          status: false,
        },
      ]
    : travelMode
      ? [
          {
            icon: <UtensilsCrossed size={17} strokeWidth={1.5} />,
            name: "해녀 식당",
            merchant: "제주 성산",
            tripTag: true,
            amount: "132,000원",
            status: false,
          },
          {
            icon: <MapPin size={17} strokeWidth={1.5} />,
            name: "성산일출봉 입장료",
            merchant: "관광",
            tripTag: true,
            amount: "15,000원",
            status: false,
          },
          {
            icon: <ShoppingBag size={17} strokeWidth={1.5} />,
            name: "제주 공항 편의점",
            merchant: "제주 공항",
            tripTag: true,
            amount: "18,000원",
            status: false,
          },
        ]
      : prepareMode
        ? [
            {
              icon: <Plane size={17} strokeWidth={1.5} />,
              name: "항공권",
              merchant: flightPersonal ? "개인 지출" : "제주 여행 · 3명",
              amount: "360,000원",
              status: !flightPersonal,
            },
            ...lifeRows,
          ]
        : examRows
  return (
    <div className="main-card spending-card">
      <div className="spending-top">
        <div>
          <span>오늘 지출</span>
          <p>
            오늘{" "}
            {confirmMode
              ? "3건 · 12,000원"
              : afterMode
              ? "3건 · 31,500원"
              : monthLaterMode
              ? "3건 · 11,200원"
              : prepareMode
                ? `${1 + lifeRows.length}건 · ${won(360000 + lifeTotal)}`
                : travelMode
                  ? "3건 · 165,000원"
                  : `${todayExpenses.length}건 · ${won(todayTotal)}`}
          </p>
        </div>
        <Action
          className={cx(
            "pending-count",
            travelMode && "has-pending",
            afterMode && "settlement-complete",
          )}
          onClick={travelMode ? openSettlement : undefined}
        >
          {afterMode ? "정산 완료" : `정산 대기 ${travelMode ? pendingCount : 0}건`}
        </Action>
      </div>
      <div className="spending-list">
        {rows.map((row) => (
          <Action
            className="spending-row"
            key={row.name}
            onClick={
              row.expenseMerchant
                ? () => openExpense(row.expenseMerchant)
                : undefined
            }
          >
            <span className="expense-icon">{row.icon}</span>
            <div>
              <strong>{row.name}</strong>
              {row.merchant && <span>{row.merchant}</span>}
              {row.note && (
                <span className="row-note">{row.note}</span>
              )}
              {row.tripTag && (
                // U8-1: 제주 위치 결제는 여행 태그로 자동 묶임
                <span className="trip-tag">📍 제주 여행</span>
              )}
            </div>
            {row.status && <StatusChip type="check" />}
            <p>{row.amount}</p>
          </Action>
        ))}
      </div>
    </div>
  )
}
export function DietSummaryCard() {
  return (
    <div className="main-card diet-summary">
      <div className="block-heading">
        <strong>식비·배달</strong>
        <span>이번 주</span>
      </div>
      <div className="diet-stats">
        <div>
          <span>배달</span>
          <strong>2회</strong>
        </div>
        <i />
        <div>
          <span>식비</span>
          <strong>38,000원</strong>
        </div>
      </div>
    </div>
  )
}
export function GoalAchievementSummary() {
  return (
    <div className="main-card goal-achievement-summary">
      <div className="block-heading">
        <strong>목표 달성 요약</strong>
        <span>지난 한 달</span>
      </div>
      <div>
        <p>
          해먹은 날 <strong>9일</strong>
        </p>
        <i />
        <p>
          아낀 돈 <strong>80,000원</strong>
        </p>
      </div>
    </div>
  )
}
export function HomeReport({
  tone,
  daily,
  openInsight,
}: {
  tone: Tone
  // 시험기간(12월 12일)에는 일간 리포트, 그 밖의 시점은 기존 주간 리포트
  daily: boolean
  openInsight: () => void
}) {
  const categories = Object.entries(todayByCategory).sort(
    (a, b) => b[1] - a[1],
  )
  // 일간 리포트만 눌러서 인사이트로 이동. 주간 카드는 누를 수 있는 것처럼 보이지 않게 일반 박스로 둔다.
  const Wrapper = daily ? Action : "div"
  return (
    <Wrapper
      className="main-card home-report"
      {...(daily ? { onClick: openInsight } : {})}
    >
      <div className="block-heading">
        <strong>{daily ? "린이의 일간 리포트" : "린이의 주간 리포트"}</strong>
        <span className="linky-badge">
          <Sparkles size={12} strokeWidth={1.5} /> Linky
        </span>
      </div>
      {tone === "narrative" ? (
        <div className="report-quote">
          {daily
            ? "“새벽에 택시를 탔고, 저녁에는 배달, 밤에는 옷 결제가 있었어요.”"
            : "“시험을 준비한 날엔 카페 결제가 있었고, 일정이 끝난 저녁에는 배달 주문이 있었어요.”"}
        </div>
      ) : daily ? (
        <div className="home-bars">
          {categories.map(([label, amount]) => (
            <div className="home-bar" key={label}>
              <span>{label}</span>
              <i>
                <b style={{ width: `${(amount / todayTotal) * 100}%` }} />
              </i>
              <strong>{Math.round((amount / todayTotal) * 100)}%</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="home-bars">
          {[
            ["식비", "48%", "bar-long"],
            ["쇼핑", "35%", "bar-mid"],
            ["교통", "17%", "bar-short"],
          ].map(([label, value, width]) => (
            <div className="home-bar" key={label}>
              <span>{label}</span>
              <i>
                <b className={width} />
              </i>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      {daily && (
        <span className="home-report-more">
          평소와 비교한 인사이트 보기 <ChevronRight size={13} strokeWidth={1.6} />
        </span>
      )}
    </Wrapper>
  )
}
// 일간 리포트를 눌렀을 때 열리는 화면: 오늘 소비가 평소 하루와 어떻게 다른지
export function DailyInsight({ tone, back }: { tone: Tone; back: () => void }) {
  const difference = todayTotal - usualTotal
  const ratio = (todayTotal / usualTotal).toFixed(1)
  const compare = (["쇼핑", "교통", "배달", "기타"] as const).map((label) => ({
    label,
    today: todayByCategory[label] ?? 0,
    usual: usualDaily[label],
  }))
  const largest = Math.max(...compare.flatMap((row) => [row.today, row.usual]))
  const timeline = [...todayExpenses].sort((a, b) =>
    a.time.localeCompare(b.time),
  )
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="오늘의 인사이트" />
      <div className="insight-content">
        <div className="insight-hero">
          <span>12월 12일 · 평소 하루와 비교</span>
          <strong>{won(todayTotal)}</strong>
          <p>
            평소 하루 평균 {won(usualTotal)}보다 {won(difference)} 많았어요
            (약 {ratio}배)
          </p>
        </div>
        {tone === "narrative" ? (
          <div className="insight-cards">
            {[
              [
                "옷에 쓴 비중이 평소와 달랐어요",
                `평소 하루 ${won(usualDaily.쇼핑)} 정도였던 쇼핑이 오늘은 ${won(todayByCategory.쇼핑)}이에요. 밤 11시 20분대부터 에이블리·무신사·지그재그에서 옷 5벌을 이어서 결제했어요.`,
              ],
              [
                "이동이 평소보다 길었어요",
                `새벽 1시에 경희대학교 서울캠퍼스에서 강남역 3번출구까지 택시를 탔어요. 평소 하루 교통비는 ${won(usualDaily.교통)} 정도예요.`,
              ],
              [
                "친구와의 하루가 함께 남았어요",
                "이별을 겪은 친구와 먹죽 day로 기록된 날이에요. 오늘의 이동과 저녁 배달은 그 약속과 이어져 있어요.",
              ],
            ].map(([title, copy]) => (
              <div className="main-card insight-card" key={title}>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="main-card insight-compare">
            <div className="block-heading">
              <strong>카테고리별 오늘 vs 평소</strong>
              <span>하루 기준</span>
            </div>
            {compare.map((row) => (
              <div className="insight-row" key={row.label}>
                <span>{row.label}</span>
                <i>
                  <b style={{ width: `${(row.today / largest) * 100}%` }} />
                  <u style={{ left: `${(row.usual / largest) * 100}%` }} />
                </i>
                <strong>
                  {won(row.today)}
                  <small>평소 {won(row.usual)}</small>
                </strong>
              </div>
            ))}
            <p className="insight-legend">
              <b /> 오늘 <u /> 평소 평균
            </p>
          </div>
        )}
        <div className="main-card insight-time">
          <div className="block-heading">
            <strong>결제 시간대</strong>
            <span>평소와 다른 점</span>
          </div>
          <div className="insight-timeline">
            {timeline.map((expense) => (
              <div key={expense.name}>
                <time>{expense.time}</time>
                <span>
                  {expense.name} · {won(expense.amount)}
                </span>
              </div>
            ))}
          </div>
          <p>
            평소 결제는 낮 12시~오후 6시에 몰려 있어요. 오늘은 새벽과 밤 시간대
            결제가 있었어요.
          </p>
        </div>
      </div>
    </div>
  )
}
export function GroupSuggestion({
  reject,
  accept,
}: {
  reject: () => void
  accept: () => void
}) {
  return (
    <div className="group-suggestion">
      <div className="group-suggestion-top">
        <span>
          <Users size={18} strokeWidth={1.5} />
        </span>
        <p>항공권 360,000원, 그룹 지출 같아요</p>
      </div>
      <div className="reason-chips">
        <span>제주 여행 태그 · 3명</span>
        <span>12/22 출발편</span>
      </div>
      <div className="suggestion-actions">
        <Action className="mini-secondary" onClick={reject}>
          아니요
        </Action>
        <Action className="mini-primary" onClick={accept}>
          네
        </Action>
      </div>
    </div>
  )
}
export function TravelStoryPreview({ open }: { open: () => void }) {
  return (
    <Action className="travel-story-preview" onClick={open}>
      <span>
        <Plane size={27} strokeWidth={1.4} />
      </span>
      <div>
        <strong>제주 여행 다녀왔어요</strong>
        <p>여행 이야기를 한 장씩 모아봤어요</p>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </Action>
  )
}
// 🅑 수치형 톤: 여행 비용 리포트(U10-1B) 진입점
export function TravelCostPreview({ open }: { open: () => void }) {
  return (
    <Action className="travel-story-preview" onClick={open}>
      <span>
        <CircleDollarSign size={27} strokeWidth={1.4} />
      </span>
      <div>
        <strong>제주 여행 비용 리포트</strong>
        <p>1인 실제 비용을 정리했어요</p>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </Action>
  )
}
// 여행 확정 단계(U0·U1)의 홈 진입 카드: 일정 등록 → 목표 모드
export function ScheduleEntry({
  registered,
  open,
}: {
  registered: boolean
  open: () => void
}) {
  const Wrapper = registered ? "div" : Action
  return (
    <Wrapper
      className="health-detection home-entry"
      {...(registered ? {} : { onClick: open })}
    >
      <span className="health-card-icon">
        <CalendarDays size={19} strokeWidth={1.5} />
      </span>
      <div>
        <strong>
          {registered ? "일정을 불러왔어요" : "단톡 캡처로 일정을 등록해요"}
        </strong>
        <span>
          {registered
            ? "시험기간 12/9~20 · 제주 여행 12/22~24 · 지출을 자동으로 묶어요"
            : "시험·여행 일정을 한 번에 가져와요"}
        </span>
      </div>
      {!registered && <ChevronRight size={17} strokeWidth={1.5} />}
    </Wrapper>
  )
}
export function GoalEntry({ open }: { open: () => void }) {
  return (
    <Action className="health-detection home-entry" onClick={open}>
      <span className="health-card-icon">
        <Sparkles size={19} strokeWidth={1.5} />
      </span>
      <div>
        <strong>다이어트를 시작할까요?</strong>
        <span>목표 모드를 켜면 식비·배달을 먼저 보여드려요</span>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </Action>
  )
}
// 여행 후 단계(U10-2) 진입점
export function GoalAchievementPreview({ open }: { open: () => void }) {
  return (
    <Action className="travel-story-preview" onClick={open}>
      <span>
        <Sparkles size={27} strokeWidth={1.4} />
      </span>
      <div>
        <strong>목표 달성 관리</strong>
        <p>해먹은 날과 아낀 돈을 모아봤어요</p>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </Action>
  )
}
export function HomePage({
  tone,
  dietMode,
  savingMode,
  profile,
  openExpense,
  confirmMode,
  scheduleRegistered,
  openCapture,
  openGoals,
  openGoalAchievement,
  travelMode,
  groupSuggestion,
  rejectGroup,
  acceptGroup,
  openSettlement,
  openStory,
  openCost,
  openInsight,
  pendingCount,
  showSegments = true,
  openMood,
  healthEnabled,
  healthDeclined,
  openHealthConsent,
  prepareMode,
  afterMode,
  flightPersonal,
  nudgeOn,
  monthLaterMode,
  selectMode,
}: {
  tone: Tone
  dietMode: boolean
  savingMode: boolean
  profile: () => void
  openExpense: (merchant?: string) => void
  confirmMode: boolean
  scheduleRegistered: boolean
  openCapture: () => void
  openGoals: () => void
  openGoalAchievement: () => void
  travelMode: boolean
  groupSuggestion: boolean
  rejectGroup: () => void
  acceptGroup: () => void
  openSettlement: () => void
  openStory: () => void
  openCost: () => void
  openInsight: () => void
  pendingCount: number
  showSegments?: boolean
  openMood: () => void
  healthEnabled: boolean
  healthDeclined: boolean
  openHealthConsent: () => void
  prepareMode: boolean
  afterMode: boolean
  flightPersonal: boolean
  nudgeOn: boolean
  monthLaterMode: boolean
  selectMode: (mode: UTMode) => void
}) {
  const [observation, setObservation] = useState(true)
  // 뱃지는 사용자가 켠 목표 모드가 있을 때만 노출 (다이어트 우선)
  const activeGoal = dietMode ? "다이어트 모드" : savingMode ? "절약 모드" : ""
  const examMode =
    !confirmMode && !travelMode && !prepareMode && !afterMode && !monthLaterMode
  const mode: UTMode = confirmMode
    ? "confirm"
    : travelMode
      ? "travel"
      : prepareMode
        ? "prepare"
        : afterMode
          ? "after"
          : monthLaterMode
            ? "monthLater"
            : "exam"
  return (
    <>
      <div className="home-header">
        <div className="brand main-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
        <div className="home-actions">
          <div className="profile-control">
            {showSegments && <HomeSegments mode={mode} select={selectMode} />}
          </div>
          <Action className="profile-icon" onClick={profile} label="프로필">
            <UserRound size={17} strokeWidth={1.5} />
          </Action>
          <Action
            className={cx(
              "round-icon",
              (travelMode || prepareMode || afterMode) && "has-notification",
            )}
            label="AI 코치"
            onClick={openMood}
          >
            <MessageCircleMore size={19} strokeWidth={1.5} />
            {(travelMode || prepareMode || afterMode) && (
              <span className="notification-badge">
                {afterMode ? "1" : prepareMode ? "3" : "2"}
              </span>
            )}
          </Action>
        </div>
      </div>
      <div className="main-scroll">
        {travelMode && (
          <div className="travel-banner">✈️ 제주 여행 중 · 알림을 줄였어요</div>
        )}
        {activeGoal && (
          <span className="goal-mode">
            {dietMode ? "🥗" : <Sparkles size={11} strokeWidth={1.5} />}{" "}
            {activeGoal}
          </span>
        )}
        {dietMode && !monthLaterMode && <DietSummaryCard />}
        {/* U0·U1: 여행 확정 단계의 시작점 */}
        {confirmMode && (
          <ScheduleEntry open={openCapture} registered={scheduleRegistered} />
        )}
        {confirmMode && !dietMode && <GoalEntry open={openGoals} />}
        {monthLaterMode && <GoalAchievementSummary />}
        {/* U7-1은 여행 준비 단계의 알림 */}
        {prepareMode && groupSuggestion && (
          <GroupSuggestion accept={acceptGroup} reject={rejectGroup} />
        )}
        {/* U2-1은 시험기간에 넛지가 켜진 경우에만 표시 */}
        {nudgeOn && examMode && observation && (
          <div className="observation-card">
            <span className="rini-avatar">L</span>
            <p>시험기간이랑 다이어트가 겹쳐요. 지친 날엔 무리하지 말아요.</p>
            <Action
              onClick={() => setObservation(false)}
              label="관찰 카드 닫기"
            >
              <X size={15} strokeWidth={1.6} />
            </Action>
          </div>
        )}
        <WeekCalendar
          afterMode={afterMode}
          confirmMode={confirmMode}
          monthLaterMode={monthLaterMode}
          prepareMode={prepareMode}
          scheduleRegistered={scheduleRegistered}
          travelMode={travelMode}
        />
        <SpendingCard
          afterMode={afterMode}
          confirmMode={confirmMode}
          flightPersonal={flightPersonal}
          monthLaterMode={monthLaterMode}
          openExpense={openExpense}
          openSettlement={openSettlement}
          pendingCount={pendingCount}
          prepareMode={prepareMode}
          travelMode={travelMode}
        />
        {afterMode && <TravelStoryPreview open={openStory} />}
        {afterMode && tone === "numeric" && <TravelCostPreview open={openCost} />}
        {afterMode && <GoalAchievementPreview open={openGoalAchievement} />}
        {/* U6: 건강은 시험기간 단계에서만 */}
        {examMode && !healthEnabled && healthDeclined && (
          <div className="health-detection">
            <span className="health-card-icon">
              <Stethoscope size={19} strokeWidth={1.5} />
            </span>
            <div>
              <strong>지출로만 기록했어요</strong>
              <span>건강 기록은 만들지 않아요</span>
            </div>
          </div>
        )}
        {examMode && !healthEnabled && !healthDeclined && (
          <Action className="health-detection" onClick={openHealthConsent}>
            <span className="health-card-icon">
              <Stethoscope size={19} strokeWidth={1.5} />
            </span>
            <div>
              <strong>내과 결제가 감지됐어요</strong>
              <span>건강 기록으로 연결할지 확인해주세요</span>
            </div>
            <ChevronRight size={17} strokeWidth={1.5} />
          </Action>
        )}
        {examMode && healthEnabled && <HealthCard />}
        {!confirmMode && (
          <HomeReport daily={examMode} openInsight={openInsight} tone={tone} />
        )}
      </div>
    </>
  )
}
