import { useEffect, useState } from "react"
import { ArrowLeft, ArrowUpRight, CalendarDays, ImageIcon, MapPin, Navigation, Pencil, Plus, X } from "lucide-react"
import { Action, cx } from "@/components/common"
import { AlbumArtwork, artOf } from "@/screens/record"
import {
  categoryOf,
  events,
  eventsFor,
  evidenceOf,
  label,
  photos,
  restoredOf,
  sameDay,
  shareOf,
  stays,
  titleOf,
  weekday,
  won,
  type LedgerState,
  type Payment,
} from "@/lib/ledger"

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// ---------- 지출 내역 상세 (홈 오늘 지출·캘린더 결제 카드에서 진입) ----------
// 한 화면: 일시·분류 → 지출명(연필을 누르면 그 자리에서 입력) → 금액 → 원래 이름
// → 이날의 기록(사진 크게 · 결제 당시 내 위치 지도 · 일정 한 줄). 기록은 각자 X로 빼고,
// 실수로 뺐을 때만 잠깐 뜨는 [되돌리기] 알림으로 되돌린다 (뺀 기록 목록은 두지 않는다)
// 따로 켜는 편집 모드는 없다
export function PaymentDetail({
  payment,
  state,
  back,
  confirmRestore,
  unlink,
  relink,
  unlinkPhoto,
  relinkPhoto,
  openRecord,
  rename,
  revertTransfer,
}: {
  payment: Payment
  state: LedgerState
  back: () => void
  confirmRestore: (paymentId: string) => void
  unlink: (paymentId: string, key: string) => void
  relink: (paymentId: string, key: string) => void
  unlinkPhoto: (photoId: string) => void
  relinkPhoto: (photoId: string) => void
  openRecord: (paymentId: string) => void
  // 지출명 직접 바꾸기 (빈 칸이면 원래 이름으로)
  rename: (paymentId: string, name: string) => void
  // 송금 수정 → 원래 이름으로 되돌리기 (맞아요 취소)
  revertTransfer?: (paymentId: string) => void
}) {
  // 지출명 연필 → 그 자리에서 입력 칸
  const [renaming, setRenaming] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  // X로 뺀 직후 4초 동안만 보이는 되돌리기 알림
  const [undo, setUndo] = useState<{ key: number; text: string; run: () => void }>()
  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(() => setUndo(undefined), 4000)
    return () => window.clearTimeout(timer)
  }, [undo])
  const removeRecord = (text: string, remove: () => void, restore: () => void) => {
    remove()
    setUndo({ key: Date.now(), text, run: restore })
  }
  const title = titleOf(payment, state)
  const [draft, setDraft] = useState(title)
  const restored = restoredOf(payment, state)
  const evidence = evidenceOf(payment, state)
  const mine = shareOf(payment, state)
  const confirmed = Boolean(restored?.confirmed)
  const transfer = payment.kind === "transfer"
  const category = categoryOf(payment, state) ?? (transfer ? "계좌 이체" : undefined)
  // 그룹 결제: 인원과 내 몫 (분할을 확정하기 전에는 "정산하면 내 몫")
  const people = payment.group?.length ?? 0
  const splitDone = state.splitConfirmed.includes(payment.id)
  const perPerson = people > 1 ? Math.round(payment.amount / people) : 0
  const originalName = transfer ? `${payment.counterparty}에게 송금` : payment.merchant
  // 금액 아래 한 줄: 이름이 바뀌었으면 원래 이름, 그룹 결제면 인원과 몫
  const subLine = [
    title !== payment.merchant && title !== `${payment.counterparty} 송금` ? originalName : undefined,
    people > 1
      ? splitDone
        ? `${people}명 · 결제 ${won(payment.amount)} 중 내 몫`
        : `${people}명 · 정산하면 내 몫 ${won(perPerson)}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ")

  // 결제 장소: 복원된 지점이 있으면 그 지점, 없으면 결제 당시 내 위치
  const spot = restored
    ? restored.kind === "transfer"
      ? // 송금은 이름이 맥락 문구라 장소로 쓰지 않는다: 그날 내 위치(체류지)만 보여 준다
        state.sources.location
        ? (payment.place ?? payment.zone)
        : undefined
      : payment.transit
        ? `${payment.transit.from} 인근`
        : restored.spot
          ? `${restored.spot} 인근`
          : restored.label
    : state.sources.location
      ? payment.place
      : undefined

  // 직전 체류지 (이동 중 결제의 근거)
  const lastStay = payment.transit
    ? stays
        .filter(
          (stay) =>
            sameDay(stay.date, payment.date) && minutes(stay.to) <= minutes(payment.time),
        )
        .sort((a, b) => minutes(b.to) - minutes(a.to))[0]
    : undefined

  // 이날의 기록: 사진(첫 장은 크게) · 위치 · 일정
  const photoItem = evidence.find((item) => item.kind === "photo")
  const photo = photoItem?.photoIds?.map((id) => photos.find((p) => p.id === id))[0]
  // 앨범에서 직접 불러온 사진: 위 사진 근거와 따로 이 결제에 붙인 기록
  const addedPhotos = evidence.filter((item) => item.kind === "added")
  const mainPhoto = photo
    ? {
        title: photo.title,
        sub: photo.content,
        time: photo.time,
        art: artOf(`${photo.title} ${photo.content ?? ""}`),
        remove: () =>
          removeRecord("사진을 뺐어요", () => unlinkPhoto(photo.id), () => relinkPhoto(photo.id)),
      }
    : addedPhotos[0]
      ? {
          title: addedPhotos[0].text,
          sub: undefined,
          time: undefined,
          art: artOf(addedPhotos[0].text),
          remove: () =>
            removeRecord(
              "사진을 뺐어요",
              () => unlink(payment.id, addedPhotos[0].key),
              () => relink(payment.id, addedPhotos[0].key),
            ),
        }
      : undefined
  const morePhotos = photo ? addedPhotos : addedPhotos.slice(1)
  // 일정: 근거로 붙은 그 일정 (송금은 시각이 떨어진 같은 날 일정이 근거일 수 있다)
  const eventKey = evidence.find((item) => item.kind === "calendar")?.key
  const event = eventKey
    ? (events.find((item) => `cal:${item.id}` === eventKey) ?? eventsFor(payment, state)[0])
    : undefined
  const hasRecord = Boolean(
    mainPhoto || event || (spot && !(state.unlinked[payment.id] ?? []).includes("loc")),
  )

  const startRename = () => {
    setDraft(title)
    setRenaming(true)
  }
  const locationKey = evidence.find((item) => item.kind === "location")?.key
  // 위치를 뺐으면 지도 카드도 숨긴다
  const locationRemoved = (state.unlinked[payment.id] ?? []).includes("loc")

  return (
    <div className="main-page sub-page">
      <div className="main-subheader pd-head">
        <Action className="main-back" onClick={back} label="뒤로 가기">
          <ArrowLeft size={20} strokeWidth={1.6} />
        </Action>
        <p>지출 내역</p>
        <span />
      </div>
      <div className="pd-scroll">
        <section className="pd-top">
          <div className="pd-meta">
            <span>
              {label(payment.date)} ({weekday(payment.date)}) · {payment.time}
            </span>
            {category && <em className="pd-cat">{category}</em>}
          </div>
          {renaming ? (
            <form
              className="pd-rename"
              onSubmit={(event) => {
                event.preventDefault()
                rename(payment.id, draft)
                setRenaming(false)
              }}
            >
              <input
                aria-label="지출명"
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                placeholder={originalName}
                value={draft}
              />
              <div className="pd-rename-actions">
                {restored?.kind === "transfer" && revertTransfer ? (
                  <Action
                    className="pd-rename-reset"
                    onClick={() => {
                      revertTransfer(payment.id)
                      rename(payment.id, "")
                      setRenaming(false)
                    }}
                  >
                    원래 이름으로
                  </Action>
                ) : (
                  <span />
                )}
                <Action className="pill" onClick={() => setRenaming(false)}>
                  취소
                </Action>
                <button className="pill primary" type="submit">
                  저장
                </button>
              </div>
            </form>
          ) : (
            <Action className="pd-name" label={`지출명 수정: ${title}`} onClick={startRename}>
              <span>{title}</span>
              <Pencil size={15} strokeWidth={1.8} />
              {people > 1 && !splitDone && <em className="pd-chip">정산 대기</em>}
            </Action>
          )}

          <p className="pd-amount">
            <b>{mine.toLocaleString("ko-KR")}</b>원
          </p>
          {subLine && <p className="pd-sub">{subLine}</p>}
          {restored && !confirmed && (
            <div className="pd-ask">
              <span>내 기록을 보고 바꾼 이름이에요</span>
              <Action className="pill primary" onClick={() => confirmRestore(payment.id)}>
                맞아요
              </Action>
            </div>
          )}
        </section>

        <div className="pd-title-row">
          <h2 className="pd-title">이날의 기록</h2>
          <Action className="pd-add-link" onClick={() => openRecord(payment.id)}>
            사진 추가 <Plus size={14} strokeWidth={2} />
          </Action>
        </div>

        {!hasRecord && <p className="pd-empty">기록 없음</p>}

        {mainPhoto && (
          <div className={cx("pd-photo", !mainPhoto.art && "photo-thumb t0", photoOpen && "open")}>
            <Action
              className="pd-photo-view"
              label={photoOpen ? "사진 작게 보기" : "사진 크게 보기"}
              onClick={() => setPhotoOpen(!photoOpen)}
            >
              {mainPhoto.art ? (
                <AlbumArtwork art={mainPhoto.art} wide />
              ) : (
                <span className="pd-photo-text">
                  <ImageIcon size={20} strokeWidth={1.6} />
                </span>
              )}
              <span className="pd-photo-cap">
                {mainPhoto.time && <time>{mainPhoto.time}</time>}
                {mainPhoto.title}
              </span>
            </Action>
            <Action className="pd-remove on-photo" label="이 사진 빼기" onClick={mainPhoto.remove}>
              <X size={14} strokeWidth={2} />
            </Action>
          </div>
        )}
        {morePhotos.map((item) => (
          <div className="pd-line" key={item.key}>
            <ImageIcon size={16} strokeWidth={1.7} />
            <span>{item.text}</span>
            <Action className="pd-remove" label="이 사진 빼기" onClick={() =>
                removeRecord(
                  "사진을 뺐어요",
                  () => unlink(payment.id, item.key),
                  () => relink(payment.id, item.key),
                )
              }
            >
              <X size={14} strokeWidth={2} />
            </Action>
          </div>
        ))}

        {spot && !locationRemoved && (
          <section className={cx("pd-mapcard", mapOpen && "open")}>
            <div className="pd-map2" aria-hidden="true">
              <i className="r1" />
              <i className="r2" />
              <i className="r3" />
              <span className="pd-pin2">
                <MapPin size={18} strokeWidth={2} />
              </span>
            </div>
            <div className="pd-mapcard-text">
              <div className="pd-mapcard-label">
                <strong>{spot}</strong>
                <small>결제 당시 내 위치</small>
              </div>
              <Action className="pd-map-more" onClick={() => setMapOpen(!mapOpen)}>
                {mapOpen ? "접기" : "지도 확대"} <ArrowUpRight size={14} strokeWidth={1.8} />
              </Action>
              {locationKey && (
                <Action className="pd-remove" label="이 위치 빼기" onClick={() =>
                    removeRecord(
                      "위치를 뺐어요",
                      () => unlink(payment.id, locationKey),
                      () => relink(payment.id, locationKey),
                    )
                  }
                >
                  <X size={14} strokeWidth={2} />
                </Action>
              )}
            </div>
            {mapOpen && (
              <p className="pd-map-note">
                결제할 때 기록된 내 위치예요. 실제로 결제한 가게 위치와 다를 수 있어요.
              </p>
            )}
          </section>
        )}

        {lastStay && (
          <div className="pd-line">
            <Navigation size={16} strokeWidth={1.7} />
            <span>이동 전 머문 곳 · {lastStay.name}</span>
            <time>
              {lastStay.from}~{lastStay.to}
            </time>
          </div>
        )}
        {event && (
          <div className="pd-line">
            <CalendarDays size={16} strokeWidth={1.7} />
            <span>{event.title}</span>
            <time>{event.start}</time>
            {eventKey && (
              <Action className="pd-remove" label="이 일정 빼기" onClick={() =>
                  removeRecord(
                    "일정을 뺐어요",
                    () => unlink(payment.id, eventKey),
                    () => relink(payment.id, eventKey),
                  )
                }
              >
                <X size={14} strokeWidth={2} />
              </Action>
            )}
          </div>
        )}

      </div>
      {undo && (
        <div className="pd-undo" key={undo.key} role="status" aria-live="polite">
          <span>{undo.text}</span>
          <Action
            className="pd-undo-btn"
            onClick={() => {
              undo.run()
              setUndo(undefined)
            }}
          >
            되돌리기
          </Action>
        </div>
      )}
    </div>
  )
}
