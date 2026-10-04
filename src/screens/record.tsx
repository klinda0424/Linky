import { useState, type ReactNode } from "react"
import { Camera, Check, CreditCard, Image, Link2, MessageSquare } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type LedgerState,
  type Payment,
  isRestored,
  label,
  payments,
  won,
} from "@/lib/ledger"

// 기록 입력은 탭이 아니라 시트: 결제 캡처 / 사진 / 웹 링크 / 단톡 캡처
export type RecordKind = "paymentCapture" | "photo" | "link" | "chatCapture"

export const recordTiles: Array<{
  key: RecordKind
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    key: "paymentCapture",
    label: "결제 캡처",
    description: "카드 앱·영수증 화면",
    icon: <CreditCard size={22} strokeWidth={1.5} />,
  },
  {
    key: "photo",
    label: "사진",
    description: "그날 찍은 사진",
    icon: <Image size={22} strokeWidth={1.5} />,
  },
  {
    key: "link",
    label: "웹 링크",
    description: "예약·일정 페이지",
    icon: <Link2 size={22} strokeWidth={1.5} />,
  },
  {
    key: "chatCapture",
    label: "단톡 캡처",
    description: "약속 대화 화면",
    icon: <MessageSquare size={22} strokeWidth={1.5} />,
  },
]

// 추가한 기록이 근거로 남을 때 보이는 문구 (사용자가 올린 것만, 추측 없음)
export const addedText: Record<RecordKind, string> = {
  paymentCapture: "결제 캡처",
  photo: "추가한 사진",
  link: "추가한 웹 링크",
  chatCapture: "추가한 단톡 캡처",
}

export function RecordSheet({
  close,
  pick,
}: {
  close: () => void
  pick: (kind: RecordKind) => void
}) {
  return (
    <div className="main-overlay" onClick={close}>
      <div
        className="record-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-grip" />
        <p className="sheet-title">무엇을 남길까요?</p>
        <p className="sheet-sub">
          올린 기록은 날짜·시각이 맞는 결제에 연결해요
        </p>
        <div className="record-tiles">
          {recordTiles.map((item) => (
            <Action
              className="record-tile"
              key={item.key}
              onClick={() => pick(item.key)}
            >
              <span className="record-icon">{item.icon}</span>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Action>
          ))}
        </div>
      </div>
    </div>
  )
}

// 기록을 어느 결제에 붙일지 고르는 화면. paymentId가 있으면(빈 카드에서 진입) 바로 그 결제에 붙인다.
export function RecordAttach({
  kind,
  paymentId,
  state,
  back,
  attach,
}: {
  kind: RecordKind
  paymentId?: string
  state: LedgerState
  back: () => void
  attach: (paymentId: string) => void
}) {
  const tile = recordTiles.find((item) => item.key === kind) ?? recordTiles[0]
  const [uploaded, setUploaded] = useState(false)
  const [target, setTarget] = useState<string | undefined>(paymentId)
  // 근거가 없는 결제를 먼저 보여 준다
  const candidates = [...payments]
    .filter((payment: Payment) => !isRestored(payment, state))
    .slice(-8)
    .reverse()
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title={tile.label} />
      <div className="record-attach">
        <Action
          className={cx("capture-zone", uploaded && "recognizing")}
          onClick={() => setUploaded(true)}
        >
          <span className="capture-icon">
            {uploaded ? (
              <Check size={24} strokeWidth={2} />
            ) : (
              <Camera size={24} strokeWidth={1.5} />
            )}
          </span>
          <strong>{uploaded ? `${tile.label} 1건을 올렸어요` : `${tile.label}을 올려주세요`}</strong>
          <span>{uploaded ? "아래에서 연결할 결제를 골라 주세요" : "탭해서 선택 (목업)"}</span>
        </Action>
        {!paymentId && (
          <>
            <p className="section-title">근거가 없는 결제</p>
            <div className="main-card arc-rows">
              {candidates.length === 0 && <p>모든 결제에 근거가 있어요</p>}
              {candidates.map((payment) => (
                <Action
                  className={cx("report-pay", target === payment.id && "chosen")}
                  key={payment.id}
                  onClick={() => setTarget(payment.id)}
                >
                  <div>
                    <strong>{payment.merchant}</strong>
                    <span>
                      {label(payment.date)} {payment.time}
                    </span>
                  </div>
                  <p>{won(payment.amount)}</p>
                </Action>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          disabled={!uploaded || !target}
          onClick={() => target && attach(target)}
        >
          결제에 연결하기
        </Action>
      </div>
    </div>
  )
}
