import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from "react"
import { Camera, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Action, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Photo,
  type YMD,
  PLACES,
  TODAY,
  evidenceOf,
  events,
  frequentPlaces,
  keyOf,
  label,
  payments,
  photoLinked,
  photos,
  pinPoint,
  shareOf,
  trailPoints,
  weekday,
  won,
  ymd,
  zoneNames,
} from "@/lib/ledger"

type Period = "day" | "week" | "month"

// 지도 확대: 두 손가락으로 확대·축소, 확대한 뒤에는 한 손가락으로 이동
const MIN_ZOOM = 1
const MAX_ZOOM = 4
type MapView = { k: number; x: number; y: number }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
// 확대한 지도가 영역 밖으로 벗어나 빈 곳이 보이지 않게 이동 범위를 제한한다
const keepInside = (k: number, x: number, y: number, width: number, height: number) => ({
  x: clamp(x, width * (1 - k), 0),
  y: clamp(y, height * (1 - k), 0),
})
const distance = (a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
type Selected =
  | { kind: "payment"; id: string }
  | { kind: "photo"; id: string }
  | { kind: "event"; id: string }

const addDays = (date: YMD, amount: number): YMD => {
  const next = new Date(date.y, date.m - 1, date.d + amount)
  return ymd(next.getFullYear(), next.getMonth() + 1, next.getDate())
}

function rangeOf(period: Period, date: YMD) {
  if (period === "day") return { from: keyOf(date), to: keyOf(date) }
  if (period === "week") {
    const start = addDays(date, -new Date(date.y, date.m - 1, date.d).getDay())
    return { from: keyOf(start), to: keyOf(addDays(start, 6)) }
  }
  return {
    from: keyOf(ymd(date.y, date.m, 1)),
    to: keyOf(ymd(date.y, date.m, 31)),
  }
}

const rangeLabel = (period: Period, date: YMD) => {
  if (period === "day") return `${label(date)} (${weekday(date)})`
  if (period === "month") return `${date.y}년 ${date.m}월`
  const { from } = rangeOf("week", date)
  const start = ymd(Math.floor(from / 10000), Math.floor((from % 10000) / 100), from % 100)
  const end = addDays(start, 6)
  return `${label(start)} ~ ${label(end)}`
}

export function MapTab({
  back,
  state,
  initialDay,
  initialPeriod = "day",
  openPayment,
}: {
  back: () => void
  state: LedgerState
  initialDay?: YMD
  initialPeriod?: Period
  // 핀의 결제 카드로 이동 (캘린더 탭의 날짜 시트가 열린다)
  openPayment: (payment: Payment, returnToMonth?: YMD) => void
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [date, setDate] = useState<YMD>(initialDay ?? TODAY)
  const [show, setShow] = useState({ payment: true, photo: true, event: true })
  const [selected, setSelected] = useState<Selected>()
  const [selectedPlace, setSelectedPlace] = useState<string | "missing">()
  const [view, setView] = useState<MapView>({ k: 1, x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    mode: "pinch" | "pan"
    startDistance: number
    k: number
    x: number
    y: number
    fromX: number
    fromY: number
    moved: boolean
  }>(undefined)
  const resetView = () => setView({ k: 1, x: 0, y: 0 })

  // 트랙패드·마우스: Ctrl(또는 ⌘) + 휠로 커서 위치 기준 확대·축소
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const cx = event.clientX - rect.left
      const cy = event.clientY - rect.top
      setView((current) => {
        const k = clamp(current.k * Math.exp(-event.deltaY * 0.01), MIN_ZOOM, MAX_ZOOM)
        const px = (cx - current.x) / current.k
        const py = (cy - current.y) / current.k
        return { k, ...keepInside(k, cx - px * k, cy - py * k, rect.width, rect.height) }
      })
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", onWheel)
  }, [])
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]]
      gesture.current = {
        mode: "pinch",
        startDistance: Math.max(distance(a, b), 1),
        k: view.k,
        x: view.x,
        y: view.y,
        fromX: (a.clientX + b.clientX) / 2 - rect.left,
        fromY: (a.clientY + b.clientY) / 2 - rect.top,
        moved: false,
      }
    } else if (event.touches.length === 1 && view.k > 1) {
      gesture.current = {
        mode: "pan",
        startDistance: 0,
        k: view.k,
        x: view.x,
        y: view.y,
        fromX: event.touches[0].clientX,
        fromY: event.touches[0].clientY,
        moved: false,
      }
    }
  }
  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (g.mode === "pinch" && event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]]
      const k = clamp((g.k * distance(a, b)) / g.startDistance, MIN_ZOOM, MAX_ZOOM)
      const cx = (a.clientX + b.clientX) / 2 - rect.left
      const cy = (a.clientY + b.clientY) / 2 - rect.top
      // 처음 두 손가락 가운데에 있던 지도 지점이 지금 손가락 가운데에 오도록 맞춘다
      const px = (g.fromX - g.x) / g.k
      const py = (g.fromY - g.y) / g.k
      g.moved = true
      setView({ k, ...keepInside(k, cx - px * k, cy - py * k, rect.width, rect.height) })
    } else if (g.mode === "pan" && event.touches.length === 1) {
      const dx = event.touches[0].clientX - g.fromX
      const dy = event.touches[0].clientY - g.fromY
      if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true
      setView((current) => ({
        k: current.k,
        ...keepInside(current.k, g.x + dx, g.y + dy, rect.width, rect.height),
      }))
    }
  }
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) return
    // 끌거나 확대한 직후에는 핀이 눌린 것으로 처리하지 않는다 (click이 touchend 뒤에 오므로 잠시 유지)
    window.setTimeout(() => {
      gesture.current = undefined
    }, 80)
  }
  const swallowClickAfterGesture = (event: MouseEvent<HTMLDivElement>) => {
    if (gesture.current?.moved) {
      event.stopPropagation()
      event.preventDefault()
    }
  }
  const { from, to } = rangeOf(period, date)
  const inRange = (value: YMD) => keyOf(value) >= from && keyOf(value) <= to
  const sorted = (list: Payment[]) =>
    [...list].sort(
      (a, b) =>
        keyOf(a.date) - keyOf(b.date) || a.time.localeCompare(b.time),
    )
  const pays = sorted(payments.filter((payment) => inRange(payment.date)))
  const pics = photos.filter(
    (photo: Photo) => inRange(photo.date) && photoLinked(photo, state),
  )
  const evs = state.sources.calendar
    ? events.filter((event: CalEvent) => inRange(event.date))
    : []
  // 월 지도와 아래 목록이 함께 쓰는 단일 지역 집계. place는 결제 당시 내 위치만 사용한다.
  const locatedPays = state.sources.location
    ? pays.filter((payment) => payment.place)
    : []
  const monthPlaces = [...locatedPays.reduce((groups, payment) => {
    const place = payment.place as string
    const current = groups.get(place) ?? []
    current.push(payment)
    groups.set(place, current)
    return groups
  }, new Map<string, Payment[]>())]
    .map(([place, placePayments]) => ({
      place,
      payments: placePayments,
      count: placePayments.length,
      total: placePayments.reduce((sum, payment) => sum + payment.amount, 0),
    }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place, "ko"))
  const missingPays = state.sources.location
    ? pays.filter((payment) => !payment.place)
    : pays
  const missingTotal = missingPays.reduce((sum, payment) => sum + payment.amount, 0)
  const maxPlaceCount = Math.max(1, ...monthPlaces.map((item) => item.count))
  const placeSelection = selectedPlace === "missing"
    ? {
        title: "위치 기록 없는 결제",
        description: "결제 당시 내 위치 기록이 없는 결제 · 날짜순",
        payments: missingPays,
        total: missingTotal,
      }
    : monthPlaces.find((item) => item.place === selectedPlace)
      ? {
          title: selectedPlace as string,
          description: `결제 당시 내 위치가 ${selectedPlace}였던 결제 · 날짜순`,
          payments: monthPlaces.find((item) => item.place === selectedPlace)!.payments,
          total: monthPlaces.find((item) => item.place === selectedPlace)!.total,
        }
      : undefined
  // 결제 사이를 잇는 내 위치 기록 지점 (위치 연동을 끄면 빠진다)
  const trail =
    period === "month" || !state.sources.location
      ? []
      : trailPoints.filter((point) => inRange(point.date))
  // 하루·주는 날짜별로 시간순 동선을 점선으로 잇는다 (결제 + 내 위치 기록 지점)
  const routes =
    period === "month"
      ? []
      : [
          ...new Set([
            ...pays.map((payment) => keyOf(payment.date)),
            ...trail.map((point) => keyOf(point.date)),
          ]),
        ].map((key) =>
          [
            ...pays
              .filter((payment) => keyOf(payment.date) === key)
              .map((payment) => ({ time: payment.time, at: pinPoint(payment.zone, payment.id) })),
            ...trail
              .filter((point) => keyOf(point.date) === key)
              .map((point) => ({ time: point.time, at: pinPoint(point.zone, point.id) })),
          ]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((item) => item.at),
        )
  const step = period === "day" ? 1 : period === "week" ? 7 : 30
  const move = (direction: number) => {
    if (period === "month") {
      const next = new Date(date.y, date.m - 1 + direction, 1)
      setDate(ymd(next.getFullYear(), next.getMonth() + 1, 1))
    } else setDate(addDays(date, direction * step))
    setSelected(undefined)
    setSelectedPlace(undefined)
    resetView()
  }
  const chosenPayment =
    selected?.kind === "payment"
      ? payments.find((payment) => payment.id === selected.id)
      : undefined
  const chosenPhoto =
    selected?.kind === "photo"
      ? photos.find((photo) => photo.id === selected.id)
      : undefined
  const chosenEvent =
    selected?.kind === "event"
      ? events.find((event) => event.id === selected.id)
      : undefined
  return (
    <>
      <MainHeader back={back} title="동선 지도" />
      <div className="map-top">
        <div className="map-period">
          {(
            [
              ["day", "하루"],
              ["week", "주"],
              ["month", "월"],
            ] as const
          ).map(([key, text]) => (
            <Action
              className={cx(period === key && "on")}
              key={key}
              onClick={() => {
                setPeriod(key)
                setSelected(undefined)
                setSelectedPlace(undefined)
                resetView()
              }}
            >
              {text}
            </Action>
          ))}
        </div>
        <div className="map-range">
          <Action className="cal-arrow" label="이전" onClick={() => move(-1)}>
            <ChevronLeft size={17} strokeWidth={1.6} />
          </Action>
          <strong>{rangeLabel(period, date)}</strong>
          <Action className="cal-arrow" label="다음" onClick={() => move(1)}>
            <ChevronRight size={17} strokeWidth={1.6} />
          </Action>
        </div>
      </div>
      <div className="map-scroll">
        {period !== "month" && <div className="map-filters">
          {(
            [
              ["payment", "결제"],
              ["photo", "사진"],
              ["event", "일정"],
            ] as const
          ).map(([key, text]) => (
            <Action
              className={cx("filter-chip", show[key] && "selected")}
              key={key}
              onClick={() => setShow({ ...show, [key]: !show[key] })}
            >
              {text}
            </Action>
          ))}
        </div>}
        <div
          className={cx("map-canvas", view.k > 1 && "zoomed")}
          onClickCapture={swallowClickAfterGesture}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
          onTouchStart={onTouchStart}
          ref={canvasRef}
        >
          <div
            className="map-layer"
            style={
              {
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
                "--inv": 1 / view.k,
              } as CSSProperties
            }
          >
          {/* 목업 지도: 한강, 큰 길, 지역 이름 */}
          <svg
            aria-hidden="true"
            className="map-bg"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <rect fill="#f1f3f4" height="100" width="100" />
            <path
              d="M0 56 C 20 50, 35 62, 55 56 S 85 50, 100 54 L 100 66 C 85 62, 70 68, 55 66 S 20 60, 0 66 Z"
              fill="#cfe5fb"
            />
            {[18, 34, 50, 66, 82].map((x) => (
              <line
                key={`v${x}`}
                stroke="#e3e6e8"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
                x1={x}
                x2={x + 6}
                y1="0"
                y2="100"
              />
            ))}
            {[14, 30, 44, 76, 90].map((y) => (
              <line
                key={`h${y}`}
                stroke="#e3e6e8"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="100"
                y1={y}
                y2={y + 3}
              />
            ))}
            {routes.map((points, index) =>
              points.length > 1 ? (
                <polyline
                  fill="none"
                  key={index}
                  points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                  stroke="var(--primary-strong)"
                  strokeDasharray="5 5"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
            )}
          </svg>
          {period !== "month" && zoneNames.map((zone) => (
            <span
              className="map-zone"
              key={zone}
              style={{ left: `${PLACES[zone].x}%`, top: `${PLACES[zone].y + 7}%` }}
            >
              {zone}
            </span>
          ))}
          {period !== "month" && show.event &&
            evs.map((event) => (
              <Action
                className={cx(
                  "map-pin event",
                  selected?.kind === "event" && selected.id === event.id && "chosen",
                )}
                key={event.id}
                label={event.title}
                onClick={() => setSelected({ kind: "event", id: event.id })}
                style={{
                  left: `${pinPoint(event.zone, event.id).x}%`,
                  top: `${pinPoint(event.zone, event.id).y - 7}%`,
                }}
              >
                <CalendarDays size={13} strokeWidth={1.8} />
              </Action>
            ))}
          {period !== "month" && show.photo &&
            pics.map((photo) => (
              <Action
                className={cx(
                  "map-pin photo",
                  selected?.kind === "photo" && selected.id === photo.id && "chosen",
                )}
                key={photo.id}
                label={`사진 ${photo.title}`}
                onClick={() => setSelected({ kind: "photo", id: photo.id })}
                style={{
                  left: `${pinPoint(photo.zone, photo.id).x}%`,
                  top: `${pinPoint(photo.zone, photo.id).y}%`,
                }}
              >
                <Camera size={13} strokeWidth={1.8} />
              </Action>
            ))}
          {period === "month" &&
            monthPlaces.map((item) => (
              <Action
                className="map-place-bubble"
                key={item.place}
                label={`${item.place} 결제 ${item.count}건`}
                onClick={() => setSelectedPlace(item.place)}
                style={
                  {
                    left: `${(PLACES[item.place] ?? { x: 50 }).x}%`,
                    top: `${(PLACES[item.place] ?? { y: 50 }).y}%`,
                    "--place-size": `${42 + Math.round((item.count / maxPlaceCount) * 22)}px`,
                  } as CSSProperties
                }
              >
                <strong>{item.count}</strong>
                <span>{item.place}</span>
              </Action>
            ))}
          {period !== "month" && show.payment &&
            trail.map((point) => (
              <span
                aria-label={`내 위치 기록 ${point.name}`}
                className="map-pin trail"
                key={point.id}
                style={{
                  left: `${pinPoint(point.zone, point.id).x}%`,
                  top: `${pinPoint(point.zone, point.id).y}%`,
                }}
              >
                <em>{point.name}</em>
              </span>
            ))}
          {period !== "month" && show.payment &&
            pays.map((payment, index) => {
              const restored = evidenceOf(payment, state).length > 0
              return (
                <Action
                  className={cx(
                    "map-pin pay",
                    !restored && "unrestored",
                    selected?.kind === "payment" &&
                      selected.id === payment.id &&
                      "chosen",
                  )}
                  key={payment.id}
                  label={`${index + 1}번 결제 ${payment.merchant}`}
                  onClick={() => setSelected({ kind: "payment", id: payment.id })}
                  style={{
                    left: `${pinPoint(payment.zone, payment.id).x}%`,
                    top: `${pinPoint(payment.zone, payment.id).y}%`,
                  }}
                >
                  {index + 1}
                </Action>
              )
            })}
          </div>
          {((period === "month"
            ? monthPlaces.length
            : pays.length + pics.length + evs.length) === 0) && (
            <div className="map-empty">이 기간에는 지도에 표시할 기록이 없어요</div>
          )}
          {view.k > 1 && (
            <Action className="map-reset" onClick={resetView}>
              원래 크기
            </Action>
          )}
        </div>
        <div className="map-legend">
          <span>
            <i className="pay" /> 결제
          </span>
          {period !== "month" && (
            <>
              <span>
                <i className="pay dashed" /> 근거 없는 결제
              </span>
              <span>
                <i className="trail" /> 내 위치 기록
              </span>
            </>
          )}
          {period !== "month" && (
            <>
              <span>
                <i className="photo" /> 사진
              </span>
              <span>
                <i className="event" /> 일정
              </span>
            </>
          )}
        </div>
        {chosenPayment && (
          <div className="map-preview">
            <div>
              <small>
                결제 당시 내 위치 · {chosenPayment.place ?? "기록 없음"}
              </small>
              <strong>{chosenPayment.merchant}</strong>
              <span>
                {label(chosenPayment.date)} {chosenPayment.time} ·{" "}
                {won(chosenPayment.amount)}
                {chosenPayment.group &&
                  state.splitConfirmed.includes(chosenPayment.id) &&
                  ` · 내 몫 ${won(shareOf(chosenPayment, state))}`}
              </span>
            </div>
            <Action
              className="mini-primary"
              onClick={() => openPayment(chosenPayment)}
            >
              결제 카드 보기
            </Action>
          </div>
        )}
        {chosenPhoto && (
          <div className="map-preview">
            <div>
              <small>사진 · {chosenPhoto.zone}</small>
              <strong>{chosenPhoto.title}</strong>
              <span>
                {label(chosenPhoto.date)} {chosenPhoto.time}
              </span>
            </div>
          </div>
        )}
        {chosenEvent && (
          <div className="map-preview">
            <div>
              <small>내 일정 · {chosenEvent.zone}</small>
              <strong>{chosenEvent.title}</strong>
              <span>
                {label(chosenEvent.date)} {chosenEvent.start}~{chosenEvent.end}
              </span>
            </div>
          </div>
        )}
        {period === "month" && (
          <div className="map-month-places">
            <p className="section-title">{date.m}월 결제한 곳</p>
            <div className="map-place-list">
              {monthPlaces.map((item) => (
                <Action key={item.place} onClick={() => setSelectedPlace(item.place)}>
                  <span>{item.place}</span>
                  <small>결제 {item.count}건</small>
                  <strong>{won(item.total)}</strong>
                  <ChevronRight size={16} strokeWidth={1.6} />
                </Action>
              ))}
              {monthPlaces.length === 0 && <p>기록 없음</p>}
            </div>
            {missingPays.length > 0 && (
              <Action className="map-missing-chip" onClick={() => setSelectedPlace("missing")}>
                위치 기록 없는 결제 {missingPays.length}건 · 지도에 표시 안 함
              </Action>
            )}
          </div>
        )}
        {period !== "month" && (
          <div className="map-places">
            <p className="section-title">최근 한 달 자주 간 장소</p>
            <div>
              {frequentPlaces(state).map(([place, count]) => (
                <span key={place}>
                  {place} <b>{count}회</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {placeSelection && (
        <div className="map-sheet-dim" onClick={() => setSelectedPlace(undefined)}>
          <div className="map-place-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="map-place-sheet-head">
              <div>
                <strong>
                  {placeSelection.title} · 결제 {placeSelection.payments.length}건 · {won(placeSelection.total)}
                </strong>
                <span>{placeSelection.description}</span>
              </div>
              <Action label="닫기" onClick={() => setSelectedPlace(undefined)}>×</Action>
            </div>
            <div className="map-place-payments">
              {placeSelection.payments.map((payment) => (
                <Action key={payment.id} onClick={() => openPayment(payment, date)}>
                  <time>{label(payment.date)} {payment.time}</time>
                  <strong>{payment.merchant}</strong>
                  <span>{won(payment.amount)}</span>
                  {payment.group && (
                    <small>내 몫 {won(Math.round(payment.amount / payment.group.length))}</small>
                  )}
                  <ChevronRight size={16} strokeWidth={1.6} />
                </Action>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

