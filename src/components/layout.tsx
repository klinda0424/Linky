import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  Gift,
  Home as HomeIcon,
  Plus,
  Users,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { Action, cx } from "@/components/common"
import { type UTMode } from "@/lib/ut"
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
// 홈 시점 드롭다운: 통합 유저플로우의 6개 구간. 구간마다 홈 화면과 진입할 수 있는 세부 플로우가 달라진다.
export const homeStages: Array<[UTMode, string]> = [
  ["confirm", "여행 확정"],
  ["exam", "시험기간"],
  ["prepare", "여행 준비"],
  ["travel", "여행 중"],
  ["after", "여행 후"],
  ["monthLater", "한 달 뒤"],
]
export function HomeSegments({
  mode,
  select,
}: {
  mode: UTMode
  select: (mode: UTMode) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = homeStages.find(([key]) => key === mode)?.[1] ?? "시험기간"
  return (
    <div className="home-period-dropdown">
      <Action className="period-trigger" onClick={() => setOpen(!open)}>
        <span>{selected}</span>
        <ChevronDown size={11} strokeWidth={1.7} />
      </Action>
      {open && (
        <div className="period-menu">
          {homeStages.map(([key, label]) => (
            <Action
              className={cx("period-option", mode === key && "selected")}
              key={key}
              onClick={() => {
                setOpen(false)
                select(key)
              }}
            >
              {label}
              {mode === key && <Check size={12} strokeWidth={2} />}
            </Action>
          ))}
        </div>
      )}
    </div>
  )
}
export function BottomTabs({
  active,
  change,
  openSheet,
}: {
  active: MainTab
  change: (tab: MainTab) => void
  openSheet: () => void
}) {
  const tabs: Array<[MainTab, string, ReactNode]> = [
    ["home", "홈", <HomeIcon size={21} strokeWidth={1.5} />],
    ["fun", "놀이터", <Gift size={21} strokeWidth={1.5} />],
    ["archive", "보관함", <Archive size={21} strokeWidth={1.5} />],
    ["community", "커뮤니티", <Users size={21} strokeWidth={1.5} />],
  ]
  return (
    <div className="bottom-tabs">
      {tabs.slice(0, 2).map(([key, label, icon]) => (
        <Action
          className={cx("bottom-tab", active === key && "active")}
          key={key}
          onClick={() => change(key)}
        >
          {icon}
          <span>{label}</span>
        </Action>
      ))}
      <Action className="add-tab" onClick={openSheet} label="기록 추가">
        <Plus size={26} strokeWidth={1.7} />
      </Action>
      {tabs.slice(2).map(([key, label, icon]) => (
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
