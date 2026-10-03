import {
  Camera,
  ChevronRight,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

export function CoachHub({
  back,
  mood,
  goals,
}: {
  back: () => void
  mood: () => void
  goals: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="AI 코치" />
      <div className="coach-hub-content">
        <div className="coach-welcome">
          <span className="large-rini">L</span>
          <div>
            <strong>필요한 순간에만 함께할게요</strong>
            <p>오늘 기록하거나 확인할 내용을 골라주세요</p>
          </div>
        </div>
        <Action className="coach-menu-card" onClick={mood}>
          <span className="icon-box pink">😩</span>
          <div>
            <strong>오늘 기분 기록</strong>
            <p>한 번 눌러 오늘 결제와 연결해요</p>
          </div>
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
        <Action className="coach-menu-card" onClick={goals}>
          <span className="icon-box green">
            <Sparkles size={20} strokeWidth={1.5} />
          </span>
          <div>
            <strong>목표 달성 관리</strong>
            <p>다이어트 모드의 이번 주 흐름을 봐요</p>
          </div>
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
      </div>
    </div>
  )
}
export function GoalAchievement({ back }: { back: () => void }) {
  const week = [
    ["월", "delivery-1"],
    ["화", "delivery-2"],
    ["수", "delivery-3"],
    ["목", "delivery-4"],
    ["금", "delivery-5"],
    ["토", "delivery-6"],
    ["일", "delivery-7"],
  ] as const
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="목표 달성 관리" />
      <div className="achievement-content">
        <div className="achievement-heading">
          <span>🥗</span>
          <div>
            <strong>다이어트 모드</strong>
            <p>식비와 배달 흐름을 함께 보고 있어요</p>
          </div>
        </div>
        <div className="achievement-stats">
          <div>
            <span>해먹은 날</span>
            <strong>9일</strong>
          </div>
          <div>
            <span>아낀 돈</span>
            <strong>80,000원</strong>
          </div>
        </div>
        <div className="weekly-delivery">
          <div className="block-heading">
            <strong>배달 횟수</strong>
            <span>이번 주 감소 중</span>
          </div>
          <div className="weekly-bars">
            {week.map(([day, heightClass]) => (
              <div key={day}>
                <i>
                  <b className={heightClass} />
                </i>
                <span>{day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="coach-observation">
          <span className="rini-avatar">L</span>
          <p>냉장고 재료로 해먹은 날이 늘었어요</p>
        </div>
      </div>
    </div>
  )
}
export function CoachChat({ back }: { back: () => void }) {
  const recipes = [
    ["닭가슴살 샐러드", "10분", "salad"],
    ["요거트 볼", "5분", "bowl"],
  ]
  return (
    <div className="main-page sub-page chat-page">
      <MainHeader back={back} title="링키와 대화" />
      <div className="chat-content">
        <div className="user-bubble">냉장고 있는 걸로 뭐 해먹지?</div>
        <div className="rini-message">
          <span className="rini-avatar">L</span>
          <div>
            <p>지금 있는 재료로 가볍게 만들 수 있는 메뉴를 골라봤어요.</p>
            <div className="recipe-list">
              {recipes.map(([name, time, visual]) => (
                <Action className="recipe-card" key={name}>
                  <span className={cx("recipe-image", visual)}>
                    <UtensilsCrossed size={24} strokeWidth={1.3} />
                  </span>
                  <div>
                    <strong>
                      {name} · {time}
                    </strong>
                    <span>보유 재료 4/5</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Action>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="chat-input">
        <Action className="chat-photo" label="사진 추가">
          <Camera size={19} strokeWidth={1.5} />
        </Action>
        <div>링키에게 물어보기</div>
      </div>
    </div>
  )
}
