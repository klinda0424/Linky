import { useState } from "react"
import { ArrowLeft, ArrowUpRight, CalendarDays, ImageIcon, MapPin, Navigation, Plus } from "lucide-react"
import { Action, cx } from "@/components/common"
import {
  categoryOf,
  eventsFor,
  evidenceOf,
  label,
  photos,
  removedEvidenceOf,
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
// 한 화면: 일시·분류 → 지출명(수정하면 바로 아래에 입력 칸) → 금액 → 원래 이름
// → 이날의 기록(사진 크게 · 결제 당시 내 위치 지도 · 일정 한 줄)
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
  // 상단 [수정]: 지출명 입력 칸과 근거 해제·되돌리기가 지출명 바로 아래에 열린다
  const [editing, setEditing] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const title = titleOf(payment, state)
  const [draft, setDraft] = useState(title)
  const removed = removedEvidenceOf(payment, state)
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
    ? { title: photo.title, sub: photo.content, time: photo.time }
    : addedPhotos[0]
      ? { title: addedPhotos[0].text, sub: undefined, time: undefined }
      : undefined
  const morePhotos = photo ? addedPhotos : addedPhotos.slice(1)
  const event = evidence.some((item) => item.kind === "calendar")
    ? eventsFor(payment, state)[0]
    : undefined
  const hasRecord = Boolean(mainPhoto || event || spot)

  const toggleEdit = () => {
    if (!editing) setDraft(title)
    setEditing(!editing)
  }

  return (
    <div className="main-page sub-page">
      <div className="main-subheader pd-head">
        <Action className="main-back" onClick={back} label="뒤로 가기">
          <ArrowLeft size={20} strokeWidth={1.6} />
        </Action>
        <p>지출 내역</p>
        <Action className="pd-head-edit" onClick={toggleEdit}>
          {editing ? "완료" : "수정"}
        </Action>
      </div>
      <div className="pd-scroll">
        <section className="pd-top">
          <div className="pd-meta">
            <span>
              {label(payment.date)} ({weekday(payment.date)}) · {payment.time}
            </span>
            {category && <em className="pd-cat">{category}</em>}
          </div>
          <p className="pd-name">
            {title}
            {people > 1 && !splitDone && <em className="pd-chip">정산 대기</em>}
          </p>

          {editing && (
            <div className="pd-edit-box">
              <form
                className="pd-rename"
                onSubmit={(event) => {
                  event.preventDefault()
                  rename(payment.id, draft)
                  setEditing(false)
                }}
              >
                <label htmlFor="pd-rename-input">지출명</label>
                <div className="pd-rename-row">
                  <input
                    id="pd-rename-input"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={originalName}
                    value={draft}
                  />
                  <button className="pd-rename-apply" type="submit">
                    적용
                  </button>
                </div>
              </form>
              {(evidence.length > 0 || removed.length > 0) && (
                <div className="pd-edit-list">
                  {evidence.map((item) =>
                    item.kind === "photo" ? (
                      (item.photoIds ?? []).map((id) => {
                        const found = photos.find((p) => p.id === id)
                        return (
                          <div className="detail-row" key={id}>
                            <span>
                              사진 · {found?.title} {found?.time}
                            </span>
                            <Action className="text-btn" onClick={() => unlinkPhoto(id)}>
                              제외
                            </Action>
                          </div>
                        )
                      })
                    ) : (
                      <div className="detail-row" key={item.key}>
                        <span>{item.text}</span>
                        <Action className="text-btn" onClick={() => unlink(payment.id, item.key)}>
                          해제
                        </Action>
                      </div>
                    ),
                  )}
                  {removed.map((item) => (
                    <div className="detail-row removed" key={item.key}>
                      <span>{item.text}</span>
                      <Action
                        className="text-btn"
                        onClick={() =>
                          item.photoId ? relinkPhoto(item.photoId) : relink(payment.id, item.key)
                        }
                      >
                        되돌리기
                      </Action>
                    </div>
                  ))}
                </div>
              )}
              {restored?.kind === "transfer" && revertTransfer && (
                <Action
                  className="pill"
                  onClick={() => {
                    revertTransfer(payment.id)
                    rename(payment.id, "")
                    setEditing(false)
                  }}
                >
                  원래 이름으로 되돌리기
                </Action>
              )}
            </div>
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
          <Action
            className={cx("pd-photo photo-thumb t0", photoOpen && "open")}
            label={photoOpen ? "사진 작게 보기" : "사진 크게 보기"}
            onClick={() => setPhotoOpen(!photoOpen)}
          >
            <span className="pd-photo-text">
              <ImageIcon size={20} strokeWidth={1.6} />
              <strong>{mainPhoto.title}</strong>
              {mainPhoto.sub && <small>{mainPhoto.sub}</small>}
            </span>
            {mainPhoto.time && <time>{mainPhoto.time}</time>}
          </Action>
        )}
        {morePhotos.map((item) => (
          <div className="pd-line" key={item.key}>
            <ImageIcon size={16} strokeWidth={1.7} />
            <span>{item.text}</span>
            <i className="photo-thumb t1" />
          </div>
        ))}

        {spot && (
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
          </div>
        )}
      </div>
    </div>
  )
}
