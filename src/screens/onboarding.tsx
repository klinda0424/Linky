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
import {
  type LedgerState,
  TODAY,
  dayFacts,
  initialLedger,
  narrativeLine,
  payments,
  restoreSummary,
  won,
  ymd,
} from "@/lib/ledger"
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
  // 실제로 쓰는 범위 (개인정보 고지·마이페이지에 그대로 표시)
  scope?: string
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
    scope: "결제 시각 ±30분 · 반경 500m 사진만 사용, 기기에 저장",
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

// ---------- 3. 개인정보 고지 (수집 항목·목적·사용 범위·저장 위치) ----------
// 선택 항목은 여기서 동의하지 않을 수 있다. 동의하지 않은 소스는 권한을 끈 것과 같아 근거에서 빠진다.
export function PrivacyNotice({
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
  // 이 화면에 들어올 때 연동한 항목만 보여 준다 (여기서 거절해도 카드는 남아 다시 동의할 수 있다)
  const [shown] = useState(() => permissions.filter((item) => values[item.key]))
  return (
    <Screen step={3} onBack={back}>
      <div className="onboarding-scroll">
        <PageTitle
          title={"이렇게 수집하고\n보관해요"}
          sub="동의하지 않은 항목은 근거로 쓰지 않아요"
        />
        <div className="privacy-list">
          {shown.map((item) => (
            <div className="main-card privacy-card" key={item.key}>
              <div className="privacy-head">
                <span className="icon-box neutral">{item.icon}</span>
                <strong>{item.title}</strong>
                {item.required && <Badge>필수</Badge>}
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
                {item.scope && (
                  <div>
                    <dt>사용 범위</dt>
                    <dd className="privacy-scope">{item.scope}</dd>
                  </div>
                )}
              </dl>
              {!item.required && (
                <div className="privacy-decision">
                  {values[item.key] ? (
                    <Action className="privacy-reject" onClick={() => toggle(item.key)}>
                      동의 안 함
                    </Action>
                  ) : (
                    <>
                      <p className="privacy-off">동의하지 않아 이 기록은 근거에서 빠져요</p>
                      <Action className="privacy-reject" onClick={() => toggle(item.key)}>
                        다시 동의
                      </Action>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="info-banner">
          <ShieldCheck size={15} strokeWidth={1.7} />
          <span>
            저장 위치: 내 기기 안에 암호화해 보관하고, 서버로 보내지 않아요
          </span>
        </div>
      </div>
      <Footer button="동의하고 계속" onNext={next} />
    </Screen>
  )
}

// ---------- 4. 지출 내역 가져오기: 금융앱식 약관 동의 → 불러오기 → 결과 ----------
type ImportTerm = {
  key: string
  required: boolean
  title: string
  // 펼쳐서 보는 요약 (수집 항목·목적·보관)
  detail: Array<[string, string]>
}

const importTerms: ImportTerm[] = [
  {
    key: "service",
    required: true,
    title: "결제내역 불러오기 서비스 이용약관",
    detail: [
      ["내용", "연결한 카드·계좌의 결제내역을 Linky로 불러와 날짜별로 보여줘요"],
      ["해지", "마이페이지 > 연동 서비스 관리에서 언제든 끊을 수 있어요"],
    ],
  },
  {
    key: "collect",
    required: true,
    title: "개인(신용)정보 수집·이용 동의",
    detail: [
      ["수집 항목", "결제 일시·금액·가맹점명"],
      ["목적", "잊은 결제를 날짜별로 모아 보여주기 위해"],
      ["보관", "내 기기 안에 암호화해 저장, 연동 해제 시 삭제"],
    ],
  },
  {
    key: "inquiry",
    required: true,
    title: "개인(신용)정보 조회 동의",
    detail: [
      ["조회 대상", "연결한 카드사·은행의 결제내역"],
      ["조회 기간", "최근 1개월"],
    ],
  },
  {
    key: "auto",
    required: false,
    title: "새 결제 자동 불러오기",
    detail: [["내용", "앱을 열 때 새로 생긴 결제를 자동으로 불러와요. 끄면 직접 새로고침해요"]],
  },
]

function CheckMark({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <span className={cx("term-check", on && "on")} style={{ width: size, height: size }}>
      <Check size={size * 0.62} strokeWidth={2.6} />
    </span>
  )
}

export function ImportExpenses({
  next,
  back,
}: {
  next: () => void
  back: () => void
}) {
  // 불러오는 범위 = 목업 기준일의 달
  const { y, m } = TODAY
  const month = payments.filter((payment) => payment.date.y === y && payment.date.m === m)
  const total = month.reduce((sum, payment) => sum + payment.amount, 0)
  const lastDay = new Date(y, m, 0).getDate()
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})
  const [opened, setOpened] = useState<string>()
  const [phase, setPhase] = useState<"agree" | "loading" | "done">("agree")
  const allAgreed = importTerms.every((term) => agreed[term.key])
  const requiredAgreed = importTerms.every((term) => !term.required || agreed[term.key])
  useEffect(() => {
    if (phase !== "loading") return
    const timer = window.setTimeout(() => setPhase("done"), 1400)
    return () => window.clearTimeout(timer)
  }, [phase])

  if (phase !== "agree")
    return (
      <Screen step={4} onBack={back}>
        <div className="complete-content">
          <span className={cx("complete-check", phase === "loading" && "loading")}>
            {phase === "done" ? (
              <Check size={30} strokeWidth={2.2} />
            ) : (
              <CreditCard size={28} strokeWidth={1.5} />
            )}
          </span>
          <p className="complete-title">
            {phase === "done"
              ? `${m}월 결제내역을 불러왔어요`
              : `${m}월 결제내역을 불러오는 중이에요`}
          </p>
          {phase === "done" && (
            <div className="result-list">
              <div className="result-row">
                <p>기간</p>
                <strong>
                  {m}월 1일 ~ {m}월 {lastDay}일
                </strong>
              </div>
              <div className="result-row">
                <p>결제</p>
                <strong>{month.length}건</strong>
              </div>
              <div className="result-row">
                <p>합계</p>
                <strong>{won(total)}</strong>
              </div>
              <div className="result-row">
                <p>새 결제 자동 불러오기</p>
                <strong>{agreed.auto ? "켬" : "끔"}</strong>
              </div>
            </div>
          )}
        </div>
        <Footer
          button={`${m}월 복원하기`}
          disabled={phase !== "done"}
          onNext={next}
        />
      </Screen>
    )

  return (
    <Screen step={4} onBack={back}>
      <div className="onboarding-scroll">
        <PageTitle
          title={"카드·계좌 결제내역을\n불러올게요"}
          sub="아래 약관에 동의하면 바로 불러와요"
        />
        <Action
          className="term-all"
          onClick={() =>
            setAgreed(
              Object.fromEntries(importTerms.map((term) => [term.key, !allAgreed])),
            )
          }
        >
          <CheckMark on={allAgreed} size={26} />
          <strong>약관 전체 동의</strong>
        </Action>
        <div className="term-list">
          {importTerms.map((term) => (
            <div className="term-item" key={term.key}>
              <div className="term-row">
                <Action
                  className="term-toggle"
                  onClick={() =>
                    setAgreed((current) => ({ ...current, [term.key]: !current[term.key] }))
                  }
                >
                  <CheckMark on={Boolean(agreed[term.key])} />
                  <span>
                    <em className={cx(term.required && "required")}>
                      ({term.required ? "필수" : "선택"})
                    </em>{" "}
                    {term.title}
                  </span>
                </Action>
                <Action
                  className={cx("term-more", opened === term.key && "open")}
                  label={`${term.title} 자세히 보기`}
                  onClick={() => setOpened(opened === term.key ? undefined : term.key)}
                >
                  <ChevronDown size={17} strokeWidth={1.6} />
                </Action>
              </div>
              {opened === term.key && (
                <dl className="term-detail">
                  {term.detail.map(([name, value]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer
        button={requiredAgreed ? "동의하고 불러오기" : "필수 약관에 동의해 주세요"}
        caption="선택 항목은 동의하지 않아도 불러올 수 있어요"
        disabled={!requiredAgreed}
        onNext={() => setPhase("loading")}
      />
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
// 미리보기는 10월 시연일(10/12)의 실제 하루 리포트 문구를 그대로 보여 준다
const PREVIEW_DAY = ymd(2026, 10, 12)

export function ToneOptions({
  tone,
  setTone,
}: {
  tone?: Tone
  setTone: (tone: Tone) => void
}) {
  const facts = dayFacts(PREVIEW_DAY, initialLedger)
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
          “{narrativeLine(PREVIEW_DAY, initialLedger)}.”
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
          <strong>
            결제 {facts.count}건 · {won(facts.total)} · 복원 {facts.restored}건
          </strong>
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
