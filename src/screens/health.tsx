import { useState } from "react"
import { ShieldCheck, Stethoscope } from "lucide-react"
import { Action } from "@/components/common"
import { MainHeader } from "@/components/layout"

export function HealthCard() {
  const [editing, setEditing] = useState(false)
  return (
    <div className="health-card">
      <span className="health-card-icon">
        <Stethoscope size={20} strokeWidth={1.5} />
      </span>
      <div>
        <span>OO내과 45,000원</span>
        {editing ? (
          <div
            className="health-editable"
            contentEditable
            role="textbox"
            suppressContentEditableWarning
          >
            수액 추정
          </div>
        ) : (
          <strong>→ 수액을 맞은 것으로 추정돼요</strong>
        )}
        <p>가맹점·금액 기준</p>
      </div>
      <Action className="health-edit" onClick={() => setEditing(true)}>
        수정
      </Action>
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
  const sections = [
    ["수집 항목", "결제 가맹점명, 결제 금액, 결제 시각"],
    ["목적", "진료 과목 추정과 건강 카드 생성"],
    ["저장 위치", "기기 내 암호화 저장, 서버 전송 없음"],
  ]
  return (
    <div className="main-overlay">
      <div className="health-consent-sheet">
        <div className="sheet-grip" />
        <span className="consent-icon">
          <Stethoscope size={24} strokeWidth={1.5} />
        </span>
        <p className="sheet-title">내과 결제가 감지됐어요</p>
        <p className="sheet-sub">건강 기록으로 연결하려면 동의가 필요해요</p>
        <div className="consent-sections">
          {sections.map(([title, copy]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </div>
          ))}
        </div>
        <div className="consent-actions">
          <Action className="secondary-button" onClick={decline}>
            거절하고 지출로만 기록
          </Action>
          <Action className="primary-button" onClick={agree}>
            동의
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
