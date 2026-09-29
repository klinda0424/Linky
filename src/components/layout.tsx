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
import { useEffect, useState, type ReactNode } from "react"
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
export function HomeSegments({
  travelMode,
  prepareMode,
  afterMode,
  monthLaterMode,
  selectExam,
  selectPrepare,
  selectTravel,
  selectAfter,
  selectMonthLater,
}: {
  travelMode: boolean
  prepareMode: boolean
  afterMode: boolean
  monthLaterMode: boolean
  selectExam: () => void
  selectPrepare: () => void
  selectTravel: () => void
  selectAfter: () => void
  selectMonthLater: () => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(travelMode ? "여행 중" : "시험기간")
  useEffect(() => {
    if (travelMode) setSelected("여행 중")
    else if (prepareMode) setSelected("여행 준비")
    else if (afterMode) setSelected("여행 후")
    else if (monthLaterMode) setSelected("한 달 뒤")
    else setSelected("시험기간")
  }, [afterMode, monthLaterMode, prepareMode, travelMode])
  const options = ["시험기간", "여행 준비", "여행 중", "여행 후", "한 달 뒤"]
  return (
    <div className="home-period-dropdown">
      <Action className="period-trigger" onClick={() => setOpen(!open)}>
        <span>{selected}</span>
        <ChevronDown size={11} strokeWidth={1.7} />
      </Action>
      {open && (
        <div className="period-menu">
          {options.map((label) => (
            <Action
              className={cx("period-option", selected === label && "selected")}
              key={label}
              onClick={() => {
                setOpen(false)
                if (label === "시험기간") {
                  setSelected(label)
                  selectExam()
                } else if (label === "여행 준비") {
                  setSelected(label)
                  selectPrepare()
                } else if (label === "여행 중") {
                  setSelected(label)
                  selectTravel()
                } else if (label === "여행 후") {
                  setSelected(label)
                  selectAfter()
                } else if (label === "한 달 뒤") {
                  setSelected(label)
                  selectMonthLater()
                }
              }}
            >
              {label}
              {selected === label && <Check size={12} strokeWidth={2} />}
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
    ["fun", "재미요소", <Gift size={21} strokeWidth={1.5} />],
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
