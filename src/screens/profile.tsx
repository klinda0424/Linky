import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Bell,
  ChevronRight,
  Link2,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react"
import {
  Action,
  PageTitle,
  Toggle,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"
import { ToneOptions } from "@/screens/onboarding"
import { type GoalModeKey, type Tone } from "@/types"

export function ProfilePage({
  name,
  back,
  openTone,
  openGoals,
}: {
  name: string
  back: () => void
  openTone: () => void
  openGoals: () => void
}) {
  const items: Array<[string, ReactNode, (() => void) | undefined]> = [
    ["회원 정보", <UserRound size={18} strokeWidth={1.5} />, undefined],
    ["목표 모드 설정", <Sparkles size={18} strokeWidth={1.5} />, openGoals],
    ["리포트 톤 설정", <MessageCircle size={18} strokeWidth={1.5} />, openTone],
    ["연동 서비스 관리", <Link2 size={18} strokeWidth={1.5} />, undefined],
    ["알림 설정", <Bell size={18} strokeWidth={1.5} />, undefined],
  ]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="프로필" />
      <div className="profile-top">
        <span>{name.slice(0, 1)}</span>
        <div>
          <strong>{name}</strong>
          <p>린이가 기록을 연결하고 있어요</p>
        </div>
      </div>
      <div className="profile-list">
        {items.map(([label, icon, onClick]) => (
          <Action className="profile-row" key={label} onClick={onClick}>
            <span>{icon}</span>
            <strong>{label}</strong>
            <ChevronRight size={17} strokeWidth={1.5} />
          </Action>
        ))}
      </div>
    </div>
  )
}
export function GoalModeSettings({
  values,
  toggle,
  back,
  home,
}: {
  values: Record<GoalModeKey, boolean>
  toggle: (key: GoalModeKey) => void
  back: () => void
  home: () => void
}) {
  const [toast, setToast] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(
    () => () => timers.current.forEach((timer) => window.clearTimeout(timer)),
    [],
  )
  const modes: Array<{
    key: GoalModeKey
    emoji: string
    title: string
    description: string
  }> = [
    {
      key: "diet",
      emoji: "🥗",
      title: "다이어트",
      description: "식비·배달 흐름을 먼저 보여줘요",
    },
    {
      key: "saving",
      emoji: "💰",
      title: "절약",
      description: "아낀 금액을 모아 보여줘요",
    },
    {
      key: "exercise",
      emoji: "🏃",
      title: "운동",
      description: "건강 앱 기록과 연결해요",
    },
  ]
  const toggleMode = (key: GoalModeKey) => {
    toggle(key)
    if (key === "diet" && !values.diet) {
      setToast(true)
      // U1-1 → U1-2: 토스트로 활성화를 알린 뒤 다이어트 뱃지가 붙은 홈으로 이동
      timers.current.push(window.setTimeout(home, 1100))
    }
  }
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="목표 모드 설정" />
      <div className="goal-settings-content">
        <PageTitle
          sub="언제든 켜고 끌 수 있어요"
          title="지금 집중하고 싶은 목표가 있나요?"
        />
        <div className="mode-cards">
          {modes.map((mode) => (
            <Action
              className={cx("mode-card", values[mode.key] && "selected")}
              key={mode.key}
              onClick={() => toggleMode(mode.key)}
            >
              <span>{mode.emoji}</span>
              <div>
                <strong>{mode.title}</strong>
                <p>{mode.description}</p>
              </div>
              <Toggle on={values[mode.key]} />
            </Action>
          ))}
        </div>
      </div>
      {toast && <div className="goal-toast">다이어트 모드를 켰어요</div>}
    </div>
  )
}
export function ProfileTone({
  tone,
  setTone,
  back,
}: {
  tone: Tone
  setTone: (tone: Tone) => void
  back: () => void
}) {
  const [draft, setDraft] = useState<Tone>(tone)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="리포트 톤 설정" />
      <div className="sub-content tone-settings">
        <p className="sub-heading">어떤 방식이 더 편한가요?</p>
        <p className="settings-sub">다음 리포트부터 바로 반영해요</p>
        <ToneOptions setTone={setDraft} tone={draft} />
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          onClick={() => {
            setTone(draft)
            back()
          }}
        >
          저장
        </Action>
      </div>
    </div>
  )
}
