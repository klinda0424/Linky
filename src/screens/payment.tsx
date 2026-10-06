import { useState } from "react"
import { CalendarDays, ChevronRight, ImagePlus, MapPin } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
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
// 원본 → 복원 결과, 결제 장소, 연결된 기록, 복원 근거, 맞아요/수정
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

  // 복원 근거 (사실만): 어떤 기록이 어떻게 맞았는지
  const reasons: string[] = []
  if (restored?.kind === "transit") {
    reasons.push("결제 시각이 체류 구간 밖(이동 중)이에요")
    if (lastStay)
      reasons.push(`직전 체류지는 ${lastStay.name}(${lastStay.from}~${lastStay.to})예요`)
    reasons.push(`${payment.transit?.from} 인근을 탑승 지점으로 봤어요`)
  } else if (restored) {
    if (payment.place) reasons.push(`결제 당시 내 위치가 ${payment.place}였어요`)
    reasons.push(`가맹점명과 같은 곳으로 ${restored.label}을 찾았어요`)
    if (photoItem?.photoIds?.length)
      reasons.push(`결제 시각 ±30분 안에 찍은 사진 ${photoItem.photoIds.length}장이 있어요`)
    if (event) reasons.push(`그 시간에 '${event.title}' 일정이 있어요`)
  }

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="지출 내역" />
      <div className="pd-scroll">
        <div className="pd-amount">
          <strong>{won(mine)}</strong>
          <span>
            {label(payment.date)}({weekday(payment.date)}) {payment.time}
          </span>
        </div>

        <section className="pd-origin">
          <div className="pd-origin-top">
            <div>
              <small>{restored ? "원본" : "가맹점"}</small>
              <p>{payment.kind === "transfer" ? `${payment.counterparty} 송금` : payment.merchant}</p>
            </div>
            <span className={cx("pd-badge", !restored && evidence.length === 0 && "none")}>
              {restored ? (confirmed ? "확인함" : "복원됨") : evidence.length > 0 ? `근거 ${evidence.length}개` : "기록 없음"}
            </span>
          </div>
          {restored && (
            <>
              <div className="pd-link">
                <i />
              </div>
              <div>
                <small>복원</small>
                <strong>{restored.label}</strong>
              </div>
            </>
          )}
        </section>

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
              <MapPin size={16} strokeWidth={1.8} />
              <strong>{spot}</strong>
              <small>결제 당시 내 위치</small>
            </div>
          </section>
        ) : (
          <p className="pd-empty">기록 없음</p>
        )}

        <h2 className="pd-title">연결된 기록</h2>
        {photo || event || hasLocation ? (
          <div className="pd-records">
            {photo && (
              <div className="pd-record photo">
                <i className="photo-thumb t0" />
                <small>사진</small>
                <strong>{photo.time}</strong>
              </div>
            )}
            {event && (
              <div className="pd-record">
                <CalendarDays size={20} strokeWidth={1.6} />
                <small>일정</small>
                <strong>{event.title}</strong>
                <strong>{event.start}</strong>
              </div>
            )}
            {hasLocation && (
              <div className="pd-record">
                <MapPin size={20} strokeWidth={1.6} />
                <small>위치</small>
                <strong>{lastStay ? "이동 중" : payment.place}</strong>
                {lastStay && (
                  <strong>
                    {lastStay.name} {lastStay.from}~{lastStay.to}
                  </strong>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="pd-empty">기록 없음</p>
        )}

        {restored && reasons.length > 0 && (
          <section className="pd-reasons">
            <strong>이렇게 복원했어요</strong>
            <ul>
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        )}

        {restored && (
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

        <Action className="pd-album" onClick={() => openRecord(payment.id)}>
          <span className="pd-album-icon">
            <ImagePlus size={20} strokeWidth={1.6} />
          </span>
          <div>
            <strong>앨범에서 불러오기</strong>
            <small>자동 매칭이 놓친 사진을 직접 연결</small>
          </div>
          <ChevronRight size={18} strokeWidth={1.5} />
        </Action>
      </div>
    </div>
  )
}
