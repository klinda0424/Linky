import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Heart,
  HeartPulse,
  Image,
  Info,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react"

import { useState, type ReactNode, type TouchEvent } from "react"

import {
  Action,
  Badge,
  Footer,
  PageTitle,
  Screen,
  Toggle,
  cx,
} from "@/components/common"

import { type DomainKey, type PermissionKey, type Tone } from "@/types"

export function BasicInfo({
  nickname,

  setNickname,

  birthYear,

  setBirthYear,

  job,

  setJob,

  next,

  skipToHome,
}: {
  nickname: string

  setNickname: (value: string) => void

  birthYear: string

  setBirthYear: (value: string) => void

  job: string

  setJob: (value: string) => void

  next: () => void

  skipToHome: () => void
}) {
  return (
    <Screen step={1}>
      <PageTitle
        title={"Linky가 나를 알아가려면\n뭐가 필요할까요?"}
        sub="딱 세 가지만요 😊"
      />
      <div className="form-list">
        <div className="field">
          <p className="field-label">닉네임</p>
          <div className="text-field">
            {/* 한 줄 입력칸: Enter로 줄이 바뀌지 않고, 화면에서도 10자까지만 써진다 (프로필 회원 정보와 같은 방식) */}
            <input
              aria-label="닉네임"
              enterKeyHint="done"
              maxLength={10}
              onChange={(event) => setNickname(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
              placeholder="예: 지은이"
              value={nickname}
            />
            <span>{nickname.length}/10</span>
          </div>
        </div>
        <div className="field">
          <p className="field-label">출생연도</p>
          <div className="select-field">
            <select
              aria-label="출생연도"
              onChange={(event) => setBirthYear(event.currentTarget.value)}
              value={birthYear}
            >
              {birthYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <ChevronDown size={17} strokeWidth={1.5} />
          </div>
        </div>
        <div className="field">
          <p className="field-label">직업 상태</p>
          <div className="job-grid">
            {jobOptions.map((item) => (
              <Action
                className={cx("choice-chip", job === item && "selected")}
                key={item}
                onClick={() => setJob(item)}
              >
                {item}
              </Action>
            ))}
          </div>
        </div>
      </div>
      <Footer
        button="다음"
        caption="입력한 정보는 리포트 문구를 맞추는 데만 쓰여요"
        disabled={!nickname || !job}
        onNext={next}
      />
      <Action className="dev-skip-link" onClick={skipToHome}>
        개발용 · 홈으로 건너뛰기
      </Action>
    </Screen>
  )
}

export const jobOptions = [
  "🎓 대학생",

  "💼 직장인",

  "📝 취준생",

  "✨ 기타",
]

export const birthYears = Array.from({ length: 75 }, (_, index) =>
  String(2010 - index),
)

export const goals = [
  ["📊", "지출 파악하기"],

  ["🔍", "소비 습관 이해하기"],

  ["💰", "절약하기"],

  ["🥗", "다이어트"],

  ["📅", "일정 관리"],

  ["📖", "그냥 기록해보기"],
]

export function Goals({
  selected,

  toggle,

  next,

  back,
}: {
  selected: string[]

  toggle: (value: string) => void

  next: () => void

  back: () => void
}) {
  return (
    <Screen step={2} onBack={back}>
      <PageTitle
        title={"요즘 가장 챙기고 싶은 건\n뭐예요?"}
        sub="여러 개 골라도 돼요"
      />
      <div className="goal-grid">
        {goals.map(([emoji, label]) => (
          <Action
            className={cx("goal-card", selected.includes(label) && "selected")}
            key={label}
            onClick={() => toggle(label)}
          >
            <span>{emoji}</span>
            <strong>{label}</strong>
            {selected.includes(label) && (
              <i>
                <Check size={11} strokeWidth={2.3} />
              </i>
            )}
          </Action>
        ))}
      </div>
      <Footer
        button="다음"
        caption="나중에 프로필에서 언제든 바꿀 수 있어요"
        disabled={!selected.length}
        onNext={next}
        skip={next}
      />
    </Screen>
  )
}

export const domains: Array<{
  key: DomainKey

  title: string

  description: string

  icon: ReactNode

  color: string

  locked?: boolean
}> = [
  {
    key: "spend",

    title: "지출",

    description: "모든 기록의 중심이에요",

    icon: <CircleDollarSign size={19} strokeWidth={1.5} />,

    color: "lime",

    locked: true,
  },

  {
    key: "emotion",

    title: "감정",

    description: "소비 뒤에 숨은 기분을 찾아드려요",

    icon: <Heart size={19} strokeWidth={1.5} />,

    color: "pink",
  },

  {
    key: "schedule",

    title: "일정",

    description: "약속과 시험 기간의 지출을 묶어드려요",

    icon: <CalendarDays size={19} strokeWidth={1.5} />,

    color: "blue",
  },

  {
    key: "health",

    title: "건강",

    description: "지출이 알려주는 건강 신호를 볼 수 있어요",

    icon: <HeartPulse size={19} strokeWidth={1.5} />,

    color: "green",
  },

  {
    key: "shopping",

    title: "쇼핑",

    description: "산 물건을 옷장·냉장고로 모아드려요",

    icon: <ShoppingBag size={19} strokeWidth={1.5} />,

    color: "purple",
  },
]

export function Domains({
  values,

  toggle,

  toast,

  closeToast,

  next,

  back,
}: {
  values: Record<DomainKey, boolean>

  toggle: (key: DomainKey) => void

  toast: boolean

  closeToast: () => void

  next: () => void

  back: () => void
}) {
  return (
    <Screen step={3} onBack={back}>
      <PageTitle
        title={"지출과 함께 연결해서 볼\n기록을 골라주세요"}
        sub="나중에 보관함에서 모아 볼 수 있어요"
      />
      <div className="list-cards domain-cards">
        {domains.map((item) => (
          <Action
            className={cx(
              "list-card",

              values[item.key] && !item.locked && "selected",

              item.locked && "locked-card",
            )}
            key={item.key}
            onClick={() => !item.locked && toggle(item.key)}
          >
            <span className={cx("icon-box", item.color)}>{item.icon}</span>
            <div className="list-copy">
              <div className="label-row">
                <strong>{item.title}</strong>
                {item.locked && <Badge>🔒 기본</Badge>}
              </div>
              <span>{item.description}</span>
            </div>
            <Toggle locked={item.locked} on={values[item.key]} />
          </Action>
        ))}
      </div>
      {toast && values.health && (
        <div className="dark-toast">
          <Info size={14} strokeWidth={1.7} />
          <span>건강 관련 데이터는 동의 후에만 수집돼요</span>
          <Action onClick={closeToast} label="안내 닫기">
            <X size={15} strokeWidth={1.7} />
          </Action>
        </div>
      )}
      <Footer button="다음" onNext={next} skip={next} />
    </Screen>
  )
}

export const permissions: Array<{
  key: PermissionKey

  title: string

  parenthetical?: string

  description: string

  required?: boolean

  icon: ReactNode
}> = [
  {
    key: "payment",

    title: "카드·계좌",

    parenthetical: "토스 등",

    description: "결제 내역 자동 불러오기",

    required: true,

    icon: <CreditCard size={19} strokeWidth={1.5} />,
  },

  {
    key: "calendar",

    title: "캘린더",

    description: "일정 인식과 지출 묶기",

    icon: <CalendarDays size={19} strokeWidth={1.5} />,
  },

  {
    key: "location",

    title: "위치",

    description: "결제 장소 맥락 추가",

    icon: <MapPin size={19} strokeWidth={1.5} />,
  },

  {
    key: "photos",

    title: "사진·캡처",

    description: "영수증·단톡 캡처 인식",

    icon: <Image size={19} strokeWidth={1.5} />,
  },

  {
    key: "health",

    title: "건강 앱",

    parenthetical: "걸음 수 등",

    description: "운동 기록 자동 표시",

    icon: <HeartPulse size={19} strokeWidth={1.5} />,
  },
]

export function Permissions({
  values,

  toggle,

  next,

  back,
}: {
  values: Record<PermissionKey, boolean>

  toggle: (key: PermissionKey) => void

  next: () => void

  back: () => void
}) {
  return (
    <Screen step={4} onBack={back}>
      <PageTitle
        title={"필요한 것만,\n원할 때만 연결해요"}
        sub="항목을 탭하면 자세한 내용을 볼 수 있어요"
      />
      <div className="list-cards permission-cards">
        {permissions.map((item) => (
          <div className="list-card" key={item.key}>
            <span className="icon-box neutral">{item.icon}</span>
            <div className="list-copy">
              <div className="label-row">
                <strong>
                  {item.title}
                  {item.parenthetical && <small> ({item.parenthetical})</small>}
                </strong>
                <Badge>{item.required ? "필수" : "선택"}</Badge>
              </div>
              <span>{item.description}</span>
            </div>
            <Toggle
              locked={item.required}
              on={values[item.key]}
              onClick={() => toggle(item.key)}
            />
          </div>
        ))}
      </div>
      <Footer
        button="다음"
        caption="연동은 프로필 > 연동 서비스 관리에서 언제든 해제할 수 있어요"
        onNext={next}
      />
    </Screen>
  )
}

export function AnalysisComplete({
  next,

  back,
}: {
  next: () => void

  back: () => void
}) {
  const results = [
    ["🧾", "지난 3개월 결제 214건을 불러왔어요"],

    ["👥", "이 중 그룹 지출로 보이는 결제가 23건 있어요"],

    ["🛍", "가맹점명만 있던 결제 41건의 구매 항목을 찾았어요"],
  ]

  return (
    <Screen step={5} onBack={back}>
      <div className="complete-content">
        <span className="complete-check">
          <Check size={30} strokeWidth={2.2} />
        </span>
        <p className="complete-title">다 살펴봤어요!</p>
        <div className="result-list">
          {results.map(([emoji, copy]) => (
            <div className="result-row" key={copy}>
              <span>{emoji}</span>
              <p>{copy}</p>
            </div>
          ))}
        </div>
        <div className="info-banner">
          <Info size={15} strokeWidth={1.7} />
          <span>잘못 묶인 게 있으면 나중에 수정할 수 있어요</span>
        </div>
      </div>
      <Footer button="리포트 톤 고르기" onNext={next} />
    </Screen>
  )
}

export function ToneOptions({
  tone,

  setTone,
}: {
  tone?: Tone

  setTone: (tone: Tone) => void
}) {
  return (
    <div className="tone-cards">
      <Action
        className={cx("tone-card", tone === "narrative" && "selected")}
        onClick={() => setTone("narrative")}
      >
        <div className="tone-label">
          <span>🗨️</span>
          <strong>서사형</strong>
          {tone === "narrative" && <Check size={15} strokeWidth={2.2} />}
        </div>
        <div className="tone-preview">
          “힘든 2주였네요. 지친 날엔 배달과 옷 구매가 함께 있었어요.”
        </div>
        <p>따뜻하게, 맥락 중심으로 전달해요</p>
      </Action>
      <Action
        className={cx("tone-card", tone === "numeric" && "selected")}
        onClick={() => setTone("numeric")}
      >
        <div className="tone-label">
          <span>📊</span>
          <strong>수치형</strong>
          {tone === "numeric" && <Check size={15} strokeWidth={2.2} />}
        </div>
        <div className="tone-preview numeric-preview">
          {[
            ["배달", "bar-long"],

            ["쇼핑", "bar-mid"],

            ["병원", "bar-short"],
          ].map(([label, width]) => (
            <div className="preview-bar" key={label}>
              <span>{label}</span>
              <i>
                <b className={width} />
              </i>
            </div>
          ))}
          <strong>배달 11회 · 쇼핑 4회 · 병원 2회</strong>
        </div>
        <p>숫자와 빈도 중심으로 간결하게 전달해요</p>
      </Action>
    </div>
  )
}

export function ToneSelection({
  tone,

  setTone,

  next,

  back,
}: {
  tone?: Tone

  setTone: (tone: Tone) => void

  next: () => void

  back: () => void
}) {
  return (
    <Screen step={6} onBack={back}>
      <PageTitle
        title={"리포트를 어떤 말투로\n받아볼까요?"}
        sub="같은 데이터를 다른 방식으로 보여줘요"
      />
      <ToneOptions setTone={setTone} tone={tone} />
      <Footer
        button="다음"
        caption="프로필 > 리포트 톤 설정에서 언제든 바꿀 수 있어요"
        disabled={!tone}
        onNext={next}
        skip={next}
      />
    </Screen>
  )
}

export const coachSlides = [
  {
    icon: <Search size={24} strokeWidth={1.5} />,

    title: "판단하지 않고 사실부터\n정리해드려요",

    description:
      "소비를 평가하지 않아요. 어떤 날에 어떤 지출이 있었는지, 사실만 먼저 정리해드려요.",
  },

  {
    icon: <MessageCircle size={24} strokeWidth={1.5} />,

    title: "필요한 순간에만\n먼저 말을 걸어요",

    description:
      "매일 푸시를 보내지 않아요. 패턴이 바뀌거나 놓친 기록이 있을 때만 조용히 알려드려요.",
  },

  {
    icon: <Bell size={24} strokeWidth={1.5} />,

    title: "알림과 제안은 언제든 끄고\n켤 수 있어요",

    description:
      "린이의 제안을 받아볼지 지금 설정해도 되고, 나중에 바꿔도 돼요.",
  },
]

export function CoachCarousel({
  slide,

  setSlide,

  nudge,

  setNudge,

  finish,

  back,
}: {
  slide: number

  setSlide: (slide: number) => void

  nudge: boolean

  setNudge: (value: boolean) => void

  finish: () => void

  back: () => void
}) {
  const [touchStart, setTouchStart] = useState<number>()

  const item = coachSlides[slide]

  const endTouch = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === undefined) return

    const delta = event.changedTouches[0].clientX - touchStart

    if (delta < -45 && slide < 2) setSlide(slide + 1)

    if (delta > 45 && slide > 0) setSlide(slide - 1)

    setTouchStart(undefined)
  }

  return (
    <Screen step={7} onBack={back}>
      <div className="coach-heading">
        <span>
          <Sparkles size={25} strokeWidth={1.5} />
        </span>
        <p>{"Linky가 이렇게\n곁에 있을게요"}</p>
      </div>
      <div
        className="coach-card"
        onTouchEnd={endTouch}
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      >
        <span className="coach-icon">{item.icon}</span>
        <p className="coach-title">{item.title}</p>
        <p className="coach-description">{item.description}</p>
        {slide === 2 && (
          <div className="nudge-row">
            <div>
              <strong>AI 넛지 알림 받기</strong>
              <span>기본 OFF · 언제든 바꿀 수 있어요</span>
            </div>
            <Toggle on={nudge} onClick={() => setNudge(!nudge)} />
          </div>
        )}
      </div>
      <div className="carousel-dots">
        {[0, 1, 2].map((index) => (
          <Action
            className={cx("carousel-dot", slide === index && "current")}
            key={index}
            onClick={() => setSlide(index)}
          />
        ))}
      </div>
      {slide < 2 ? (
        <div className="coach-links">
          <Action className="next-link" onClick={() => setSlide(slide + 1)}>
            다음 →
          </Action>
          <Action className="start-link" onClick={finish}>
            바로 시작할래요
          </Action>
        </div>
      ) : (
        <div className="footer no-skip carousel-footer">
          <Action className="primary-button" onClick={finish}>
            Linky 시작하기 🎉
          </Action>
        </div>
      )}
    </Screen>
  )
}
