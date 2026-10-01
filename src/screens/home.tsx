import {
  ChevronRight,
  CircleDollarSign,
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
import { useState } from "react"
import { Action, StatusChip, cx } from "@/components/common"
import { HomeSegments } from "@/components/layout"
import { HealthCard } from "@/screens/health"
import {
  todayByCategory,
  todayExpenses,
  todayTotal,
  usualDaily,
  usualTotal,
  won,
} from "@/lib/today"
import { MainHeader } from "@/components/layout"
import { type Tone } from "@/types"

export function WeekCalendar({
  travelMode = false,
  prepareMode = false,
  afterMode = false,
  monthLaterMode = false,
}: {
  travelMode?: boolean
  prepareMode?: boolean
  afterMode?: boolean
  monthLaterMode?: boolean
}) {
  const dates = monthLaterMode
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
        <span>{monthLaterMode ? "1월" : "12월"}</span>
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
      {monthLaterMode ? null : afterMode ? (
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
  pendingCount,
  flightPersonal,
  openExpense,
  travelMode,
  prepareMode,
  afterMode,
  monthLaterMode,
  openSettlement,
}: {
  pendingCount: number
  flightPersonal: boolean
  openExpense: () => void
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
  const rows = monthLaterMode
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
            ...standardRows,
          ]
        : standardRows
  return (
    <div className="main-card spending-card">
      <div className="spending-top">
        <div>
          <span>오늘 지출</span>
          <p>
            오늘{" "}
            {monthLaterMode
              ? "3건 · 11,200원"
              : prepareMode
                ? `4건 · ${won(360000 + todayTotal)}`
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
            onClick={row.name === "원피스" ? openExpense : undefined}
          >
            <span className="expense-icon">{row.icon}</span>
            <div>
              <strong>{row.name}</strong>
              {row.merchant && <span>{row.merchant}</span>}
              {"note" in row && row.note && (
                <span className="row-note">{row.note}</span>
              )}
              {"tripTag" in row && row.tripTag && (
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
                `평소 하루 ${won(usualDaily.쇼핑)} 정도였던 쇼핑이 오늘은 ${won(todayByCategory.쇼핑)}이에요. 밤 11시 41분에 에이블리 결제가 한 번 있었어요.`,
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
export function HomePage({
  tone,
  dietMode,
  savingMode,
  profile,
  openExpense,
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
  selectExam,
  selectPrepare,
  selectTravel,
  afterMode,
  flightPersonal,
  nudgeOn,
  selectAfter,
  monthLaterMode,
  selectMonthLater,
}: {
  tone: Tone
  dietMode: boolean
  savingMode: boolean
  profile: () => void
  openExpense: () => void
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
  selectExam: () => void
  selectPrepare: () => void
  selectTravel: () => void
  afterMode: boolean
  flightPersonal: boolean
  nudgeOn: boolean
  selectAfter: () => void
  monthLaterMode: boolean
  selectMonthLater: () => void
}) {
  const [observation, setObservation] = useState(true)
  // 뱃지는 사용자가 켠 목표 모드가 있을 때만 노출 (다이어트 우선)
  const activeGoal = dietMode ? "다이어트 모드" : savingMode ? "절약 모드" : ""
  return (
    <>
      <div className="home-header">
        <div className="brand main-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
        <div className="home-actions">
          <div className="profile-control">
            {showSegments && (
            <HomeSegments
              afterMode={afterMode}
              monthLaterMode={monthLaterMode}
              prepareMode={prepareMode}
              selectAfter={selectAfter}
              selectExam={selectExam}
              selectMonthLater={selectMonthLater}
              selectPrepare={selectPrepare}
              selectTravel={selectTravel}
              travelMode={travelMode}
            />
            )}
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
        {monthLaterMode && <GoalAchievementSummary />}
        {/* U7-1은 여행 준비 단계의 알림 */}
        {prepareMode && groupSuggestion && (
          <GroupSuggestion accept={acceptGroup} reject={rejectGroup} />
        )}
        {/* U2-1은 넛지가 켜진 경우에만 표시 */}
        {nudgeOn &&
          !travelMode &&
          !prepareMode &&
          !afterMode &&
          !monthLaterMode &&
          observation && (
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
          monthLaterMode={monthLaterMode}
          prepareMode={prepareMode}
          travelMode={travelMode}
        />
        <SpendingCard
          pendingCount={pendingCount}
          afterMode={afterMode}
          flightPersonal={flightPersonal}
          monthLaterMode={monthLaterMode}
          openExpense={openExpense}
          openSettlement={openSettlement}
          prepareMode={prepareMode}
          travelMode={travelMode}
        />
        {afterMode && <TravelStoryPreview open={openStory} />}
        {afterMode && tone === "numeric" && <TravelCostPreview open={openCost} />}
        {!healthEnabled && healthDeclined && (
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
        {!healthEnabled && !healthDeclined && (
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
        {healthEnabled && <HealthCard />}
        <HomeReport
          daily={!travelMode && !prepareMode && !afterMode && !monthLaterMode}
          openInsight={openInsight}
          tone={tone}
        />
      </div>
    </>
  )
}
