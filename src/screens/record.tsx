import { useState } from "react"
import { Camera, Check } from "lucide-react"
import { Action, cx } from "@/components/common"
import { type Payment, label, recognizedPurchase } from "@/lib/ledger"

// 앨범에서 불러온 사진이 근거로 남을 때 보이는 문구 (사용자가 올린 것만, 추측 없음)
export const addedPhotoText = "추가한 사진"

// 앨범 목업: 실제 사진 대신 자리 표시 칸 6개
const albumTiles = [0, 1, 2, 3, 4, 5]

// 근거가 없는 결제 카드에서 여는 작은 앨범 선택 창. 바텀시트가 아니라 가운데에 작게 뜬다.
export function AlbumPicker({
  payment,
  close,
  attach,
}: {
  payment: Payment
  close: () => void
  // text가 있으면 캡처에서 읽은(또는 사용자가 고친) 문구를 근거로 붙인다
  attach: (paymentId: string, text?: string) => void
}) {
  const [picked, setPicked] = useState<number>()
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState("")
  // 결제 캡처로 읽히는 구매 품목(목업 인식). 있으면 사용자가 맞는지 확인한다.
  const recognized = recognizedPurchase(payment)

  return (
    <div className="main-overlay center" onClick={close}>
      <div
        aria-label="앨범에서 불러오기"
        className="album-picker"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="sheet-title">앨범에서 불러오기</p>
        <p className="sheet-sub">
          {payment.merchant} · {label(payment.date)} {payment.time}
        </p>
        {confirming && recognized ? (
          <div className="main-card recognize-card">
            <small>캡처에서 읽은 내용</small>
            {editing ? (
              <input
                aria-label="구매 품목"
                autoFocus
                onChange={(event) => setText(event.currentTarget.value)}
                placeholder="구매 품목을 적어 주세요"
                value={text}
              />
            ) : (
              <strong>{recognized}, 맞나요?</strong>
            )}
          </div>
        ) : (
          <div className="album-grid">
            {albumTiles.map((index) => (
              <Action
                className={cx("album-tile", picked === index && "picked")}
                key={index}
                label={`사진 ${index + 1}`}
                onClick={() => setPicked(index)}
              >
                <i className={`photo-thumb t${index % 5}`} />
                {picked === index ? (
                  <Check size={16} strokeWidth={2.4} />
                ) : (
                  <Camera size={14} strokeWidth={1.5} />
                )}
              </Action>
            ))}
          </div>
        )}
        <div className="album-actions">
          {confirming && recognized ? (
            <>
              <Action
                className="secondary-button"
                onClick={() => {
                  setEditing(!editing)
                  setText(recognized)
                }}
              >
                {editing ? "취소" : "수정"}
              </Action>
              <Action
                className="primary-button"
                disabled={editing && !text.trim()}
                onClick={() => attach(payment.id, editing ? text.trim() : recognized)}
              >
                {editing ? "확인" : "맞아요"}
              </Action>
            </>
          ) : (
            <>
              <Action className="secondary-button" onClick={close}>
                취소
              </Action>
              <Action
                className="primary-button"
                disabled={picked === undefined}
                onClick={() =>
                  recognized ? setConfirming(true) : attach(payment.id, addedPhotoText)
                }
              >
                불러오기
              </Action>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
