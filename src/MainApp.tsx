import { useEffect, useState, type ReactNode } from "react"

import { Check } from "lucide-react"

import { BottomTabs } from "@/components/layout"

import { type UTApi } from "@/components/ut"

import { type UTMode } from "@/lib/ut"

import {
  ArchivePage,
  ArchiveSearch,
  ArchiveSearchResults,
  EmptyTab,
} from "@/screens/archive"

import { CoachChat, CoachHub, GoalAchievement } from "@/screens/coach"
import { FunPage } from "@/screens/fun"

import { FoodRecognition, FridgePage } from "@/screens/diet"

import { HealthArchive, HealthConsent } from "@/screens/health"

import { EmotionArchive, ScheduleArchive } from "@/screens/archives"
import { CoachAdvice, CoachReport, CoachTalk } from "@/screens/coachTools"
import { DailyInsight, HomePage } from "@/screens/home"

import {
  ConnectionSettings,
  GoalModeSettings,
  NotificationSettings,
  ProfileInfoSettings,
  ProfilePage,
  ProfileTone,
} from "@/screens/profile"

import {
  CaptureImport,
  CaptureUpload,
  ImportedCalendar,
  LinkRecord,
  QuickRecord,
  RecordSheet,
  ScreenRecording,
  type ScheduleKind,
} from "@/screens/record"
import { DailyReport, MoodPrompt, type MoodEmoji } from "@/screens/report"
import { days } from "@/lib/days"
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
  type NotificationKey,
  type PermissionKey,
  type ProfileDetails,
  type Tone,
} from "@/types"

export function MainApp({
  tone,

  setTone,

  goals,

  nudge,

  nickname,

  birthYear,

  job,

  permissions,

  setNickname,

  setBirthYear,

  setJob,

  setNudge,

  togglePermission,

  ut,

  // 사용성 테스트 모드일 때만 전달됨 (시작 상태·성공 지점·화면 기록)
}: {
  tone: Tone

  setTone: (tone: Tone) => void

  goals: string[]

  nudge: boolean

  nickname: string

  birthYear: string

  job: string

  permissions: Record<PermissionKey, boolean>

  setNickname: (value: string) => void

  setBirthYear: (value: string) => void

  setJob: (value: string) => void

  setNudge: (value: boolean) => void

  togglePermission: (key: PermissionKey) => void

  ut?: UTApi
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

  // 지출 상세(U3-1)를 연 곳: 뒤로 갈 때 돌아갈 화면

  const [expenseFrom, setExpenseFrom] = useState<"home" | "search">("home")

  // 홈에서 누른 구매처 (검색 결과에서 열면 undefined → U3-1 대상 구매처)

  const [expenseMerchant, setExpenseMerchant] = useState<string>()

  // 목표 달성 관리(U10-2)에서 뒤로 갈 곳: 코치 허브 또는 회고 흐름의 다음 단계(한 달 뒤 홈)

  const [goalReturn, setGoalReturn] =
    useState<"coachHub" | "monthLater" | "home">("coachHub")

  const [groupSuggestion, setGroupSuggestion] = useState(true)

  // U7-1에서 "아니요"를 고르면 항공권은 그룹이 아닌 개인 지출로 남음

  const [flightPersonal, setFlightPersonal] = useState(false)

  // 온보딩에서 켠 넛지 + 하루 리포트 옵트인("네")으로 켜지는 넛지

  const [nudgeOn, setNudgeOn] = useState(nudge)

  const [notificationSettings, setNotificationSettings] = useState({
    schedule: true,

    health: false,

    report: true,
  })

  // 홈 시점(드롭다운 6단계). 처음에는 유저플로우 시작인 "여행 확정".

  const [homeMode, setHomeMode] = useState<UTMode>(ut?.mode ?? "confirm")
  // 마지막으로 고른 기분 (하루 리포트의 "연결된 흐름"에 쓰임)
  const [mood, setMood] = useState<MoodEmoji>()
  const confirmMode = homeMode === "confirm"

  const travelMode = homeMode === "travel"

  const prepareMode = homeMode === "prepare"

  const afterMode = homeMode === "after"

  const monthLaterMode = homeMode === "monthLater"

  // U0-3까지 마치면 홈 캘린더에 시험기간·제주 여행 일정이 올라옴

  // 캡처 업로드 → 제주 여행, 학사일정 링크 → 시험기간을 따로 등록한다
  const [schedules, setSchedules] = useState<Record<ScheduleKind, boolean>>({
    travel: false,
    exam: false,
  })
  const [lastSchedule, setLastSchedule] = useState<ScheduleKind>("travel")
  const registerSchedule = (kind: ScheduleKind) => {
    setSchedules((current) => ({ ...current, [kind]: true }))
    setLastSchedule(kind)
    setView("calendar")
  }

  const [goalModes, setGoalModes] = useState<Record<GoalModeKey, boolean>>({
    // U1-1 시연에서 사용자가 직접 켜는 흐름이라 온보딩 선택과 무관하게 OFF로 시작

    diet: false,

    saving: goals.includes("절약하기"),

    exercise: false,
  })

  // UT: 화면 이동 기록, 검색 결과 도달은 U11-1 성공 지점

  useEffect(() => {
    ut?.screen(`${tab}:${view}`)

    if (view === "searchResults") ut?.milestone("u111_results")
  }, [tab, ut, view])

  // U5-1: 기분 기록은 지금 홈 단계의 "오늘"(lib/days.ts) 결제와 연결된다
  const moodToast = () =>
    `오늘 결제 ${days[homeMode].expenses.length}건과 연결했어요`
  const showMoodToast = (mood?: MoodEmoji) => {
    setSheet(false)
    setMood(mood)
    setToast(moodToast())
    // U5-1 → U5-2: 결제 연결 안내 후 하루 리포트로 이어짐

    window.setTimeout(() => setView("dailyReport"), 700)

    window.setTimeout(() => setToast(""), 2200)
  }

  const openGoalAchievement = (from: "coachHub" | "monthLater" | "home") => {
    setGoalReturn(from)

    setView("goalAchievement")
  }

  const goMonthLaterHome = () => {
    setHomeMode("monthLater")

    setTab("home")

    setView("tabs")
  }

  const changeTab = (next: MainTab) => {
    setTab(next)

    setView("tabs")
  }

  const openInput = (
    next: "quick" | "link" | "captureImport" | "food" | "screenRecording",
  ) => {
    setSheet(false)

    setView(next)
  }

  const toggleGoalMode = (key: GoalModeKey) =>
    setGoalModes((current) => ({ ...current, [key]: !current[key] }))

  const notificationValues: Record<NotificationKey, boolean> = {
    pattern: nudgeOn,

    ...notificationSettings,
  }

  const toggleNotification = (key: NotificationKey) => {
    if (key === "pattern") {
      const next = !nudgeOn

      setNudgeOn(next)

      setNudge(next)

      return
    }

    setNotificationSettings((current) => ({
      ...current,

      [key]: !current[key],
    }))
  }

  let page: ReactNode

  if (view === "coachHub")
    page = (
      <CoachHub
        advice={() => setView("coachAdvice")}
        back={() => setView("tabs")}
        goals={() => openGoalAchievement("coachHub")}
        report={() => setView("coachReport")}
        talk={() => setView("coachTalk")}
      />
    )
  else if (view === "coachTalk")
    page = <CoachTalk back={() => setView("coachHub")} mode={homeMode} />
  else if (view === "coachReport")
    page = (
      <CoachReport
        back={() => setView("coachHub")}
        dietMode={goalModes.diet}
        mode={homeMode}
        tone={tone}
      />
    )
  else if (view === "coachAdvice")
    page = (
      <CoachAdvice
        back={() => setView("coachHub")}
        mode={homeMode}
        nudgeOn={nudgeOn}
        open={(target) =>
          setView(
            target === "fridge"
              ? "fridge"
              : target === "closet"
                ? "closet"
                : "settlement",
          )
        }
        toggleNudge={() => toggleNotification("pattern")}
      />
    )
  else if (view === "goalAchievement")
    page = (
      <GoalAchievement
        back={() =>
          goalReturn === "coachHub"
            ? setView("coachHub")
            : goalReturn === "home"
              ? setView("tabs")
              : goMonthLaterHome()
        }
      />
    )
  else if (view === "mood")
    page = (
      <MoodPrompt
        select={(selected) => {
          setMood(selected)
          setToast(moodToast())
          window.setTimeout(() => setView("dailyReport"), 700)

          window.setTimeout(() => setToast(""), 2200)
        }}
        skip={() => setView("tabs")}
      />
    )
  else if (view === "schedule")
    page = (
      <ScheduleArchive
        back={() => setView("tabs")}
        mode={homeMode}
        openCost={() => setView("travelCost")}
        openSettlement={() => setView("settlement")}
        openStory={() => setView("travelStory")}
        schedules={schedules}
      />
    )
  else if (view === "emotion")
    page = (
      <EmotionArchive
        back={() => setView("tabs")}
        mode={homeMode}
        mood={mood}
        openMood={() => setView("mood")}
      />
    )
  else if (view === "dailyInsight")
    page = <DailyInsight back={() => setView("tabs")} tone={tone} />
  else if (view === "dailyReport")
    page = (
      <DailyReport
        back={() => setView("tabs")}
        mood={mood}
        stage={homeMode}
        decline={() => {
          ut?.milestone("u52_nudge_no")

          setView("tabs")
        }}
        notify={() => {
          ut?.milestone("u52_nudge_yes")

          setNudgeOn(true)

          setNudge(true)

          setToast("필요할 때만 조용히 알려드릴게요")

          window.setTimeout(() => setView("tabs"), 900)

          window.setTimeout(() => setToast(""), 2200)
        }}
        tone={tone}
      />
    )
  else if (view === "quick")
    page = <QuickRecord back={() => setView("tabs")} stage={homeMode} />
  else if (view === "link")
    page = (
      <LinkRecord
        back={() => setView("tabs")}
        confirm={() => registerSchedule("exam")}
      />
    )
  else if (view === "capture")
    page = (
      <CaptureUpload
        back={() => setView("tabs")}
        confirm={() => registerSchedule("travel")}
      />
    )
  else if (view === "captureImport")
    page = <CaptureImport back={() => setView("tabs")} />
  else if (view === "screenRecording")
    page = <ScreenRecording back={() => setView("tabs")} />
  else if (view === "calendar")
    page = (
      <ImportedCalendar
        added={lastSchedule}
        schedules={schedules}
        home={() => {

          setHomeMode("confirm")

          setTab("home")

          setView("tabs")
        }}
      />
    )
  else if (view === "expense")
    page = (
      <ExpenseDetail
        back={() => setView(expenseFrom === "home" ? "tabs" : "searchResults")}
        merchant={expenseMerchant}
        onAdd={() => ut?.milestone("u31_closet")}
      />
    )
  else if (view === "groupExpense")
    page = (
      <GroupExpenseDetail
        back={() => setView("tabs")}
        confirm={() => {
          setHomeMode("travel")

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
        finish={() => {
          setHomeMode("after")

          setView("travelStory")
        }}
      />
    )
  else if (view === "travelStory")
    page = (
      <TravelStory
        close={() => {
          setTab("home")

          setView("tabs")
        }}
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
    page = <ClosetPage back={() => setView("shopping")} />
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

          setExpenseMerchant(undefined)

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
        openConnections={() => setView("connections")}
        openGoals={() => setView("goals")}
        openInfo={() => setView("profileInfo")}
        openNotifications={() => setView("notifications")}
        openTone={() => setView("tone")}
      />
    )
  else if (view === "profileInfo")
    page = (
      <ProfileInfoSettings
        back={() => setView("profile")}
        save={(value: ProfileDetails) => {
          setNickname(value.nickname)

          setBirthYear(value.birthYear)

          setJob(value.job)

          setView("profile")

          setToast("회원 정보를 저장했어요")

          window.setTimeout(() => setToast(""), 2200)
        }}
        value={{
          nickname: nickname || "김소연",

          birthYear,

          job: job || "🎓 대학생",
        }}
      />
    )
  else if (view === "connections")
    page = (
      <ConnectionSettings
        back={() => setView("profile")}
        toggle={togglePermission}
        values={permissions}
      />
    )
  else if (view === "notifications")
    page = (
      <NotificationSettings
        back={() => setView("profile")}
        toggle={toggleNotification}
        values={notificationValues}
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
              ut?.milestone("u71_yes")

              setGroupSuggestion(false)

              setSplitSheet(true)
            }}
            afterMode={afterMode}
            confirmMode={confirmMode}
            flightPersonal={flightPersonal}
            nudgeOn={nudgeOn}
            dietMode={goalModes.diet}
            groupSuggestion={groupSuggestion}
            healthDeclined={healthDeclined}
            healthEnabled={healthAgreed}
            monthLaterMode={monthLaterMode}
            openExpense={(merchant) => {
              setExpenseFrom("home")

              setExpenseMerchant(merchant)

              setView("expense")
            }}
            openCapture={() => setView("capture")}
            openLink={() => setView("link")}
            openGoalAchievement={() => openGoalAchievement("home")}
            openGoals={() => setView("goals")}
            openHealthConsent={() => setHealthConsent(true)}
            schedules={schedules}
            openCost={() => setView("travelCost")}
            openInsight={() => setView("dailyInsight")}
            pendingCount={settlement.items.length}
            openMood={() => setView("coachHub")}
            openSettlement={() => setView("settlement")}
            openStory={() => setView("travelStory")}
            profile={() => setView("profile")}
            savingMode={goalModes.saving}
            prepareMode={prepareMode}
            showSegments={!ut}
            rejectGroup={() => {
              ut?.milestone("u71_no")

              setGroupSuggestion(false)

              setFlightPersonal(true)
            }}
            selectMode={setHomeMode}
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
            openSchedule={() => setView("schedule")}
            openEmotion={() => setView("emotion")}
          />
        )}
        {/* 놀이터: 앱테크·운세·퀴즈·지난 리포트 (지금 홈 단계 날짜 기준) */}
        {tab === "fun" && <FunPage stage={homeMode} />}
        {tab === "community" && <EmptyTab tab={tab} />}
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
            ut?.milestone("u61_agree")

            setHealthAgreed(true)

            setHealthConsent(false)

            setView("health")
          }}
          decline={() => {
            ut?.milestone("u61_decline")

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
