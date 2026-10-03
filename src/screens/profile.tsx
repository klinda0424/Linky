import { useEffect, useRef, useState, type ReactNode } from "react"

import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  HeartPulse,
  Info,
  Link2,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react"

import { Action, Badge, PageTitle, Toggle, cx } from "@/components/common"

import { MainHeader } from "@/components/layout"

import {
  birthYears,
  jobOptions,
  permissions as permissionOptions,
  ToneOptions,
} from "@/screens/onboarding"

import {
  type GoalModeKey,
  type NotificationKey,
  type PermissionKey,
  type ProfileDetails,
  type Tone,
} from "@/types"

export function ProfilePage({
  name,

  back,

  openTone,

  openGoals,

  openInfo,

  openConnections,

  openNotifications,
}: {
  name: string

  back: () => void

  openTone: () => void

  openGoals: () => void

  openInfo: () => void

  openConnections: () => void

  openNotifications: () => void
}) {
  const items: Array<[string, ReactNode, (() => void) | undefined]> = [
    ["회원 정보", <UserRound size={18} strokeWidth={1.5} />, openInfo],

    ["목표 모드 설정", <Sparkles size={18} strokeWidth={1.5} />, openGoals],

    ["리포트 톤 설정", <MessageCircle size={18} strokeWidth={1.5} />, openTone],

    [
      "연동 서비스 관리",

      <Link2 size={18} strokeWidth={1.5} />,

      openConnections,
    ],

    ["알림 설정", <Bell size={18} strokeWidth={1.5} />, openNotifications],
  ]

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="프로필" />
      <div className="profile-top">
        <span>{name.slice(0, 1)}</span>
        <div>
          <strong>{name}</strong>
          <p>링키가 기록을 연결하고 있어요</p>
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

export function ProfileInfoSettings({
  value,

  save,

  back,
}: {
  value: ProfileDetails

  save: (value: ProfileDetails) => void

  back: () => void
}) {
  const [draft, setDraft] = useState(value)

  const valid = Boolean(draft.nickname.trim() && draft.birthYear && draft.job)

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="회원 정보" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">기본 정보</p>
        <p className="settings-sub">
          온보딩에서 입력한 정보를 확인하고 바꿀 수 있어요
        </p>
        <div className="field">
          <p className="field-label">닉네임</p>
          <div className="text-field">
            <input
              aria-label="닉네임"
              maxLength={10}
              onChange={(event) => {
                const nickname = event.currentTarget.value

                setDraft((current) => ({ ...current, nickname }))
              }}
              placeholder="예: 지은이"
              value={draft.nickname}
            />
            <span>{draft.nickname.length}/10</span>
          </div>
        </div>
        <div className="field">
          <p className="field-label">출생연도</p>
          <div className="select-field">
            <select
              aria-label="출생연도"
              onChange={(event) => {
                const birthYear = event.currentTarget.value

                setDraft((current) => ({ ...current, birthYear }))
              }}
              value={draft.birthYear}
            >
              {birthYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <ChevronDown
              className="select-chevron"
              size={17}
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="field">
          <p className="field-label">직업 상태</p>
          <div className="job-grid">
            {jobOptions.map((item) => (
              <Action
                className={cx("choice-chip", draft.job === item && "selected")}
                key={item}
                onClick={() =>
                  setDraft((current) => ({ ...current, job: item }))
                }
              >
                {item}
              </Action>
            ))}
          </div>
        </div>
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          disabled={!valid}
          onClick={() => save({ ...draft, nickname: draft.nickname.trim() })}
        >
          저장
        </Action>
      </div>
    </div>
  )
}

export function ConnectionSettings({
  values,

  toggle,

  back,
}: {
  values: Record<PermissionKey, boolean>

  toggle: (key: PermissionKey) => void

  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="연동 서비스 관리" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">연결 상태</p>
        <p className="settings-sub">필요한 서비스만 언제든 켜고 끌 수 있어요</p>
        <div className="list-cards permission-cards">
          {permissionOptions.map((item) => (
            <div className="list-card" key={item.key}>
              <span className="icon-box neutral">{item.icon}</span>
              <div className="list-copy">
                <div className="label-row">
                  <strong>
                    {item.title}
                    {item.parenthetical && (
                      <small> ({item.parenthetical})</small>
                    )}
                  </strong>
                  <Badge>{item.required ? "필수" : "선택"}</Badge>
                </div>
                <span>{item.description}</span>
              </div>
              <Toggle
                locked={item.required}
                on={values[item.key]}
                onClick={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>
        <div className="settings-note">
          <Info size={15} strokeWidth={1.7} />
          <span>
            카드·계좌는 지출 기록을 연결하는 필수 항목이라 해제할 수 없어요
          </span>
        </div>
      </div>
    </div>
  )
}

const notificationOptions: Array<{
  key: NotificationKey

  title: string

  description: string

  icon: ReactNode
}> = [
  {
    key: "pattern",

    title: "패턴 발견 알림",

    description: "반복되는 소비 패턴을 발견하면 알려드려요",

    icon: <Sparkles size={19} strokeWidth={1.5} />,
  },

  {
    key: "schedule",

    title: "일정과 지출 알림",

    description: "예정된 일정과 관련된 소비 변화를 알려드려요",

    icon: <CalendarDays size={19} strokeWidth={1.5} />,
  },

  {
    key: "health",

    title: "건강과 지출 알림",

    description: "건강 기록과 소비 사이의 변화가 보이면 알려드려요",

    icon: <HeartPulse size={19} strokeWidth={1.5} />,
  },

  {
    key: "report",

    title: "리포트 알림",

    description: "하루·주간 리포트가 준비되면 알려드려요",

    icon: <FileText size={19} strokeWidth={1.5} />,
  },
]

export function NotificationSettings({
  values,

  toggle,

  back,
}: {
  values: Record<NotificationKey, boolean>

  toggle: (key: NotificationKey) => void

  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="알림 설정" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">받을 알림</p>
        <p className="settings-sub">필요한 알림만 조용히 전해드려요</p>
        <div className="list-cards notification-settings-list">
          {notificationOptions.map((item) => (
            <div className="list-card" key={item.key}>
              <span className="icon-box lime">{item.icon}</span>
              <div className="list-copy">
                <div className="label-row">
                  <strong>{item.title}</strong>
                </div>
                <span>{item.description}</span>
              </div>
              <Toggle on={values[item.key]} onClick={() => toggle(item.key)} />
            </div>
          ))}
        </div>
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
