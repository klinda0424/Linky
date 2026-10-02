import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  BedDouble,
  Cookie,
  Dumbbell,
  Footprints,
  Moon,
  Receipt,
  Scale,
  ShieldCheck,
  Stethoscope,
  Sun,
  Sunrise,
  Utensils,
} from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

const healthGuess = "수액"
const healthOptions: Array<[label: string, particle: string]> = [
  [healthGuess, "으로"],
  ["진료·처방", "으로"],
  ["검사", "로"],
  ["예방접종", "으로"],
]

// 홈 카드와 건강 보관함 카드가 같은 기록을 보도록 모듈 단위로 공유한다.
// (카드마다 상태를 따로 두면 한쪽에서 고친 내용이 다른 쪽에 반영되지 않는다)
let healthRecord = healthGuess
const healthListeners = new Set<() => void>()
const setHealthRecord = (next: string) => {
  healthRecord = next
  healthListeners.forEach((listener) => listener())
}
const subscribeHealth = (listener: () => void) => {
  healthListeners.add(listener)
  return () => healthListeners.delete(listener)
}
// 직접 입력한 말에 맞는 조사: 받침 없음·ㄹ받침은 "로", 그 외 "으로"
const particleFor = (text: string) => {
  const preset = healthOptions.find(([label]) => label === text)?.[1]
  if (preset) return preset
  const code = text.trim().charCodeAt(text.trim().length - 1) - 0xac00
  if (code < 0 || code > 11171) return "으로"
  const final = code % 28
  return final === 0 || final === 8 ? "로" : "으로"
}

// home.tsx에서도 props 없이 사용한다. props를 추가하면 선택값으로만.
export function HealthCard() {
  const [editing, setEditing] = useState(false)
  const record = useSyncExternalStore(subscribeHealth, () => healthRecord)
  const [draft, setDraft] = useState(record)
  const particle = particleFor(record)
  return (
    <div className={cx("health-card", editing && "editing")}>
      <span className="health-card-icon">
        <Stethoscope size={20} strokeWidth={1.5} />
      </span>
      <div>
        <span>OO내과 45,000원</span>
        {editing ? (
          <>
            <strong>어떤 진료였는지 골라주세요</strong>
            <div className="health-options">
              {healthOptions.map(([label]) => (
                <Action
                  className={cx("suggestion-chip", draft === label && "selected")}
                  key={label}
                  onClick={() => setDraft(label)}
                >
                  {label}
                </Action>
              ))}
            </div>
            <input
              aria-label="진료 내용 직접 입력"
              className="product-input"
              maxLength={20}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="직접 입력"
              value={draft}
            />
            <div className="health-edit-actions">
              <Action
                className="mini-secondary"
                onClick={() => setEditing(false)}
              >
                취소
              </Action>
              <Action
                className="mini-primary"
                disabled={!draft.trim()}
                onClick={() => {
                  setHealthRecord(draft.trim())
                  setEditing(false)
                }}
              >
                완료
              </Action>
            </div>
          </>
        ) : (
          <>
            <strong>
              {record === healthGuess
                ? "→ 수액을 맞은 것으로 추정돼요"
                : `→ ${record}${particle} 기록했어요`}
            </strong>
            <p>{record === healthGuess ? "가맹점·금액 기준" : "직접 고친 기록"}</p>
          </>
        )}
      </div>
      {!editing && (
        <Action
          className="health-edit"
          onClick={() => {
            setDraft(record)
            setEditing(true)
          }}
        >
          수정
        </Action>
      )}
    </div>
  )
}
export function HealthConsent({
  decline,
  agree,
}: {
  decline: () => void
  agree: () => void
}) {
  const [declined, setDeclined] = useState(false)
  const declineRef = useRef(decline)
  declineRef.current = decline
  useEffect(() => {
    if (!declined) return
    const timer = window.setTimeout(() => declineRef.current(), 1400)
    return () => window.clearTimeout(timer)
  }, [declined])
  const sections = [
    ["수집 항목", "결제 가맹점명, 결제 금액, 결제 시각"],
    ["목적", "진료 과목 추정과 건강 카드 생성"],
    ["저장 위치", "기기 내 암호화 저장, 서버 전송 없음"],
  ]
  if (declined)
    return (
      <div className="main-overlay" onClick={decline}>
        <div className="health-consent-sheet consent-declined">
          <div className="sheet-grip" />
          <span className="consent-icon neutral">
            <Receipt size={24} strokeWidth={1.5} />
          </span>
          <p className="sheet-title">지출로만 기록했어요</p>
          <p className="sheet-sub">
            OO내과 45,000원은 의료비 지출로 남겨둘게요. 건강 기록은 만들지
            않았어요.
          </p>
        </div>
      </div>
    )
  return (
    <div className="main-overlay">
      <div className="health-consent-sheet">
        <div className="sheet-grip" />
        <span className="consent-icon">
          <Stethoscope size={24} strokeWidth={1.5} />
        </span>
        <p className="sheet-title">내과 결제가 감지됐어요</p>
        <p className="sheet-sub">건강 기록으로 연결하려면 동의가 필요해요</p>
        <div className="consent-payment">
          <span>감지된 결제</span>
          <strong>OO내과 45,000원</strong>
        </div>
        <div className="consent-sections">
          {sections.map(([title, copy]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </div>
          ))}
        </div>
        <p className="consent-note">
          <ShieldCheck size={14} strokeWidth={1.6} />
          다른 사람과 공유되지 않고, 언제든 연결을 끊을 수 있어요
        </p>
        <div className="consent-actions">
          <Action className="secondary-button" onClick={() => setDeclined(true)}>
            거절하고 지출로만 기록
          </Action>
          <Action className="primary-button" onClick={agree}>
            동의하고 연결
          </Action>
        </div>
      </div>
    </div>
  )
}
// 건강 보관함: 시험기간 주(12/8~14, 일요일 시작)의 하루별 건강 기록.
// 오늘(12일)은 U4-3 식단 사진 인식, 저녁 배달 결제, U6 내과 결제와 이어진다.
type Meal = {
  slot: "아침" | "점심" | "저녁" | "간식"
  name?: string
  kcal?: number
  // 어디서 기록됐는지 (입력 요구 없이 자동 연결)
  source?: string
}
type HealthDay = {
  date: number
  weekday: string
  steps: number
  // 운동 기록(건강 앱). 없으면 0
  workout: { minutes: number; name?: string }
  // 수면(건강 앱): 잠든 시각 ~ 일어난 시각, 분
  sleep: { from: string; to: string; minutes: number }
  // 체중(건강 앱·체중계). 재지 않은 날은 없음
  weight?: number
  meals: Meal[]
  // 탄·단·지 g
  macros?: [number, number, number]
  hospital?: boolean
}
const emptyMeals: Meal[] = [
  { slot: "아침" },
  { slot: "점심" },
  { slot: "저녁" },
  { slot: "간식" },
]
const healthWeek: HealthDay[] = [
  { date: 8, weekday: "일", steps: 7420, workout: { minutes: 30, name: "걷기" }, sleep: { from: "00:20", to: "07:30", minutes: 430 }, weight: 55.4, meals: emptyMeals },
  { date: 9, weekday: "월", steps: 6810, workout: { minutes: 40, name: "요가" }, sleep: { from: "00:50", to: "07:30", minutes: 400 }, weight: 55.3, meals: emptyMeals },
  { date: 10, weekday: "화", steps: 5230, workout: { minutes: 0 }, sleep: { from: "01:25", to: "07:30", minutes: 365 }, meals: emptyMeals },
  { date: 11, weekday: "수", steps: 4980, workout: { minutes: 0 }, sleep: { from: "02:10", to: "07:30", minutes: 320 }, weight: 55.1, meals: emptyMeals },
  {
    date: 12,
    weekday: "목",
    steps: 3410,
    workout: { minutes: 0 },
    // 새벽 1시 택시 귀가 뒤 잠든 날
    sleep: { from: "02:40", to: "07:30", minutes: 290 },
    weight: 55.2,
    meals: [
      { slot: "아침" },
      { slot: "점심", name: "닭가슴살 샐러드", kcal: 320, source: "사진 인식" },
      { slot: "저녁", name: "떡볶이", kcal: 480, source: "배달 결제" },
      { slot: "간식" },
    ],
    macros: [108, 42, 22],
    hospital: true,
  },
  { date: 13, weekday: "금", steps: 0, workout: { minutes: 0 }, sleep: { from: "", to: "", minutes: 0 }, meals: emptyMeals },
  { date: 14, weekday: "토", steps: 0, workout: { minutes: 0 }, sleep: { from: "", to: "", minutes: 0 }, meals: emptyMeals },
]
const todayDate = 12
const mealIcons: Record<Meal["slot"], ReactNode> = {
  아침: <Sunrise size={20} strokeWidth={1.5} />,
  점심: <Sun size={20} strokeWidth={1.5} />,
  저녁: <Moon size={20} strokeWidth={1.5} />,
  간식: <Cookie size={20} strokeWidth={1.5} />,
}
const formatNumber = (value: number) => value.toLocaleString("ko-KR")
const formatSleep = (minutes: number) =>
  `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ""}`

// 체중 추이: 이번 주 잰 날만 이은 선 (선택한 날까지)
function WeightLine({ selected }: { selected: number }) {
  const points = healthWeek.filter(
    (item) => item.weight !== undefined && item.date <= todayDate,
  )
  const values = points.map((item) => item.weight!)
  const min = Math.min(...values) - 0.2
  const max = Math.max(...values) + 0.2
  const x = (date: number) => ((date - 8) / 6) * 100
  // 0~30 (위가 0). 점이 잘리지 않게 위아래 4씩 여백
  const y = (weight: number) => 26 - ((weight - min) / (max - min)) * 22
  return (
    <div aria-hidden="true" className="health-weight-chart">
      <svg preserveAspectRatio="none" viewBox="0 0 100 30">
        <polyline
          points={points
            .map((item) => `${x(item.date)},${y(item.weight!)}`)
            .join(" ")}
        />
      </svg>
      {/* 점은 늘어나지 않게 HTML로 */}
      {points.map((item) => (
        <i
          className={cx(item.date === selected && "selected")}
          key={item.date}
          style={{
            left: `${x(item.date)}%`,
            top: `${(y(item.weight!) / 30) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export function HealthArchive({ back }: { back: () => void }) {
  const [selected, setSelected] = useState(todayDate)
  const day = healthWeek.find((item) => item.date === selected) ?? healthWeek[4]
  const previous = healthWeek.find((item) => item.date === selected - 1)
  const kcal = day.meals.reduce((sum, meal) => sum + (meal.kcal ?? 0), 0)
  const macroTotal = day.macros?.reduce((sum, value) => sum + value, 0) ?? 0
  const macroPercent = (value: number) =>
    macroTotal ? Math.round((value / macroTotal) * 100) : 0
  const maxSteps = Math.max(...healthWeek.map((item) => item.steps), 1)
  const maxSleep = Math.max(...healthWeek.map((item) => item.sleep.minutes), 1)
  // 선택한 날 이전의 마지막 체중 기록
  const lastWeight = [...healthWeek]
    .reverse()
    .find((item) => item.date < selected && item.weight !== undefined)
  const stepDiff = previous ? day.steps - previous.steps : 0
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="건강 보관함" />
      <div className="health-archive-content">
        <div className="main-card health-week">
          <div className="block-heading">
            <strong>12월 {selected}일</strong>
            <span>{selected === todayDate ? "오늘" : "시험기간 주"}</span>
          </div>
          <div className="health-week-days">
            {healthWeek.map((item) => {
              const future = item.date > todayDate
              return (
                <Action
                  className={cx(
                    "health-week-day",
                    item.date === selected && "selected",
                    future && "future",
                  )}
                  disabled={future}
                  key={item.date}
                  label={`12월 ${item.date}일`}
                  onClick={() => setSelected(item.date)}
                >
                  <span>{item.weekday}</span>
                  <strong>{item.date}</strong>
                </Action>
              )
            })}
          </div>
        </div>

        <div className="main-card health-diet">
          <div className="health-card-heading">
            <span>
              <Utensils size={14} strokeWidth={1.6} /> 식단
            </span>
            <strong>{formatNumber(kcal)} kcal</strong>
          </div>
          {day.macros ? (
            <>
              <div className="health-macro-bar" aria-hidden="true">
                {day.macros.map((value, index) => (
                  <i
                    className={`macro-${index}`}
                    key={index}
                    style={{ width: `${macroPercent(value)}%` }}
                  />
                ))}
              </div>
              <div className="health-macros">
                {(["탄", "단", "지"] as const).map((label, index) => (
                  <span key={label}>
                    <i className={`macro-${index}`} />
                    {label} {macroPercent(day.macros![index])}%
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="health-empty">이날 식단 기록은 없어요</p>
          )}
          <div className="health-meals">
            {day.meals.map((meal) => (
              <div
                className={cx("health-meal", meal.name && "recorded")}
                key={meal.slot}
              >
                <span className="health-meal-icon">{mealIcons[meal.slot]}</span>
                <strong>{meal.slot}</strong>
                {meal.name ? (
                  <>
                    <span>{meal.name}</span>
                    <small>{meal.kcal}kcal</small>
                    <em>{meal.source}</em>
                  </>
                ) : (
                  <span className="muted">기록 없음</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 병원 기록은 있는 날에만 보여준다 */}
        {day.hospital && (
          <div className="main-card health-hospital">
            <div className="health-card-heading">
              <span>
                <Stethoscope size={14} strokeWidth={1.6} /> 병원
              </span>
            </div>
            <HealthCard />
          </div>
        )}

        <div className="health-grid">
          <div className="main-card health-sleep">
            <div className="health-card-heading">
              <span>
                <BedDouble size={14} strokeWidth={1.6} /> 수면
              </span>
            </div>
            <strong className="health-big">
              {formatSleep(day.sleep.minutes)}
            </strong>
            <p className="health-compare">
              {day.sleep.from} ~ {day.sleep.to}
            </p>
            <div className="health-step-bars" aria-hidden="true">
              {healthWeek.map((item) => (
                <i
                  className={cx(item.date === selected && "selected")}
                  key={item.date}
                  style={{
                    height: `${Math.max((item.sleep.minutes / maxSleep) * 100, 6)}%`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="main-card health-weight">
            <div className="health-card-heading">
              <span>
                <Scale size={14} strokeWidth={1.6} /> 체중
              </span>
            </div>
            {day.weight !== undefined ? (
              <strong className="health-big">
                {day.weight.toFixed(1)}
                <small>kg</small>
              </strong>
            ) : (
              <strong className="health-big muted">-</strong>
            )}
            <p className="health-compare">
              {day.weight !== undefined
                ? lastWeight
                  ? `지난 기록 ${lastWeight.weight!.toFixed(1)}kg (${lastWeight.date}일)`
                  : "이번 주 첫 기록이에요"
                : "이날은 재지 않았어요"}
            </p>
            <WeightLine selected={selected} />
          </div>
          <div className="main-card health-steps">
            <div className="health-card-heading">
              <span>
                <Footprints size={14} strokeWidth={1.6} /> 걸음수
              </span>
            </div>
            <strong className="health-big">
              {formatNumber(day.steps)}
              <small>걸음</small>
            </strong>
            {previous && (
              <p className="health-compare">
                전날보다 {formatNumber(Math.abs(stepDiff))}걸음{" "}
                {stepDiff < 0 ? "적어요" : "많아요"}
              </p>
            )}
            <div className="health-step-bars" aria-hidden="true">
              {healthWeek.map((item) => (
                <i
                  className={cx(item.date === selected && "selected")}
                  key={item.date}
                  style={{ height: `${Math.max((item.steps / maxSteps) * 100, 6)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="main-card health-workout">
            <div className="health-card-heading">
              <span>
                <Dumbbell size={14} strokeWidth={1.6} /> 운동
              </span>
            </div>
            <strong className="health-big">
              {day.workout.minutes}
              <small>분</small>
            </strong>
            <p className="health-compare">
              {day.workout.name
                ? `${day.workout.name} 기록이 있어요`
                : "이날 운동 기록은 없어요"}
            </p>
          </div>
        </div>
        <p className="health-source">
          수면·체중·걸음수·운동은 건강 앱에서 가져와요
        </p>

        <div className="health-security">
          <ShieldCheck size={18} strokeWidth={1.5} />
          <p>
            건강 기록은 기기 안에 안전하게 저장돼요. 언제든 연결을 해제할 수
            있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
