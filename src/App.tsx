import { MainApp } from "@/MainApp"
import { StatusBar } from "@/components/common"

// 삭제 단계의 임시 껍데기: 새 온보딩과 탭 구조는 다음 커밋에서 채운다.
export default function App() {
  return (
    <div className="app-shell">
      <div className="phone">
        <StatusBar />
        <MainApp />
      </div>
    </div>
  )
}
