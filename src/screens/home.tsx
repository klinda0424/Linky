import {
  ChevronRight,
  CircleDollarSign,
  CalendarDays,
  Link2,
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
import { type ScheduleKind } from "@/screens/record"
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
import { type DayIcon, dayCategories, dayTotal, days } from "@/lib/days"
import { type UTMode } from "@/lib/ut"
import { type Tone } from "@/types"

export function WeekCalendar({
  confirmMode = false,
  travelMode = false,
  prepareMode = false,
  afterMode = false,
  monthLaterMode = false,
}: {
  confirmMode?: boolean
  travelMode?: boolean
  prepareMode?: boolean
  afterMode?: boolean
  monthLaterMode?: boolean
}) {
  // 모든 주는 일요일에 시작해 토요일에 끝난다. 각 단계의 "이번 주" 일요일 날짜와 그 달의 마지막 날.
  // 여행 확정 11/17~23(오늘 21일) · 시험기간 12/8~14(12일) · 여행 준비 12/15~21(20일)
  // 여행 중·여행 후 12/22~28(23일·27일) · 한 달 뒤 1/19~25(24일)
  const [sunday, monthEnd, todayDate] = confirmMode
    ? [17, 30, 21]
    : monthLaterMode
      ? [19, 31, 24]
      : travelMode
        ? [22, 31, 23]
        : afterMode
          ? [22, 31, 27]
          : prepareMode
            ? [15, 31, 20]
            : [8, 31, 12]
  const dates = ["일", "월", "화", "수", "목", "금", "토"].map((day, index) => [
    day,
    String(((sunday + index - 1) % monthEnd) + 1),
  ])
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
              date === String(todayDate) && "today",
            )}
            key={date}
          >
            <span>{day}</span>
            <strong>{date}</strong>
            <i className={cx([0, 2, 3, 5].includes(index) && "has-payment")} />
          </div>
        ))}
      </div>
      {/* 여행 확정 주(11/17~23)에는 12월 일정이 걸리지 않으므로 막대를 그리지 않는다.
          등록한 일정은 위의 일정 등록 카드에 표시된다. */}
      {confirmMode || monthLaterMode ? null : afterMode ? (
        // 여행 후(12/27)는 12/22~28 주: 시험기간(~12/20)은 이 주에 없고, 지난 제주 여행만 22~24일 칸에 표시
        <div className="after-event-lines">
          <span className="past-travel">제주 여행 · 12/22~24</span>
        </div>
      ) : prepareMode ? (
        // 여행 준비 주(12/15~21): 시험기간은 20일(금)에 끝나고, 제주 여행(22일)은 다음 주라 이 주에는 없다
        <div className="prepare-event-lines">
          <span className="exam-ending">시험기간 · 12/20까지</span>
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
const dayIcons: Record<DayIcon, ReactNode> = {
  food: <UtensilsCrossed size={17} strokeWidth={1.5} />,
  shop: <ShoppingBag size={17} strokeWidth={1.5} />,
  car: <Car size={17} strokeWidth={1.5} />,
  won: <CircleDollarSign size={17} strokeWidth={1.5} />,
  pin: <MapPin size={17} strokeWidth={1.5} />,
  plane: <Plane size={17} strokeWidth={1.5} />,
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
      merchant: `옷 ${group.items.length}벌`,
      amount: won(group.total),
      status: false,
      expenseMerchant: group.merchant,
    })),
    ...standardRows.filter(
      (_, index) => todayExpenses[index].category !== "쇼핑",
    ),
  ]
  // 시험기간 외 단계의 오늘 지출은 lib/days.ts의 그날 결제로 그린다 (하루 리포트와 같은 데이터)
  const stage: UTMode = confirmMode
    ? "confirm"
    : afterMode
      ? "after"
      : monthLaterMode
        ? "monthLater"
        : travelMode
          ? "travel"
          : prepareMode
            ? "prepare"
            : "exam"
  const day = days[stage]
  const rows: Array<{
    icon: ReactNode
    name: string
    merchant: string
    note?: string
    tripTag?: boolean
    amount: string
    status: boolean
    expenseMerchant?: string
  }> =
    stage === "exam"
      ? examRows
      : day.expenses.map((expense) => ({
          icon: dayIcons[expense.icon],
          name: expense.name,
          // 여행 준비: U7-1에서 "아니요"를 고르면 항공권은 개인 지출로 기록
          merchant:
            stage === "prepare" && flightPersonal
              ? "개인 지출"
              : expense.merchant,
          note: expense.note,
          tripTag: expense.tripTag,
          amount: won(expense.amount),
          status: stage === "prepare" && !flightPersonal,
        }))
  return (
    <div className="main-card spending-card">
      <div className="spending-top">
        <div>
          <span>오늘 지출</span>
          <p>
            오늘 {day.expenses.length}건 · {won(dayTotal(day))}
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
            </div>
            {row.tripTag && (
              // U8-1: 제주 위치 결제는 여행 태그로 자동 묶임 (가격 옆, 칸마다 같은 위치)
              <span className="trip-tag">📍 제주 여행</span>
            )}
            {row.status && <StatusChip type="check" />}
            <p className={cx(row.tripTag && "with-trip-tag")}>{row.amount}</p>
          </Action>
        ))}
      </div>
    </div>
  )
}
// 단계(그 주)별 식비·배달. 같은 주를 보여주는 여행 중/여행 후는 이어서 쌓인 값이다.
const dietByStage: Record<UTMode, { delivery: number; food: number }> = {
  confirm: { delivery: 2, food: 38000 },
  exam: { delivery: 3, food: 54000 },
  prepare: { delivery: 1, food: 22000 },
  travel: { delivery: 0, food: 150000 },
  after: { delivery: 0, food: 161500 },
  monthLater: { delivery: 1, food: 19500 },
}
export function DietSummaryCard({ stage }: { stage: UTMode }) {
  const { delivery, food } = dietByStage[stage]
  return (
    <div className="main-card diet-summary">
      <div className="block-heading">
        <strong>식비·배달</strong>
        <span>이번 주</span>
      </div>
      <div className="diet-stats">
        <div>
          <span>배달</span>
          <strong>{delivery}회</strong>
        </div>
        <i />
        <div>
          <span>식비</span>
          <strong>{won(food)}</strong>
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
// 단계별 일간 리포트: 서사형 문장. 수치형 막대는 lib/days.ts의 그날 결제로 계산한다.
const stageQuotes: Record<UTMode, string> = {
  confirm: "“학식을 먹고, 스터디 카페와 지하철 결제가 있었어요.”",
  exam: "“새벽에 택시를 탔고, 저녁에는 배달, 밤에는 옷 결제가 있었어요.”",
  prepare: "“제주행 항공권을 결제했어요. 오늘 결제는 이 한 건이에요.”",
  travel:
    "“성산일출봉에 들렀고, 해녀 식당에서 식사했고, 제주 공항 편의점 결제도 있었어요.”",
  after: "“분식과 카페, 지하철 결제가 한 건씩 있었어요.”",
  monthLater: "“스타벅스, 편의점, 지하철 결제가 한 건씩 있었어요.”",
}

export function HomeReport({
  tone,
  stage,
  openInsight,
}: {
  tone: Tone
  // 홈 단계. 모든 단계가 그날 "오늘 지출" 기준의 일간 리포트를 보여준다.
  stage: UTMode
  openInsight: () => void
}) {
  // 평소와 비교한 인사이트(DailyInsight)는 시험기간(12월 12일) 기준이라 시험기간에서만 연다.
  const withInsight = stage === "exam"
  const report = { quote: stageQuotes[stage] }
  const categories = dayCategories(days[stage])
  const total = dayTotal(days[stage])
  // 인사이트로 이어지지 않는 카드는 누를 수 있는 것처럼 보이지 않게 일반 박스로 둔다.
  const Wrapper = withInsight ? Action : "div"
  return (
    <Wrapper
      className="main-card home-report"
      {...(withInsight ? { onClick: openInsight } : {})}
    >
      <div className="block-heading">
        <strong>링키의 일간 리포트</strong>
        <span className="linky-badge">
          <Sparkles size={12} strokeWidth={1.5} /> Linky
        </span>
      </div>
      {tone === "narrative" ? (
        <div className="report-quote">{report.quote}</div>
      ) : (
        <div className="home-bars">
          {categories.map(([label, amount]) => (
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
      {withInsight && (
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
  // 결제 한 번당 한 줄: 같은 쇼핑몰에서 같은 시각에 산 옷은 한 결제로 묶는다
  const timeline = [...todayExpenses]
    .sort((a, b) => a.time.localeCompare(b.time))
    .reduce<
      Array<{ time: string; label: string; items: string[]; amount: number }>
    >((rows, expense) => {
      const shopping = expense.category === "쇼핑"
      const same = rows.find(
        (row) =>
          shopping && row.time === expense.time && row.label === expense.merchant,
      )
      if (same) {
        same.items.push(expense.name)
        same.amount += expense.amount
      } else
        rows.push({
          time: expense.time,
          label: shopping ? expense.merchant : expense.name,
          items: shopping ? [expense.name] : [],
          amount: expense.amount,
        })
      return rows
    }, [])
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
                `평소 하루 ${won(usualDaily.쇼핑)} 정도였던 쇼핑이 오늘은 ${won(todayByCategory.쇼핑)}이에요. 밤 11시 20분대부터 무신사·에이블리·지그재그에서 옷 5벌을 이어서 결제했어요.`,
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
            {timeline.map((row) => (
              <div key={`${row.time}-${row.label}`}>
                <time>{row.time}</time>
                <span>
                  {row.label}
                  {row.items.length > 0 && ` (${row.items.join(", ")})`} ·{" "}
                  {won(row.amount)}
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
// U0 여행 확정: 일정 등록 두 갈래 (캡처 → 제주 여행 / 학사일정 링크 → 시험기간)
const scheduleEntries: Record<
  ScheduleKind,
  { icon: ReactNode; title: string; sub: string; doneTitle: string; doneSub: string }
> = {
  travel: {
    icon: <CalendarDays size={19} strokeWidth={1.5} />,
    title: "단톡 캡처로 여행 일정을 등록해요",
    sub: "캡처에서 날짜·장소·인원을 가져와요",
    doneTitle: "제주 여행 일정을 등록했어요",
    doneSub: "12/22~24 · 3명 · 이 기간 지출을 자동으로 묶어요",
  },
  exam: {
    icon: <Link2 size={19} strokeWidth={1.5} />,
    title: "학사일정 링크로 시험기간을 등록해요",
    sub: "학교 일정 페이지에서 기간을 가져와요",
    doneTitle: "시험기간을 등록했어요",
    doneSub: "12/9~20 · 이 기간 지출을 자동으로 묶어요",
  },
}
export function ScheduleEntry({
  kind,
  registered,
  open,
}: {
  kind: ScheduleKind
  registered: boolean
  open: () => void
}) {
  const entry = scheduleEntries[kind]
  const Wrapper = registered ? "div" : Action
  return (
    <Wrapper
      className="health-detection home-entry"
      {...(registered ? {} : { onClick: open })}
    >
      <span className="health-card-icon">{entry.icon}</span>
      <div>
        <strong>{registered ? entry.doneTitle : entry.title}</strong>
        <span>{registered ? entry.doneSub : entry.sub}</span>
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
  schedules,
  openCapture,
  openLink,
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
  schedules: Record<ScheduleKind, boolean>
  openCapture: () => void
  openLink: () => void
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
        {dietMode && !monthLaterMode && <DietSummaryCard stage={mode} />}
        {/* U0·U1: 여행 확정 단계의 시작점 */}
        {confirmMode && (
          <>
            <ScheduleEntry
              kind="travel"
              open={openCapture}
              registered={schedules.travel}
            />
            <ScheduleEntry
              kind="exam"
              open={openLink}
              registered={schedules.exam}
            />
          </>
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
          <HomeReport openInsight={openInsight} stage={mode} tone={tone} />
        )}
      </div>
    </>
  )
}
