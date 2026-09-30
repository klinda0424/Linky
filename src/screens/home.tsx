import {
  ChevronRight,
  CircleDollarSign,
  HeartPulse,
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
        <div className={cx("event-line", travelMode && "travel-event-line")}>
          <span>{travelMode ? "제주 여행 · 12/22~24" : "시험기간"}</span>
        </div>
      )}
    </div>
  )
}
export function SpendingCard({
  openExpense,
  travelMode,
  prepareMode,
  afterMode,
  monthLaterMode,
  openSettlement,
}: {
  openExpense: () => void
  travelMode: boolean
  prepareMode: boolean
  afterMode: boolean
  monthLaterMode: boolean
  openSettlement: () => void
}) {
  const standardRows = [
    {
      icon: <ShoppingBag size={17} strokeWidth={1.5} />,
      name: "원피스",
      merchant: "에이블리",
      amount: "40,000원",
      status: false,
    },
    {
      icon: <HeartPulse size={17} strokeWidth={1.5} />,
      name: "떡볶이",
      merchant: "배달의민족",
      amount: "6,500원",
      status: false,
    },
    {
      icon: <ShoppingBag size={17} strokeWidth={1.5} />,
      name: "CU 편의점",
      merchant: "",
      amount: "1,500원",
      status: false,
    },
  ]
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
            amount: "132,000원",
            status: false,
          },
          {
            icon: <MapPin size={17} strokeWidth={1.5} />,
            name: "성산일출봉 입장료",
            merchant: "관광",
            amount: "15,000원",
            status: false,
          },
          {
            icon: <ShoppingBag size={17} strokeWidth={1.5} />,
            name: "제주 공항 편의점",
            merchant: "제주 공항",
            amount: "18,000원",
            status: false,
          },
        ]
      : prepareMode
        ? [
            {
              icon: <Plane size={17} strokeWidth={1.5} />,
              name: "항공권",
              merchant: "제주 여행 · 3명",
              amount: "360,000원",
              status: true,
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
                ? "4건 · 408,000원"
                : travelMode
                  ? "3건 · 165,000원"
                  : "3건 · 48,000원"}
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
          {afterMode ? "정산 완료" : `정산 대기 ${travelMode ? "7건" : "0건"}`}
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
export function HomeReport({ tone }: { tone: Tone }) {
  return (
    <div className="main-card home-report">
      <div className="block-heading">
        <strong>린이의 주간 리포트</strong>
        <span className="linky-badge">
          <Sparkles size={12} strokeWidth={1.5} /> Linky
        </span>
      </div>
      {tone === "narrative" ? (
        <div className="report-quote">
          “시험을 준비한 날엔 카페 결제가 있었고, 일정이 끝난 저녁에는 배달
          주문이 있었어요.”
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
export function TravelStoryPreview() {
  return (
    <div className="travel-story-preview">
      <span>
        <Plane size={27} strokeWidth={1.4} />
      </span>
      <div>
        <strong>제주 여행 다녀왔어요</strong>
        <p>여행 이야기를 한 장씩 모아봤어요</p>
      </div>
      <ChevronRight size={17} strokeWidth={1.5} />
    </div>
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
  openMood,
  healthEnabled,
  healthDeclined,
  openHealthConsent,
  prepareMode,
  selectExam,
  selectPrepare,
  selectTravel,
  afterMode,
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
  openMood: () => void
  healthEnabled: boolean
  healthDeclined: boolean
  openHealthConsent: () => void
  prepareMode: boolean
  selectExam: () => void
  selectPrepare: () => void
  selectTravel: () => void
  afterMode: boolean
  selectAfter: () => void
  monthLaterMode: boolean
  selectMonthLater: () => void
}) {
  const [observation, setObservation] = useState(true)
  const [prepareSuggestion, setPrepareSuggestion] = useState(true)
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
          </div>
          <Action className="profile-icon" onClick={profile} label="프로필">
            <UserRound size={17} strokeWidth={1.5} />
          </Action>
          <Action
            className={cx(
              "round-icon",
              (travelMode || prepareMode || afterMode || monthLaterMode) &&
                "has-notification",
            )}
            label="AI 코치"
            onClick={openMood}
          >
            <MessageCircleMore size={19} strokeWidth={1.5} />
            {(travelMode || prepareMode || afterMode || monthLaterMode) && (
              <span className="notification-badge">
                {monthLaterMode
                  ? "0"
                  : afterMode
                    ? "1"
                    : prepareMode
                      ? "3"
                      : "2"}
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
        {dietMode && <DietSummaryCard />}
        {monthLaterMode && <GoalAchievementSummary />}
        {!travelMode &&
          !afterMode &&
          !monthLaterMode &&
          (prepareMode ? prepareSuggestion : groupSuggestion) && (
            <GroupSuggestion
              accept={acceptGroup}
              reject={() => {
                if (prepareMode) setPrepareSuggestion(false)
                else rejectGroup()
              }}
            />
          )}
        {!travelMode && !prepareMode && observation && (
          <div className="observation-card">
            <span className="rini-avatar">L</span>
            <p>시험기간이랑 다이어트가 겹쳐요.지친 날엔 무리하지 말아요.</p>
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
          afterMode={afterMode}
          monthLaterMode={monthLaterMode}
          openExpense={openExpense}
          openSettlement={openSettlement}
          prepareMode={prepareMode}
          travelMode={travelMode}
        />
        {afterMode && <TravelStoryPreview />}
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
        <HomeReport tone={tone} />
      </div>
    </>
  )
}
