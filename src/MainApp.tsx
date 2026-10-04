import { useState } from "react"
import { BottomTabs, MainHeader } from "@/components/layout"
import { type MainTab } from "@/types"

// 탭 구조 단계의 임시 화면: 각 탭의 실제 화면은 다음 커밋에서 채운다.
const titles: Record<MainTab, string> = {
  calendar: "캘린더",
  map: "지도",
  album: "앨범",
  mypage: "마이페이지",
}

export function MainApp() {
  const [tab, setTab] = useState<MainTab>("calendar")
  return (
    <div className="main-page">
      <MainHeader title={titles[tab]} />
      <BottomTabs active={tab} change={setTab} />
    </div>
  )
}
