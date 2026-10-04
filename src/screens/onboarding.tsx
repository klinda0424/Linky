import { useEffect, useState, type ReactNode } from "react"
import {
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Image,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react"
import {
  Action,
  Badge,
  Footer,
  PageTitle,
  Screen,
  Toggle,
  cx,
} from "@/components/common"
import { type LedgerState, restoreSummary, won } from "@/lib/ledger"
import { type PermissionKey, type Tone } from "@/types"

// ---------- 1. 개인 정보 ----------
export const jobOptions = ["대학생", "직장인", "취준생", "기타"]

export const birthYears = Array.from({ length: 75 }, (_, index) =>
  String(2010 - index),
)

export function BasicInfo({
  nickname,
  setNickname,
  birthYear,
  setBirthYear,
  job,
  setJob,
  next,
}: {
  nickname: string
  setNickname: (value: string) => void
  birthYear: string
  setBirthYear: (value: string) => void
  job: string
  setJob: (value: string) => void
  next: () => void
}) {
  return (
    <Screen step={1}>
      <PageTitle
        title={"Linky가 시작하려면\n세 가지만 알려주세요"}
        sub="리포트 문구를 맞추는 데만 써요"
      />
      <div className="form-list">
        <div className="field">
          <p className="field-label">닉네임</p>
          <div className="text-field">
            {/* 한 줄 입력칸: Enter로 줄이 바뀌지 않고 10자까지만 입력된다 (회원 정보와 같은 방식) */}
            <input
              aria-label="닉네임"
              enterKeyHint="done"
              maxLength={10}
              onChange={(event) => setNickname(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
              placeholder="예: 소연"
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
        caption="입력한 정보는 나중에 마이페이지에서 바꿀 수 있어요"
        disabled={!nickname || !job}
        onNext={next}
      />
    </Screen>
  )
}

// ---------- 2. 권한 연동 (캘린더·갤러리·위치 개별 토글) ----------
export const permissions: Array<{
  key: PermissionKey
  title: string
  parenthetical?: string
  description: string
  required?: boolean
  icon: ReactNode
  collects: string
  purpose: string
}> = [
  {
    key: "payment",
    title: "카드·계좌",
    parenthetical: "토스 등",
    description: "결제 내역 불러오기",
    required: true,
    icon: <CreditCard size={19} strokeWidth={1.5} />,
    collects: "결제 일시·금액·가맹점명",
    purpose: "잊은 결제를 날짜별로 모아 보여주기 위해",
  },
  {
    key: "calendar",
    title: "캘린더",
    description: "그날의 일정 연결",
    icon: <CalendarDays size={19} strokeWidth={1.5} />,
    collects: "일정 제목·시간·장소",
    purpose: "결제 시각과 겹치는 내 일정을 근거로 보여주기 위해",
  },
  {
    key: "photos",
    title: "갤러리",
    description: "결제 전후 사진 연결",
    icon: <Image size={19} strokeWidth={1.5} />,
    collects: "사진 촬영 시각·위치 정보",
    purpose: "결제 시각 전후 30분 사진을 근거로 보여주기 위해",
  },
  {
    key: "location",
    title: "위치",
    description: "결제 당시 내 위치 연결",
    icon: <MapPin size={19} strokeWidth={1.5} />,
    collects: "결제 시각의 내 위치 기록",
    purpose: "지도에서 그날의 동선을 보여주기 위해",
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
    <Screen step={2} onBack={back}>
      <PageTitle
        title={"기록을 가져올 곳을\n골라주세요"}
        sub="끈 곳의 기록은 근거로 쓰지 않아요"
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
        caption="마이페이지 > 개인정보·권한에서 언제든 해제할 수 있어요"
        onNext={next}
      />
    </Screen>
  )
}

// ---------- 3. 개인정보 고지 (수집 항목·목적·저장 위치) ----------
export function PrivacyNotice({
  values,
  next,
  back,
}: {
  values: Record<PermissionKey, boolean>
  next: () => void
  back: () => void
}) {
  const active = permissions.filter((item) => values[item.key])
  return (
    <Screen step={3} onBack={back}>
      <PageTitle
        title={"이렇게 수집하고\n보관해요"}
        sub="연동한 항목만 아래에 표시돼요"
      />
      <div className="privacy-list">
        {active.map((item) => (
          <div className="main-card privacy-card" key={item.key}>
            <div className="privacy-head">
              <span className="icon-box neutral">{item.icon}</span>
              <strong>{item.title}</strong>
            </div>
            <dl>
              <div>
                <dt>수집 항목</dt>
                <dd>{item.collects}</dd>
              </div>
              <div>
                <dt>목적</dt>
                <dd>{item.purpose}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <ShieldCheck size={15} strokeWidth={1.7} />
        <span>
          저장 위치: 내 기기 안에 암호화해 보관하고, 서버로 보내지 않아요
        </span>
      </div>
      <Footer button="동의하고 계속" onNext={next} />
    </Screen>
  )
}

// ---------- 4. 지출 내역 가져오기 ----------
export function ImportExpenses({
  next,
  back,
}: {
  next: () => void
  back: () => void
}) {
  // 가져오기 진행을 짧게 보여 준 뒤 다음 단계로 열어 준다 (목업)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])
  const summary = restoreSummary(2026, 9, {
    sources: { location: true, calendar: true, photos: true },
    unlinked: {},
    photoUnlinked: [],
    added: {},
    splitConfirmed: [],
  })
  return (
    <Screen step={4} onBack={back}>
      <div className="complete-content">
        <span className={cx("complete-check", !done && "loading")}>
          {done ? (
            <Check size={30} strokeWidth={2.2} />
          ) : (
            <CreditCard size={28} strokeWidth={1.5} />
          )}
        </span>
        <p className="complete-title">
          {done ? "지출 내역을 가져왔어요" : "지출 내역을 가져오는 중이에요"}
        </p>
        {done && (
          <div className="result-list">
            <div className="result-row">
              <p>9월 결제 {summary.count}건</p>
              <strong>{won(summary.total)}</strong>
            </div>
          </div>
        )}
      </div>
      <Footer button="지난달 복원하기" disabled={!done} onNext={next} />
    </Screen>
  )
}

// ---------- 5. 지난달 일괄 복원 결과 ----------
export function RestoreResult({
  state,
  next,
  back,
}: {
  state: LedgerState
  next: () => void
  back: () => void
}) {
  const summary = restoreSummary(2026, 9, state)
  const rows: Array<[string, string]> = [
    ["복원한 결제", `${summary.restored}건`],
    ["내 위치로 복원", `${summary.kinds.location}건`],
    ["내 일정으로 복원", `${summary.kinds.calendar}건`],
    ["내 사진으로 복원", `${summary.kinds.photo}건`],
    ["기록 없음", `${summary.none}건`],
  ]
  return (
    <Screen step={5} onBack={back}>
      <PageTitle
        title={`9월 결제 ${summary.count}건 중\n${summary.restored}건을 복원했어요`}
        sub="내 캘린더·사진·위치 기록에서만 찾았어요"
      />
      <div className="main-card restore-result">
        {rows.map(([name, value]) => (
          <div className="result-row" key={name}>
            <p>{name}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <Info size={15} strokeWidth={1.7} />
        <span>근거가 없는 결제는 추측하지 않고 “기록 없음”으로 둬요</span>
      </div>
      <Footer button="리포트 톤 고르기" onNext={next} />
    </Screen>
  )
}

// ---------- 6. 리포트 톤 선택 ----------
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
          <strong>서사형</strong>
          {tone === "narrative" && <Check size={15} strokeWidth={2.2} />}
        </div>
        <div className="tone-preview">
          “토요일, 성수. 지은이랑 약속, 사진 3장, 4.5만원.”
        </div>
        <p>하루의 사실을 한 문장으로 이어서 보여줘요</p>
      </Action>
      <Action
        className={cx("tone-card", tone === "numeric" && "selected")}
        onClick={() => setTone("numeric")}
      >
        <div className="tone-label">
          <strong>수치형</strong>
          {tone === "numeric" && <Check size={15} strokeWidth={2.2} />}
        </div>
        <div className="tone-preview numeric-preview">
          <strong>결제 3건 · 45,000원 · 복원 3건</strong>
        </div>
        <p>건수와 금액 중심으로 간결하게 보여줘요</p>
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
        title={"하루 리포트를 어떤 방식으로\n받아볼까요?"}
        sub="같은 기록을 다른 모양으로 보여줘요"
      />
      <ToneOptions setTone={setTone} tone={tone} />
      <Footer
        button="Linky 시작하기"
        caption="마이페이지 > 리포트 톤 설정에서 언제든 바꿀 수 있어요"
        disabled={!tone}
        onNext={next}
      />
    </Screen>
  )
}
