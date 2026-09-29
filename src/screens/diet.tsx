import { UtensilsCrossed } from "lucide-react"
import { useEffect, useState } from "react"
import { Action, Badge, cx } from "@/components/common"
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
const recognizedFood = "닭가슴살 샐러드"
const foodNutrition: Record<string, [number, number, number]> = {
  [recognizedFood]: [320, 32, 18],
  "콥 샐러드": [450, 24, 14],
  "닭가슴살 포케": [480, 30, 52],
}

export function FoodRecognition({
  back,
  saved,
}: {
  back: () => void
  saved: () => void
}) {
  const [recognizing, setRecognizing] = useState(true)
  const [editing, setEditing] = useState(false)
  const [food, setFood] = useState(recognizedFood)
  useEffect(() => {
    const timer = window.setTimeout(() => setRecognizing(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])
  const name = food.trim()
  const nutrition = foodNutrition[name]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="식단 사진 인식" />
      <div className="food-content">
        <div className="food-photo">
          <span>
            <UtensilsCrossed size={44} strokeWidth={1.2} />
          </span>
          <Badge>{recognizing ? "사진 분석 중" : "사진 분석 완료"}</Badge>
        </div>
        <div className="food-result">
          <span className="rini-avatar">L</span>
          {recognizing ? (
            <div className="food-recognizing">
              <p>음식을 알아보는 중이에요</p>
              <span className="loading-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : (
            <p>
              {editing
                ? "비슷한 음식 중에서 골라주세요"
                : `${recognizedFood} 맞나요?`}
            </p>
          )}
          {editing && (
            <div className="food-suggestions">
              {Object.keys(foodNutrition).map((item) => (
                <Action
                  className={cx("suggestion-chip", name === item && "selected")}
                  key={item}
                  onClick={() => setFood(item)}
                >
                  {item}
                </Action>
              ))}
              <input
                aria-label="음식 이름"
                className="food-input"
                onChange={(event) => setFood(event.target.value)}
                placeholder="목록에 없으면 직접 입력"
                value={food}
              />
            </div>
          )}
        </div>
        {!recognizing &&
          (nutrition ? (
            <>
              <div className="nutrition-card">
                <div>
                  <span>칼로리</span>
                  <strong>{nutrition[0]}kcal</strong>
                </div>
                <div>
                  <span>단백질</span>
                  <strong>{nutrition[1]}g</strong>
                </div>
                <div>
                  <span>탄수화물</span>
                  <strong>{nutrition[2]}g</strong>
                </div>
              </div>
              <p className="nutrition-caption">
                식품의약품안전처 식품영양성분 DB 기준
              </p>
            </>
          ) : (
            <p className="nutrition-caption">
              직접 입력한 음식은 영양 정보 없이 저장돼요
            </p>
          ))}
      </div>
      {!recognizing && (
        <div className="ai-bottom">
          {editing ? (
            <>
              <Action
                className="secondary-button"
                onClick={() => {
                  setFood(recognizedFood)
                  setEditing(false)
                }}
              >
                취소
              </Action>
              <Action
                className="primary-button"
                disabled={!name}
                onClick={saved}
              >
                저장
              </Action>
            </>
          ) : (
            <>
              <Action
                className="secondary-button"
                onClick={() => setEditing(true)}
              >
                아니에요
              </Action>
              <Action className="primary-button" onClick={saved}>
                맞아요
              </Action>
            </>
          )}
        </div>
      )}
    </div>
  )
}
