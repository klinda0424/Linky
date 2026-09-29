import { UtensilsCrossed } from "lucide-react"
import { useState } from "react"
import {
  Action,
  Badge,
  EditableLine,
  cx,
} from "@/components/common"
import { MainHeader } from "@/components/layout"

export function FridgePage({
  back,
  ask,
}: {
  back: () => void
  ask: () => void
}) {
  const foods = [
    ["닭가슴살", "12/10 구매", "protein"],
    ["양상추", "12/10 구매", "leaf"],
    ["방울토마토", "12/8 구매", "tomato"],
    ["그릭요거트", "12/8 구매", "yogurt"],
  ]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="냉장고" />
      <div className="fridge-content">
        <p className="section-title">최근 담긴 식재료</p>
        <div className="fridge-list">
          {foods.map(([name, date, color]) => (
            <div className="fridge-row" key={name}>
              <span className={cx("food-thumb", color)}>
                <UtensilsCrossed size={19} strokeWidth={1.4} />
              </span>
              <div>
                <strong>{name}</strong>
                <span>{date}</span>
              </div>
              <Badge>보유 중</Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="main-footer">
        <Action className="primary-button" onClick={ask}>
          이걸로 뭐 해먹지?
        </Action>
      </div>
    </div>
  )
}
export function FoodRecognition({
  back,
  saved,
}: {
  back: () => void
  saved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [food, setFood] = useState("닭가슴살 샐러드")
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="식단 사진 인식" />
      <div className="food-content">
        <div className="food-photo">
          <span>
            <UtensilsCrossed size={44} strokeWidth={1.2} />
          </span>
          <Badge>사진 분석 완료</Badge>
        </div>
        <div className="food-result">
          <span className="rini-avatar">L</span>
          {editing ? (
            <EditableLine
              placeholder="음식 이름을 입력해주세요"
              setValue={setFood}
              value={food}
            />
          ) : (
            <p>닭가슴살 샐러드 맞나요?</p>
          )}
          {editing && (
            <div className="food-suggestions">
              {["닭가슴살 샐러드", "콥 샐러드", "닭가슴살 포케"].map((item) => (
                <Action
                  className={cx("suggestion-chip", food === item && "selected")}
                  key={item}
                  onClick={() => setFood(item)}
                >
                  {item}
                </Action>
              ))}
            </div>
          )}
        </div>
        <div className="nutrition-card">
          <div>
            <span>칼로리</span>
            <strong>320kcal</strong>
          </div>
          <div>
            <span>단백질</span>
            <strong>32g</strong>
          </div>
          <div>
            <span>탄수화물</span>
            <strong>18g</strong>
          </div>
        </div>
        <p className="nutrition-caption">
          식품의약품안전처 식품영양성분 DB 기준
        </p>
      </div>
      <div className="ai-bottom">
        <Action className="secondary-button" onClick={() => setEditing(true)}>
          수정
        </Action>
        <Action className="primary-button" onClick={saved}>
          맞아요
        </Action>
      </div>
    </div>
  )
}
