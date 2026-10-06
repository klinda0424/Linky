import { useState } from "react"
import { CalendarDays, ImageIcon, ImagePlus, MapPin, Plus } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
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
  weekday,
  won,
  type LedgerState,
  type Payment,
} from "@/lib/ledger"

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// ---------- 지출 내역 상세 (홈 오늘 지출에서 진입) ----------
// 요약 카드(언제·분류·이름·금액·상태, 그룹이면 인원·내 몫) → 결제 장소 카드 → 근거 카드 → 맞아요/수정(하단 고정)
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
}) {
  // [수정]을 누르면 이 화면 안에서 근거를 해제·되돌린다
  const [editing, setEditing] = useState(false)
  const removed = removedEvidenceOf(payment, state)
  const restored = restoredOf(payment, state)
  const evidence = evidenceOf(payment, state)
  const mine = shareOf(payment, state)
  const confirmed = Boolean(restored?.confirmed)
  const category = categoryOf(payment, state)
  // 그룹 결제: 인원과 내 몫 (분할을 확정하기 전에는 "정산하면 내 몫")
  const people = payment.group?.length ?? 0
  const splitDone = state.splitConfirmed.includes(payment.id)
  const perPerson = people > 1 ? Math.round(payment.amount / people) : 0
  const originalName =
    payment.kind === "transfer" ? `${payment.counterparty} 송금` : payment.merchant

  // 결제 장소: 복원된 지점이 있으면 그 지점, 없으면 결제 당시 내 위치
  const spot = restored
    ? payment.transit
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

  // 연결된 기록 카드: 사진 · 일정 · 위치
  const photoItem = evidence.find((item) => item.kind === "photo")
  const photo = photoItem?.photoIds?.map((id) => photos.find((p) => p.id === id))[0]
  const event = evidence.some((item) => item.kind === "calendar")
    ? eventsFor(payment, state)[0]
    : undefined
  const hasLocation = evidence.some((item) => item.kind === "location")

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 내역" />
      <div className={cx("pd-scroll", Boolean(restored) && "has-bar")}>
        {/* 요약: 언제 · 분류 / 이름 / 금액 / 상태 */}
        <section className="pd-hero">
          <span className="pd-meta">
            {label(payment.date)} ({weekday(payment.date)}) {payment.time}
            {category ? ` · ${category}` : payment.kind === "transfer" ? " · 계좌 이체" : ""}
          </span>
          <p className="pd-name">{restored ? restored.label : originalName}</p>
          <strong className="pd-won">{won(mine)}</strong>
          {people > 1 && (
            <p className="pd-split">
              {splitDone
                ? `결제 ${won(payment.amount)} · ${people}명 중 내 몫`
                : `${people}명이 함께 결제 · 정산하면 내 몫 ${won(perPerson)}`}
            </p>
          )}
          <div className="pd-tags">
            {evidence.length > 0 ? (
              <em className={cx("pd-tag", confirmed && "done")}>
                {confirmed ? "확인했어요" : `근거 ${evidence.length}개`}
              </em>
            ) : (
              <em className="pd-tag muted">기록 없음</em>
            )}
            {people > 1 && !splitDone && <em className="pd-tag pending">정산 대기</em>}
          </div>
          {restored && <p className="pd-origin">카드 내역 · {originalName}</p>}
        </section>

        {/* 결제 장소 */}
        <h2 className="pd-title">결제 장소</h2>
        {spot ? (
          <section className="pd-place">
            <div className="pd-map" aria-hidden="true">
              <span className="pd-pin">
                <MapPin size={22} strokeWidth={2} />
              </span>
              <i />
            </div>
            <div className="pd-place-text">
              <strong>{spot}</strong>
              <small>결제 당시 내 위치</small>
            </div>
          </section>
        ) : (
          <p className="pd-empty">기록 없음</p>
        )}

        {/* 이 결제의 근거: 사진 · 일정 · 위치 */}
        <div className="pd-title-row">
          <h2 className="pd-title">이 결제의 근거</h2>
          <Action className="pd-add" onClick={() => openRecord(payment.id)}>
            <ImagePlus size={14} strokeWidth={1.8} /> 앨범 <Plus size={13} strokeWidth={2} />
          </Action>
        </div>
        {photo || event || hasLocation ? (
          <div className="pd-records">
            {photo && (
              <div className="pd-record">
                <ImageIcon size={16} strokeWidth={1.7} />
                <small>사진</small>
                <span>{photo.time} · {photo.title}</span>
                <i className="photo-thumb t0" />
              </div>
            )}
            {event && (
              <div className="pd-record">
                <CalendarDays size={16} strokeWidth={1.7} />
                <small>일정</small>
                <span>
                  {event.title} · {event.start}
                </span>
              </div>
            )}
            {hasLocation && (
              <div className="pd-record">
                <MapPin size={16} strokeWidth={1.7} />
                <small>위치</small>
                <span>
                  {lastStay
                    ? `이동 중 · ${lastStay.name} ${lastStay.from}~${lastStay.to}`
                    : payment.place}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="pd-empty">기록 없음</p>
        )}

        {editing && (
          <div className="pay-detail pd-editing">
            {evidence.length === 0 && <p className="detail-note">연결된 근거가 없어요</p>}
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
      </div>
      {restored && (
        <div className="pd-bar">
          <div className={cx("pd-actions", confirmed && "single")}>
            {!confirmed && (
              <Action className="pd-confirm" onClick={() => confirmRestore(payment.id)}>
                맞아요
              </Action>
            )}
            <Action className="pd-edit" onClick={() => setEditing(!editing)}>
              수정
            </Action>
          </div>
        </div>
      )}
    </div>
  )
}
