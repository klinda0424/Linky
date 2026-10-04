import { ArrowLeft, CalendarDays, Image, Map, UserRound } from "lucide-react"
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

// 하단 탭 4개: 캘린더(홈) · 지도 · 앨범 · 마이페이지. 기록 입력은 탭이 아니라 캘린더의 시트로 연다.
const tabs: Array<[MainTab, string, ReactNode]> = [
  ["calendar", "캘린더", <CalendarDays size={21} strokeWidth={1.5} />],
  ["map", "지도", <Map size={21} strokeWidth={1.5} />],
  ["album", "앨범", <Image size={21} strokeWidth={1.5} />],
  ["mypage", "마이페이지", <UserRound size={21} strokeWidth={1.5} />],
]

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
