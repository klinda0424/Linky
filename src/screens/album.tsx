import { Camera, ChevronRight } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Photo,
  type YMD,
  evidenceOf,
  evidenceText,
  events,
  label,
  man,
  paymentsOn,
  photoLinked,
  photos,
  photosFor,
  sameDay,
  weekday,
  won,
} from "@/lib/ledger"

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// 사진이 속한 일정: 같은 날, 일정 시간 앞뒤 1시간 안
const eventOfPhoto = (photo: Photo) =>
  events.find(
    (event) =>
      sameDay(event.date, photo.date) &&
      toMinutes(photo.time) >= toMinutes(event.start) - 60 &&
      toMinutes(photo.time) <= toMinutes(event.end) + 60,
  )

const tile = (index: number) => `photo-thumb t${index % 5}`

// ---------- 앨범 탭: 결제와 연결된 사진만, 일정별 묶음 ----------
export function AlbumTab({
  back,
  state,
  openPhoto,
  openEvent,
  focusDay,
}: {
  back: () => void
  state: LedgerState
  openPhoto: (photo: Photo) => void
  openEvent: (event: CalEvent) => void
  // 캘린더 날짜에서 열었을 때: 그날 사진을 맨 위에 먼저 보여 준다
  focusDay?: YMD
}) {
  const linked = photos.filter((photo) => photoLinked(photo, state))
  const dayPhotos = focusDay
    ? linked
        .filter((photo) => sameDay(photo.date, focusDay))
        .sort((a, b) => a.time.localeCompare(b.time))
    : []
  const groups: Array<{ key: string; title: string; sub: string; event?: CalEvent; list: Photo[] }> = []
  for (const photo of linked) {
    const event = eventOfPhoto(photo)
    const key = event ? event.id : `d${photo.date.m}-${photo.date.d}`
    let group = groups.find((item) => item.key === key)
    if (!group) {
      group = event
        ? {
            key,
            title: event.title,
            sub: `${label(event.date)} (${weekday(event.date)}) ${event.start}~${event.end}`,
            event,
            list: [],
          }
        : {
            key,
            title: "기타",
            sub: `${label(photo.date)} (${weekday(photo.date)})`,
            list: [],
          }
      groups.push(group)
    }
    group.list.push(photo)
  }
  groups.sort((a, b) => b.list[0].date.m * 100 + b.list[0].date.d - (a.list[0].date.m * 100 + a.list[0].date.d))
  return (
    <>
      <MainHeader back={back} title="앨범" />
      <div className="album-scroll">
        <p className="album-count">결제와 연결된 사진 {linked.length}장</p>
        {groups.length === 0 && (
          <div className="main-card arc-empty">
            결제와 연결된 사진이 아직 없어요. 사진을 추가하면 같은 시각의 결제에
            연결해요.
          </div>
        )}
        {focusDay && (
          <div className="album-group album-day">
            <div className="album-head">
              <div>
                <strong>
                  {label(focusDay)} ({weekday(focusDay)})
                </strong>
                <span>
                  {dayPhotos.length > 0 ? `이날 사진 ${dayPhotos.length}장` : "이날 사진 기록 없음"}
                </span>
              </div>
            </div>
            {dayPhotos.length > 0 && (
              <div className="album-grid">
                {dayPhotos.map((photo, index) => (
                  <Action
                    className={cx(tile(index), "album-tile")}
                    key={photo.id}
                    label={`${photo.title} 사진`}
                    onClick={() => openPhoto(photo)}
                  >
                    <small>{photo.time}</small>
                  </Action>
                ))}
              </div>
            )}
          </div>
        )}
        {focusDay && groups.length > 0 && <p className="album-divider">일정별 사진</p>}
        {groups.map((group) => (
          <div className="album-group" key={group.key}>
            <div className="album-head">
              <div>
                <strong>{group.title}</strong>
                <span>
                  {group.sub} · 사진 {group.list.length}장
                </span>
              </div>
              {group.event && (
                <Action
                  className="edit-link"
                  onClick={() => group.event && openEvent(group.event)}
                >
                  이벤트 리포트
                </Action>
              )}
            </div>
            <div className="album-grid">
              {group.list.map((photo, index) => (
                <Action
                  className={cx(tile(index), "album-tile")}
                  key={photo.id}
                  label={`${photo.title} 사진`}
                  onClick={() => openPhoto(photo)}
                >
                  <small>{photo.time}</small>
                </Action>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------- 사진 상세 ----------
export function PhotoDetail({
  photo,
  state,
  back,
  unlink,
  openPayment,
}: {
  photo: Photo
  state: LedgerState
  back: () => void
  unlink: (photoId: string) => void
  openPayment: (payment: Payment) => void
}) {
  const linked = paymentsOn(photo.date).filter((payment) =>
    photosFor(payment, state).some((item) => item.id === photo.id),
  )
  const unlinked = state.photoUnlinked.includes(photo.id)
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="사진" />
      <div className="photo-detail">
        <div className="photo-big photo-thumb t0">
          <Camera size={42} strokeWidth={1.2} />
        </div>
        <div className="photo-meta">
          <strong>{photo.title}</strong>
          <span>
            {label(photo.date)} {photo.time} · {photo.zone}
          </span>
        </div>
        <p className="section-title">연결된 결제</p>
        {unlinked || linked.length === 0 ? (
          <div className="main-card arc-empty">
            연결된 결제가 없어요. 이 사진은 앨범에 표시되지 않아요.
          </div>
        ) : (
          linked.map((payment) => (
            <Action
              className="main-card linked-pay"
              key={payment.id}
              onClick={() => openPayment(payment)}
            >
              <div>
                <strong>{payment.merchant}</strong>
                <span>
                  {payment.time} · {evidenceText(evidenceOf(payment, state).length)}
                </span>
              </div>
              <b>{won(payment.amount)}</b>
              <ChevronRight size={16} strokeWidth={1.5} />
            </Action>
          ))
        )}
        {!unlinked && linked.length > 0 && (
          <Action className="secondary-button" onClick={() => unlink(photo.id)}>
            연결 해제
          </Action>
        )}
      </div>
    </div>
  )
}

// ---------- 이벤트 리포트 (사실만 나열) ----------
export function EventReport({
  event,
  state,
  back,
  openPayment,
}: {
  event: CalEvent
  state: LedgerState
  back: () => void
  openPayment: (payment: Payment) => void
}) {
  const pays = paymentsOn(event.date).filter(
    (payment) =>
      toMinutes(payment.time) >= toMinutes(event.start) - 60 &&
      toMinutes(payment.time) <= toMinutes(event.end) + 60,
  )
  const total = pays.reduce((sum, payment) => sum + payment.amount, 0)
  const pics = photos.filter(
    (photo) => photoLinked(photo, state) && eventOfPhoto(photo)?.id === event.id,
  )
  const places = [...new Set(pays.map((payment) => payment.place ?? payment.zone))]
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="이벤트 리포트" />
      <div className="arc-content">
        <div className="arc-hero">
          <span>
            {label(event.date)} ({weekday(event.date)}) {event.start}~{event.end}
          </span>
          <strong>{event.title}</strong>
          <p>
            {[event.zone, ...(event.people ?? [])].join(" · ")}
          </p>
        </div>
        <div className="arc-stats">
          <div>
            <span>사진</span>
            <strong>{pics.length}장</strong>
          </div>
          <div>
            <span>결제</span>
            <strong>{pays.length}건</strong>
          </div>
          <div>
            <span>합계</span>
            <strong>{man(total)}원</strong>
          </div>
        </div>
        <p className="section-title">이 일정의 결제</p>
        {pays.length === 0 ? (
          <div className="main-card arc-empty">기록 없음</div>
        ) : (
          <div className="main-card arc-rows">
            {pays.map((payment) => (
              <Action
                className="report-pay"
                key={payment.id}
                onClick={() => openPayment(payment)}
              >
                <div>
                  <strong>{payment.merchant}</strong>
                  <span>{payment.time}</span>
                </div>
                <p>{won(payment.amount)}</p>
              </Action>
            ))}
          </div>
        )}
        {places.length > 0 && (
          <div className="main-card">
            <p className="section-title">동선</p>
            <p className="route-text">{places.join(" → ")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export type { YMD }
