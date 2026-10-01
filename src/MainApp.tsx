import { useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { BottomTabs } from "@/components/layout"
import {
  ArchivePage,
  ArchiveSearch,
  ArchiveSearchResults,
  EmptyTab,
} from "@/screens/archive"
import { CoachChat, CoachHub, GoalAchievement } from "@/screens/coach"
import { FoodRecognition, FridgePage } from "@/screens/diet"
import { HealthArchive, HealthConsent } from "@/screens/health"
import { HomePage } from "@/screens/home"
import { GoalModeSettings, ProfilePage, ProfileTone } from "@/screens/profile"
import {
  CaptureUpload,
  ImportedCalendar,
  LinkRecord,
  QuickRecord,
  RecordSheet,
} from "@/screens/record"
import { DailyReport, MoodPrompt } from "@/screens/report"
import {
  GroupExpenseDetail,
  GroupSplitSheet,
  SettlementConfirm,
  SettlementEdit,
  SettlementInbox,
  SettlementResult,
  SettlementTable,
} from "@/screens/settlement"
import { ClosetPage, ExpenseDetail, ShoppingStorage } from "@/screens/shopping"
import { TravelCostReport, TravelStory } from "@/screens/travel"
import { summarize } from "@/lib/settlement"
import {
  type GoalModeKey,
  type MainTab,
  type MainView,
  type Tone,
} from "@/types"

export function MainApp({
  tone,
  setTone,
  goals,
  nudge,
  nickname,
}: {
  tone: Tone
  setTone: (tone: Tone) => void
  goals: string[]
  nudge: boolean
  nickname: string
}) {
  const [tab, setTab] = useState<MainTab>("home")
  const [view, setView] = useState<MainView>("tabs")
  const [sheet, setSheet] = useState(false)
  const [splitSheet, setSplitSheet] = useState(false)
  const [healthConsent, setHealthConsent] = useState(false)
  const [healthAgreed, setHealthAgreed] = useState(false)
  const [healthDeclined, setHealthDeclined] = useState(false)
  const [toast, setToast] = useState("")
  // 정산: 정산표에서 제외한 항목, 민지 입금 매칭 여부
  const [excluded, setExcluded] = useState<string[]>([])
  const [matched, setMatched] = useState(false)
  const settlement = summarize(excluded)
  // 지출 상세(U3-1)를 연 곳: 홈에서 열면 "맞아요" 뒤 옷장(U3-2)으로 이어짐
  const [dressTagged, setDressTagged] = useState(true)
  const [expenseFrom, setExpenseFrom] = useState<"home" | "search">("home")
  const [closetFromExpense, setClosetFromExpense] = useState(false)
  // 목표 달성 관리(U10-2)에서 뒤로 갈 곳: 코치 허브 또는 회고 흐름의 다음 단계(한 달 뒤 홈)
  const [goalReturn, setGoalReturn] = useState<"coachHub" | "monthLater">(
    "coachHub",
  )
  const [groupSuggestion, setGroupSuggestion] = useState(true)
  // U7-1에서 "아니요"를 고르면 항공권은 그룹이 아닌 개인 지출로 남음
  const [flightPersonal, setFlightPersonal] = useState(false)
  // 온보딩에서 켠 넛지 + 하루 리포트 옵트인("네")으로 켜지는 넛지
  const [nudgeOn, setNudgeOn] = useState(nudge)
  const [travelMode, setTravelMode] = useState(false)
  const [prepareMode, setPrepareMode] = useState(false)
  const [afterMode, setAfterMode] = useState(false)
  const [monthLaterMode, setMonthLaterMode] = useState(false)
  const [goalModes, setGoalModes] = useState<Record<GoalModeKey, boolean>>({
    // U1-1 시연에서 사용자가 직접 켜는 흐름이라 온보딩 선택과 무관하게 OFF로 시작
    diet: false,
    saving: goals.includes("절약하기"),
    exercise: false,
  })

  const showMoodToast = () => {
    setSheet(false)
    setToast("오늘 결제 3건과 연결했어요")
    // U5-1 → U5-2: 결제 연결 안내 후 하루 리포트로 이어짐
    window.setTimeout(() => setView("dailyReport"), 700)
    window.setTimeout(() => setToast(""), 2200)
  }
  const openGoalAchievement = (from: "coachHub" | "monthLater") => {
    setGoalReturn(from)
    setView("goalAchievement")
  }
  const goMonthLaterHome = () => {
    setMonthLaterMode(true)
    setAfterMode(false)
    setPrepareMode(false)
    setTravelMode(false)
    setTab("home")
    setView("tabs")
  }
  const changeTab = (next: MainTab) => {
    setTab(next)
    setView("tabs")
  }
  const openInput = (next: "quick" | "link" | "capture" | "food") => {
    setSheet(false)
    setView(next)
  }
  const toggleGoalMode = (key: GoalModeKey) =>
    setGoalModes((current) => ({ ...current, [key]: !current[key] }))

  let page: ReactNode
  if (view === "coachHub")
    page = (
      <CoachHub
        back={() => setView("tabs")}
        goals={() => openGoalAchievement("coachHub")}
        mood={() => setView("mood")}
      />
    )
  else if (view === "goalAchievement")
    page = (
      <GoalAchievement
        back={() =>
          goalReturn === "coachHub" ? setView("coachHub") : goMonthLaterHome()
        }
      />
    )
  else if (view === "mood")
    page = (
      <MoodPrompt
        select={() => {
          setToast("오늘 결제 3건과 연결했어요")
          window.setTimeout(() => setView("dailyReport"), 700)
          window.setTimeout(() => setToast(""), 2200)
        }}
        skip={() => setView("tabs")}
      />
    )
  else if (view === "dailyReport")
    page = (
      <DailyReport
        back={() => setView("tabs")}
        notify={() => {
          setNudgeOn(true)
          setToast("필요할 때만 조용히 알려드릴게요")
          window.setTimeout(() => setView("tabs"), 900)
          window.setTimeout(() => setToast(""), 2200)
        }}
        tone={tone}
      />
    )
  else if (view === "quick") page = <QuickRecord back={() => setView("tabs")} />
  else if (view === "link") page = <LinkRecord back={() => setView("tabs")} />
  else if (view === "capture")
    page = (
      <CaptureUpload
        back={() => setView("tabs")}
        confirm={() => setView("calendar")}
      />
    )
  else if (view === "calendar")
    page = (
      <ImportedCalendar
        home={() => {
          setTab("home")
          setView("tabs")
        }}
      />
    )
  else if (view === "expense")
    page = (
      <ExpenseDetail
        back={() => setView(expenseFrom === "home" ? "tabs" : "searchResults")}
        confirm={(tagged) => {
          if (tagged !== undefined) setDressTagged(tagged)
          if (expenseFrom === "home") {
            setClosetFromExpense(true)
            setView("closet")
          } else setView("tabs")
        }}
      />
    )
  else if (view === "groupExpense")
    page = (
      <GroupExpenseDetail
        back={() => setView("tabs")}
        confirm={() => {
          setMonthLaterMode(false)
          setAfterMode(false)
          setPrepareMode(false)
          setTravelMode(true)
          setView("tabs")
        }}
      />
    )
  else if (view === "settlement")
    page = (
      <SettlementInbox
        back={() => setView("tabs")}
        excluded={excluded}
        openTable={() => setView("settlementTable")}
      />
    )
  else if (view === "settlementTable")
    page = (
      <SettlementTable
        back={() => setView("settlement")}
        edit={() => setView("settlementEdit")}
        excluded={excluded}
        proceed={() => setView("settlementConfirm")}
      />
    )
  else if (view === "settlementEdit")
    page = (
      <SettlementEdit
        back={() => setView("settlementTable")}
        done={(next) => {
          setExcluded(next)
          setView("settlementTable")
        }}
        excluded={excluded}
      />
    )
  else if (view === "settlementConfirm")
    page = (
      <SettlementConfirm
        back={() => setView("settlementTable")}
        excluded={excluded}
        matched={matched}
        notify={() => {
          if (matched) return
          setToast("민지에게 입금 알림을 보냈어요")
          window.setTimeout(() => {
            setMatched(true)
            setToast("민지의 입금이 확인됐어요")
          }, 1200)
          window.setTimeout(() => setToast(""), 3200)
        }}
        result={() => setView("settlementResult")}
      />
    )
  else if (view === "settlementResult")
    page = (
      <SettlementResult
        excluded={excluded}
        finish={() => setView("travelStory")}
      />
    )
  else if (view === "travelStory")
    page = (
      <TravelStory
        close={() => openGoalAchievement("monthLater")}
        mine={settlement.perPerson}
      />
    )
  else if (view === "travelCost")
    page = (
      <TravelCostReport
        back={() => setView("tabs")}
        goHome={() => openGoalAchievement("monthLater")}
        summary={settlement}
      />
    )
  else if (view === "shopping")
    page = (
      <ShoppingStorage
        back={() => setView("tabs")}
        closet={() => setView("closet")}
        fridge={() => setView("fridge")}
      />
    )
  else if (view === "closet")
    page = (
      <ClosetPage
        dressTagged={dressTagged}
        back={() => {
          if (closetFromExpense) {
            setClosetFromExpense(false)
            setView("tabs")
          } else setView("shopping")
        }}
      />
    )
  else if (view === "fridge")
    page = (
      <FridgePage
        ask={() => setView("coach")}
        back={() => setView("shopping")}
      />
    )
  else if (view === "coach") page = <CoachChat back={() => setView("fridge")} />
  else if (view === "food")
    page = (
      <FoodRecognition
        back={() => setView("tabs")}
        saved={() => {
          setTab("home")
          setView("tabs")
          setToast("오늘 식단에 저장했어요")
          window.setTimeout(() => setToast(""), 2200)
        }}
      />
    )
  else if (view === "health")
    page = <HealthArchive back={() => setView("tabs")} />
  else if (view === "search")
    page = (
      <ArchiveSearch
        back={() => setView("tabs")}
        results={() => setView("searchResults")}
      />
    )
  else if (view === "searchResults")
    page = (
      <ArchiveSearchResults
        back={() => setView("search")}
        openExpense={() => {
          setExpenseFrom("search")
          setView("expense")
        }}
      />
    )
  else if (view === "profile")
    page = (
      <ProfilePage
        // 온보딩 닉네임이 없으면 시연 주인공 이름 사용
        name={nickname || "김소연"}
        back={() => setView("tabs")}
        openGoals={() => setView("goals")}
        openTone={() => setView("tone")}
      />
    )
  else if (view === "goals")
    page = (
      <GoalModeSettings
        back={() => setView("profile")}
        home={() => {
          setTab("home")
          setView("tabs")
        }}
        toggle={toggleGoalMode}
        values={goalModes}
      />
    )
  else if (view === "tone")
    page = (
      <ProfileTone
        back={() => setView("profile")}
        setTone={setTone}
        tone={tone}
      />
    )
  else
    page = (
      <div className="main-page">
        {tab === "home" && (
          <HomePage
            acceptGroup={() => {
              setGroupSuggestion(false)
              setSplitSheet(true)
            }}
            afterMode={afterMode}
            flightPersonal={flightPersonal}
            nudgeOn={nudgeOn}
            dietMode={goalModes.diet}
            groupSuggestion={groupSuggestion}
            healthDeclined={healthDeclined}
            healthEnabled={healthAgreed}
            monthLaterMode={monthLaterMode}
            openExpense={() => {
              setExpenseFrom("home")
              setView("expense")
            }}
            openHealthConsent={() => setHealthConsent(true)}
            openCost={() => setView("travelCost")}
            pendingCount={settlement.items.length}
            openMood={() => setView("coachHub")}
            openSettlement={() => setView("settlement")}
            openStory={() => setView("travelStory")}
            profile={() => setView("profile")}
            savingMode={goalModes.saving}
            prepareMode={prepareMode}
            rejectGroup={() => {
              setGroupSuggestion(false)
              setFlightPersonal(true)
            }}
            selectExam={() => {
              setMonthLaterMode(false)
              setAfterMode(false)
              setPrepareMode(false)
              setTravelMode(false)
            }}
            selectPrepare={() => {
              setMonthLaterMode(false)
              setAfterMode(false)
              setPrepareMode(true)
              setTravelMode(false)
            }}
            selectTravel={() => {
              setMonthLaterMode(false)
              setAfterMode(false)
              setPrepareMode(false)
              setTravelMode(true)
            }}
            selectAfter={() => {
              setMonthLaterMode(false)
              setAfterMode(true)
              setPrepareMode(false)
              setTravelMode(false)
            }}
            selectMonthLater={() => {
              setMonthLaterMode(true)
              setAfterMode(false)
              setPrepareMode(false)
              setTravelMode(false)
            }}
            tone={tone}
            travelMode={travelMode}
          />
        )}
        {tab === "archive" && (
          <ArchivePage
            openHealth={() => {
              if (healthAgreed) setView("health")
              else setHealthConsent(true)
            }}
            openShopping={() => setView("shopping")}
            openSearch={() => setView("search")}
          />
        )}
        {(tab === "fun" || tab === "community") && <EmptyTab tab={tab} />}
        <BottomTabs
          active={tab}
          change={changeTab}
          openSheet={() => setSheet(true)}
        />
      </div>
    )

  return (
    <>
      {page}
      {sheet && (
        <RecordSheet
          close={() => setSheet(false)}
          mood={showMoodToast}
          openInput={openInput}
        />
      )}
      {splitSheet && (
        <GroupSplitSheet
          close={() => setSplitSheet(false)}
          confirm={() => {
            setSplitSheet(false)
            setView("groupExpense")
          }}
        />
      )}
      {healthConsent && (
        <HealthConsent
          agree={() => {
            setHealthAgreed(true)
            setHealthConsent(false)
            setView("health")
          }}
          decline={() => {
            setHealthDeclined(true)
            setHealthConsent(false)
          }}
        />
      )}
      {toast && (
        <div className="main-toast">
          <Check size={15} strokeWidth={2} />
          {toast}
        </div>
      )}
    </>
  )
}
