import { Camera, ChevronRight, Route } from "lucide-react"
import { Action } from "@/components/common"
import { label, sameDay, TODAY, type YMD } from "@/lib/ledger"

export function HomeMediaActions({
  day,
  openAlbum,
  openMap,
}: {
  day: YMD
  openAlbum: (day: YMD) => void
  openMap: (day: YMD) => void
}) {
  const prefix = sameDay(day, TODAY) ? "오늘의" : label(day)

  return (
    <section aria-label={`${prefix} 기록 바로가기`} className="hm-media-actions">
      <Action className="hm-media-action" onClick={() => openMap(day)}>
        <span className="hm-media-icon">
          <Route size={20} strokeWidth={1.8} />
        </span>
        <span className="hm-media-copy">
          <strong>{prefix} 동선</strong>
          <small>지도 보기</small>
        </span>
        <ChevronRight size={16} strokeWidth={1.7} />
      </Action>
      <Action className="hm-media-action" onClick={() => openAlbum(day)}>
        <span className="hm-media-icon">
          <Camera size={20} strokeWidth={1.8} />
        </span>
        <span className="hm-media-copy">
          <strong>{prefix} 사진</strong>
          <small>앨범 보기</small>
        </span>
        <ChevronRight size={16} strokeWidth={1.7} />
      </Action>
    </section>
  )
}
