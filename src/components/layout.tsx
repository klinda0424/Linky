import { ArrowLeft, CalendarDays, ChartNoAxesColumn, Home, Search, UserRound } from "lucide-react"
import { type ReactNode } from "react"
import { Action, cx } from "@/components/common"
import { type MainTab } from "@/types"

export function MainHeader({
  title,
  back,
}: {
  title: string
  back?: () => void
}) {
  if (back)
    return (
      <div className="main-subheader">
        <Action className="main-back" onClick={back} label="뒤로 가기">
          <ArrowLeft size={20} strokeWidth={1.6} />
        </Action>
        <p>{title}</p>
        <span />
      </div>
    )
  return (
    <div className="main-simple-header">
      <p>{title}</p>
    </div>
  )
}

// 하단 탭 3개: 캘린더 · 홈 · 리포트. 기록 입력은 탭이 아니라 캘린더의 시트로 연다.
const tabs: Array<[MainTab, string, ReactNode]> = [
  ["calendar", "캘린더", <CalendarDays size={21} strokeWidth={1.5} />],
  ["home", "홈", <Home size={21} strokeWidth={1.5} />],
  ["report", "리포트", <ChartNoAxesColumn size={21} strokeWidth={1.5} />],
]

// 상단 우측 아이콘: 검색 옆에 프로필 (회원 정보·연동·권한·알림)
export function HeaderActions({
  openSearch,
  openProfile,
}: {
  openSearch?: () => void
  openProfile: () => void
}) {
  return (
    <div className="header-actions">
      {openSearch && (
        <Action className="cal-icon" label="검색" onClick={openSearch}>
          <Search size={20} strokeWidth={1.6} />
        </Action>
      )}
      <Action className="cal-icon" label="프로필" onClick={openProfile}>
        <UserRound size={20} strokeWidth={1.6} />
      </Action>
    </div>
  )
}

export function BottomTabs({
  active,
  change,
}: {
  active: MainTab
  change: (tab: MainTab) => void
}) {
  return (
    <div className="bottom-tabs">
      {tabs.map(([key, label, icon]) => (
        <Action
          className={cx("bottom-tab", active === key && "active")}
          key={key}
          onClick={() => change(key)}
        >
          {icon}
          <span>{label}</span>
        </Action>
      ))}
    </div>
  )
}
