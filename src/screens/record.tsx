import { useState } from "react"
import { Camera, Check } from "lucide-react"
import { Action, cx } from "@/components/common"
import { type Payment, label } from "@/lib/ledger"

// 앨범에서 불러온 사진이 근거로 남을 때 보이는 문구 (사용자가 올린 것만, 추측 없음)
export const addedPhotoText = "추가한 사진"

// 앨범 목업: 최근 사진 6장을 간단한 그림으로 보여 준다. 샐러드·포케와 관련 없는 사진이 섞여 있어
// 사용자가 결제에 맞는 사진을 직접 고른다. (어떤 사진을 골랐는지는 UT 기록에 남는다)
type AlbumArt = "coffee" | "salad" | "laptop" | "poke" | "sky" | "saladFork"
const albumTiles: Array<{ art: AlbumArt; label: string; time: string }> = [
  { art: "coffee", label: "커피", time: "08:31" },
  { art: "salad", label: "샐러드", time: "12:44" },
  { art: "laptop", label: "노트북", time: "10:12" },
  { art: "poke", label: "포케", time: "12:46" },
  { art: "sky", label: "하늘", time: "18:57" },
  { art: "saladFork", label: "샐러드", time: "12:51" },
]

// 사진 대신 쓰는 단순한 그림 (색은 .album-art 안의 변수)
function AlbumArtwork({ art }: { art: AlbumArt }) {
  return (
    <svg className={`album-art ${art}`} viewBox="0 0 100 100" aria-hidden="true">
      <rect className="bg" width="100" height="100" />
      {art === "coffee" && (
        <>
          <rect className="cup" x="30" y="34" width="34" height="40" rx="6" />
          <path className="cup-line" d="M64 44h6a8 8 0 0 1 0 16h-6" />
          <ellipse className="coffee" cx="47" cy="36" rx="15" ry="4" />
          <path className="steam" d="M42 26c-3-4 3-6 0-10M52 26c-3-4 3-6 0-10" />
        </>
      )}
      {(art === "salad" || art === "saladFork") && (
        <>
          <circle className="bowl" cx="50" cy="54" r="32" />
          <circle className="leaf" cx="40" cy="46" r="12" />
          <circle className="leaf2" cx="58" cy="44" r="11" />
          <circle className="leaf" cx="56" cy="62" r="12" />
          <circle className="leaf2" cx="38" cy="62" r="9" />
          <circle className="tomato" cx="48" cy="54" r="6" />
          <circle className="tomato" cx="64" cy="54" r="5" />
          <circle className="egg" cx="34" cy="52" r="6" />
          <circle className="yolk" cx="34" cy="52" r="3" />
          {art === "saladFork" && <path className="fork" d="M78 12 L58 50 M74 10 L56 44 M82 14 L62 52" />}
        </>
      )}
      {art === "poke" && (
        <>
          <circle className="bowl" cx="50" cy="54" r="32" />
          <circle className="rice" cx="50" cy="54" r="26" />
          <rect className="salmon" x="34" y="38" width="10" height="10" rx="2" />
          <rect className="salmon" x="46" y="34" width="10" height="10" rx="2" />
          <rect className="salmon" x="40" y="48" width="10" height="10" rx="2" />
          <path className="avocado" d="M58 50c6-6 16-2 16 6s-10 12-16 6z" />
          <circle className="leaf2" cx="42" cy="66" r="7" />
          <circle className="corn" cx="58" cy="68" r="3" />
          <circle className="corn" cx="64" cy="66" r="3" />
        </>
      )}
      {art === "laptop" && (
        <>
          <rect className="desk" y="66" width="100" height="34" />
          <rect className="screen" x="24" y="28" width="52" height="34" rx="3" />
          <rect className="glow" x="28" y="32" width="44" height="26" rx="2" />
          <path className="base" d="M16 66h68l-6 6H22z" />
        </>
      )}
      {art === "sky" && (
        <>
          <circle className="sun" cx="70" cy="34" r="12" />
          <rect className="bldg" x="8" y="56" width="18" height="44" />
          <rect className="bldg2" x="28" y="44" width="16" height="56" />
          <rect className="bldg" x="46" y="62" width="20" height="38" />
          <rect className="bldg2" x="68" y="52" width="24" height="48" />
        </>
      )}
    </svg>
  )
}

// 근거가 없는 결제 카드에서 여는 작은 앨범 선택 창. 바텀시트가 아니라 가운데에 작게 뜬다.
export function AlbumPicker({
  payment,
  close,
  attach,
}: {
  payment: Payment
  close: () => void
  // picked: 고른 사진 이름 (UT 기록용)
  attach: (paymentId: string, text?: string, picked?: string) => void
}) {
  const [picked, setPicked] = useState<number>()

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
        <div className="album-grid">
          {albumTiles.map((tile, index) => (
            <Action
              className={cx("album-tile", picked === index && "picked")}
              key={index}
              label={`${tile.label} 사진 ${tile.time}`}
              onClick={() => setPicked(index)}
            >
              <AlbumArtwork art={tile.art} />
              <small className="album-time">{tile.time}</small>
              {picked === index ? (
                <Check size={16} strokeWidth={2.4} />
              ) : (
                <Camera size={14} strokeWidth={1.5} />
              )}
            </Action>
          ))}
        </div>
        <div className="album-actions">
          <Action className="secondary-button" onClick={close}>
            취소
          </Action>
          <Action
            className="primary-button"
            disabled={picked === undefined}
            onClick={() =>
              picked !== undefined &&
              attach(payment.id, addedPhotoText, `${albumTiles[picked].label} ${albumTiles[picked].time}`)
            }
          >
            불러오기
          </Action>
        </div>
      </div>
    </div>
  )
}
