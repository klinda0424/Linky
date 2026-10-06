import { ChevronRight } from "lucide-react"
import { Action, cx } from "@/components/common"
import { HeaderActions } from "@/components/layout"
import {
  TODAY,
  dayMine,
  evidenceOf,
  keyOf,
  label,
  man,
  paymentsOn,
  payments,
  photosFor,
  photosOn,
  type Photo,
  restoredOf,
  sameDay,
  shareOf,
  stays,
  weekday,
  won,
  ymd,
  type Evidence,
  type LedgerState,
  type Payment,
  type TransferGuess,
  type YMD,
} from "@/lib/ledger"
import { transferEvidenceLine, transferQuestion } from "@/screens/transfer"

const weekNames = ["일", "월", "화", "수", "목", "금", "토"]

// 오늘이 속한 일요일 시작 주의 7일
function weekOf(date: YMD): YMD[] {
  const start = new Date(date.y, date.m - 1, date.d - new Date(date.y, date.m - 1, date.d).getDay())
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return ymd(day.getFullYear(), day.getMonth() + 1, day.getDate())
  })
}

// 오늘 이전의 가장 최근 결제 몇 건 (오늘 기록이 없을 때 홈이 비어 보이지 않게 한다)
function recentPayments(limit: number): Payment[] {
  return payments
    .filter((payment) => keyOf(payment.date) < keyOf(TODAY))
    .sort((a, b) => keyOf(b.date) - keyOf(a.date) || b.time.localeCompare(a.time))
    .slice(0, limit)
}

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// 근거 한 줄: 내 위치 · 일정 · 사진을 짧게 이어 쓴다 (사실만)
function evidenceLine(list: Evidence[]) {
  if (list.length === 0) return "기록 없음"
  return list
    .map((item) => {
      if (item.kind === "location") return item.text.replace("결제 당시 내 위치 · ", "내 위치 ")
      if (item.kind === "calendar")
        return item.text.replace("내 일정 · ", "일정 ").replace(/ \(.*\)$/, "")
      if (item.kind === "photo") return `사진 ${item.photoIds?.length ?? 0}장`
      return item.text
    })
    .join(" · ")
}

// ---------- 오늘 지출 카드: 원본 → 복원 결과 → 근거 → 맞아요/수정 ----------
function SpendCard({
  payment,
  state,
  showDate,
  openPayment,
  confirmRestore,
}: {
  payment: Payment
  state: LedgerState
  showDate?: boolean
  openPayment: (payment: Payment) => void
  confirmRestore: (paymentId: string) => void
}) {
  const restored = restoredOf(payment, state)
  const evidence = evidenceOf(payment, state)
  const mine = shareOf(payment, state)
  const thumb = restored ? photosFor(payment, state)[0] : undefined
  const title = restored
    ? `${restored.label}${restored.spot ? ` · ${restored.spot}` : ""}`
    : payment.merchant
  return (
    <div className="hm-spend">
      <Action className="hm-spend-main" onClick={() => openPayment(payment)}>
        <div>
          <span className="hm-spend-orig">
            {showDate ? `${label(payment.date)} ` : ""}
            {restored ? restored.original : payment.time}
          </span>
          <strong>{title}</strong>
          <b>
            {mine !== payment.amount && <s>{won(payment.amount)}</s>}
            {won(mine)}
          </b>
        </div>
        {thumb && <i className="photo-thumb t0 hm-spend-thumb" />}
      </Action>
      <div className="hm-spend-foot">
        <p>{evidenceLine(evidence)}</p>
        {restored && (
          <div className="hm-spend-actions">
            <Action
              className="pill primary"
              disabled={restored.confirmed}
              onClick={() => confirmRestore(payment.id)}
            >
              {restored.confirmed ? "확인했어요" : "맞아요"}
            </Action>
            <Action className="pill" onClick={() => openPayment(payment)}>
              수정
            </Action>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- 오늘의 동선: 체류 구간과 결제 위치를 시간순으로 잇는 미니 지도 ----------
type Stop = { key: string; zone: string; text: string[]; seed: string }

function routeStops(list: Payment[], state: LedgerState): Stop[] {
  if (!state.sources.location) return []
  const steps = [
    ...stays
      .filter((stay) => sameDay(stay.date, TODAY))
      .map((stay) => ({
        id: stay.id,
        time: stay.from,
        zone: stay.zone,
        text: `${stay.from}~${stay.to} 체류`,
      })),
    ...list.flatMap((payment) =>
      payment.place || payment.transit
        ? [
            {
              id: payment.id,
              time: payment.time,
              zone: payment.zone,
              text: payment.transit ? `${payment.time} 이동 중` : payment.time,
            },
          ]
        : [],
    ),
  ].sort((a, b) => a.time.localeCompare(b.time))
  // 같은 구역이 이어지면 한 지점으로 묶고 시각을 모은다
  const stops: Stop[] = []
  for (const step of steps) {
    const last = stops[stops.length - 1]
    if (last && last.zone === step.zone) last.text.push(step.text)
    else stops.push({ key: step.id, zone: step.zone, text: [step.text], seed: step.id })
  }
  return stops
}

function RouteMap({ stops, onOpen }: { stops: Stop[]; onOpen: () => void }) {
  // 방문 순서대로 카드 안에 고르게 펼친다 (라벨이 겹치지 않게 위아래로 번갈아 놓는다)
  const points = stops.map((stop, index) => ({
    ...stop,
    x: stops.length === 1 ? 50 : 24 + (index / (stops.length - 1)) * 52,
    y: index % 2 === 0 ? 30 : 46,
  }))
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  return (
    <Action className="hm-route" label="오늘의 동선 지도로 보기" onClick={onOpen}>
      <span className="hm-route-date">
        {label(TODAY)}
      </span>
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
        {points.length > 1 && <path d={path} />}
      </svg>
      {points.map((p) => (
        <span className="hm-stop" key={p.key} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <i />
          <em>
            {p.zone}
            {p.text.map((line) => (
              <small key={line}>{line}</small>
            ))}
          </em>
        </span>
      ))}
    </Action>
  )
}

// ---------- 홈: 링키가 찾았어요 · 이번 주 · 오늘 지출 · 오늘의 하루 · 동선 · 사진 ----------
export function HomePage({
  state,
  openSearch,
  openProfile,
  openDay,
  openPayment,
  openAlbum,
  openMap,
  openPhoto,
  openSettlement,
  pendingSettlement,
  foundTransfer,
  openTransfer,
  confirmTransfer,
  declineTransfer,
  confirmRestore,
}: {
  state: LedgerState
  openSearch: () => void
  openProfile: () => void
  openDay: (day: YMD) => void
  openPayment: (payment: Payment) => void
  openAlbum: () => void
  openMap: () => void
  openPhoto: (photo: Photo) => void
  // 정산 알림(필요시): 처리할 정산이 있을 때만 값이 있다
  openSettlement: () => void
  pendingSettlement?: { count: number; total: number }
  // "링키가 찾았어요": 가맹점 없는 송금에서 맥락을 찾았을 때만 값이 있다
  foundTransfer?: { payment: Payment; guess: TransferGuess }
  openTransfer: () => void
  confirmTransfer: (payment: Payment) => void
  declineTransfer: (payment: Payment) => void
  confirmRestore: (paymentId: string) => void
}) {
  const week = weekOf(TODAY)
  const todayList = paymentsOn(TODAY)
  const recent = todayList.length === 0 ? recentPayments(3) : []
  const todayMine = todayList.reduce((sum, payment) => sum + shareOf(payment, state), 0)
  const todayPhotos = photosOn(TODAY, state).filter(
    (photo) => !state.photoUnlinked.includes(photo.id),
  )
  const stops = routeStops(todayList, state)
  // 오늘 가장 오래 머문 곳 (위치 체류 기록 기준)
  const longestStay = state.sources.location
    ? stays
        .filter((stay) => sameDay(stay.date, TODAY))
        .sort((a, b) => minutes(b.to) - minutes(b.from) - (minutes(a.to) - minutes(a.from)))[0]
    : undefined
  const movingCount = todayList.filter((payment) => payment.transit).length
  const linkedPayment = (photo: Photo) =>
    todayList.find((payment) => photosFor(payment, state).some((item) => item.id === photo.id))
  return (
    <>
      <div className="cal-brandbar">
        <div className="brand cal-brand">
          <span className="brand-mark">L</span>
          <span>Linky</span>
        </div>
        <HeaderActions openProfile={openProfile} openSearch={openSearch} />
      </div>
      <div className="main-scroll hm-scroll">
        {foundTransfer && (
          <section className="hm-found">
            <Action className="hm-found-body" onClick={openTransfer}>
              <strong className="hm-found-title">링키가 찾았어요</strong>
              <p>{transferQuestion(foundTransfer.payment, foundTransfer.guess)}</p>
              <div className="hm-found-amount">
                <span>{foundTransfer.payment.counterparty}</span>
                <b>{won(foundTransfer.payment.amount)}</b>
              </div>
              <small>{transferEvidenceLine(foundTransfer.guess)}</small>
            </Action>
            <div className="hm-found-actions">
              <Action className="pill primary" onClick={() => confirmTransfer(foundTransfer.payment)}>
                맞아요
              </Action>
              <Action className="pill" onClick={() => declineTransfer(foundTransfer.payment)}>
                아니에요
              </Action>
            </div>
            {pendingSettlement && (
              <Action className="hm-found-link" onClick={openSettlement}>
                정산 대기함 {pendingSettlement.count}건
                <ChevronRight size={14} strokeWidth={1.8} />
              </Action>
            )}
          </section>
        )}
        {!foundTransfer && pendingSettlement && (
          <Action className="main-card settle-alert" onClick={openSettlement}>
            <div>
              <strong>정산할 결제가 있어요</strong>
              <span>
                정산 대기 {pendingSettlement.count}건 · {won(pendingSettlement.total)}
              </span>
            </div>
            <ChevronRight size={17} strokeWidth={1.5} />
          </Action>
        )}

        <div className="hm-head">
          <span>
            {label(week[0])} — {label(week[6])}
          </span>
          <div>
            <h2>이번 주</h2>
            <em>
              {label(TODAY)} {weekday(TODAY)}요일
            </em>
          </div>
        </div>
        <div className="main-card hm-week">
          {week.map((day) => {
            const future = keyOf(day) > keyOf(TODAY)
            const total = future ? 0 : dayMine(day, state)
            return (
              <Action
                className={cx("hm-day", sameDay(day, TODAY) && "today")}
                key={keyOf(day)}
                label={`${label(day)} 열기`}
                onClick={() => openDay(day)}
              >
                <span>{weekNames[new Date(day.y, day.m - 1, day.d).getDay()]}</span>
                <strong>{day.d}</strong>
                <small>{total > 0 ? man(total) : "-"}</small>
              </Action>
            )
          })}
        </div>

        <div className="hm-title-row">
          <h2>오늘 지출</h2>
          <b>{todayList.length > 0 ? won(todayMine) : "기록 없음"}</b>
        </div>
        {todayList.map((payment) => (
          <SpendCard
            confirmRestore={confirmRestore}
            key={payment.id}
            openPayment={openPayment}
            payment={payment}
            state={state}
          />
        ))}
        {todayList.length === 0 && <p className="hm-empty">오늘 결제 기록 없음</p>}
        {recent.length > 0 && <p className="hm-recent">최근 결제</p>}
        {recent.map((payment) => (
          <SpendCard
            confirmRestore={confirmRestore}
            key={payment.id}
            openPayment={openPayment}
            payment={payment}
            showDate
            state={state}
          />
        ))}

        {todayList.length > 0 && (
          <section className="hm-day-report">
            <strong className="hm-found-title">오늘의 하루</strong>
            <ul>
              <li>
                결제 {todayList.length}건 · 지출 {won(todayMine)}
              </li>
              <li>
                가장 오래 머문 곳:{" "}
                {longestStay ? `${longestStay.name} ${longestStay.from}~${longestStay.to}` : "기록 없음"}
              </li>
              <li>이동 중 결제 {movingCount}건</li>
            </ul>
          </section>
        )}

        <div className="hm-title-row">
          <h2>오늘의 동선</h2>
          <Action className="home-more" onClick={openMap}>
            지도로 보기
          </Action>
        </div>
        {stops.length === 0 ? (
          <p className="hm-empty">기록 없음</p>
        ) : (
          <RouteMap onOpen={openMap} stops={stops} />
        )}
        <p className="home-sub">결제 당시 내 위치</p>

        <div className="hm-title-row">
          <h2>오늘의 사진</h2>
          <Action className="home-more" onClick={openAlbum}>
            앨범 보기
          </Action>
        </div>
        {todayPhotos.length === 0 ? (
          <p className="hm-empty">기록 없음</p>
        ) : (
          <div className="hm-photos">
            {todayPhotos.map((photo, index) => {
              const paid = linkedPayment(photo)
              return (
                <Action
                  className={cx("photo-thumb", `t${index % 5}`, "hm-photo")}
                  key={photo.id}
                  label={`${photo.title} 사진`}
                  onClick={() => openPhoto(photo)}
                >
                  <span>
                    {paid
                      ? (restoredOf(paid, state)?.label ?? paid.merchant)
                      : `${photo.zone} ${photo.time}`}
                  </span>
                </Action>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
