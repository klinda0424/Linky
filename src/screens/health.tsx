import { useEffect, useRef, useState } from "react"
import { Receipt, ShieldCheck, Stethoscope } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"

const healthGuess = "수액"
const healthOptions: Array<[label: string, particle: string]> = [
  [healthGuess, "으로"],
  ["진료·처방", "으로"],
  ["검사", "로"],
  ["예방접종", "으로"],
]

// home.tsx에서도 props 없이 사용한다. props를 추가하면 선택값으로만.
export function HealthCard() {
  const [editing, setEditing] = useState(false)
  const [record, setRecord] = useState(healthGuess)
  const [draft, setDraft] = useState(healthGuess)
  const particle =
    healthOptions.find(([label]) => label === record)?.[1] ?? "으로"
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
            <div className="health-edit-actions">
              <Action
                className="mini-secondary"
                onClick={() => setEditing(false)}
              >
                취소
              </Action>
              <Action
                className="mini-primary"
                onClick={() => {
                  setRecord(draft)
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
export function HealthArchive({ back }: { back: () => void }) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="건강 보관함" />
      <div className="health-archive-content">
        <p className="section-title">최근 건강 기록</p>
        <HealthCard />
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
