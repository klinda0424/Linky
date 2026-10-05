import { useState } from "react"

import { Camera, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Action, cx } from "@/components/common"

import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Pt,
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
  weekday,
  won,
  ymd,
  zoneNames,
} from "@/lib/ledger"

type Period = "day" | "week" | "month"

type Selected = { kind: "payment" id: string } | {
  kind: "photo"
  id: string
} | { kind: "event" id: string }

type Waypoint = Pt & { label: string detail: string }

const octoberTwelve = ymd(2026, 10, 12)

const octoberTwelveWaypoints: Waypoint[] = [
  { x: 58, y: 20, label: "시작", detail: "성수역" },

  { x: 87, y: 46, label: "귀가", detail: "귀가" },
]

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

  const start = ymd(
    Math.floor(from / 10000),
    Math.floor((from % 10000) / 100),
    from % 100,
  )

  const end = addDays(start, 6)

  return `${label(start)} ~ ${label(end)}`
}

export function MapTab({
  state,

  initialDay,

  openPayment,

  // 핀의 결제 카드로 이동 (캘린더 탭의 날짜 시트가 열린다)
}: {
  state: LedgerState

  initialDay?: YMD

  openPayment: (payment: Payment) => void
}) {
  const [period, setPeriod] = useState<Period>("day")

  const [date, setDate] = useState<YMD>(initialDay ?? TODAY)

  const [show, setShow] = useState({ payment: true, photo: true, event: true })

  const [selected, setSelected] = useState<Selected>()

  const { from, to } = rangeOf(period, date)

  const inRange = (value: YMD) => keyOf(value) >= from && keyOf(value) <= to

  const sorted = (list: Payment[]) =>
    [...list].sort(
      (a, b) => keyOf(a.date) - keyOf(b.date) || a.time.localeCompare(b.time),
    )

  const pays = sorted(payments.filter((payment) => inRange(payment.date)))

  const pics = photos.filter(
    (photo: Photo) => inRange(photo.date) && photoLinked(photo, state),
  )

  const evs = state.sources.calendar
    ? events.filter((event: CalEvent) => inRange(event.date))
    : []

  const isOctoberTwelveDay =
    period === "day" && keyOf(date) === keyOf(octoberTwelve)

  const waypoints = isOctoberTwelveDay ? octoberTwelveWaypoints : []

  // 하루·주는 날짜별로 시간순 동선을 점선으로 잇는다. 10/12는 시작·귀가

  // 위치를 결제 데이터와 구분한 경유점으로 덧붙인다.

  const routes =
    period === "month"
      ? []
      : [...new Set(pays.map((payment) => keyOf(payment.date)))].map((key) =>
          pays

            .filter((payment) => keyOf(payment.date) === key)

            .map((payment) => pinPoint(payment.zone, payment.id)),
        )

  if (isOctoberTwelveDay && routes[0]) {
    routes[0] = [
      octoberTwelveWaypoints[0],

      ...routes[0],

      octoberTwelveWaypoints[1],
    ]
  }

  const step = period === "day" ? 1 : period === "week" ? 7 : 30

  const move = (direction: number) => {
    if (period === "month") {
      const next = new Date(date.y, date.m - 1 + direction, 1)

      setDate(ymd(next.getFullYear(), next.getMonth() + 1, 1))
    } else setDate(addDays(date, direction * step))

    setSelected(undefined)
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
      <div className="map-top">
        <div className="map-period">
          {([
            ["day", "하루"],

            ["week", "주"],

            ["month", "월"],
          ] as const)

            .map(([key, text]) => (
              <Action
                className={cx(period === key && "on")}
                key={key}
                onClick={() => {
                  setPeriod(key)

                  setSelected(undefined)
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
        <div className="map-filters">
          {([
            ["payment", "결제"],

            ["photo", "사진"],

            ["event", "일정"],
          ] as const)

            .map(([key, text]) => (
              <Action
                className={cx("filter-chip", show[key] && "selected")}
                key={key}
                onClick={() => setShow({ ...show, [key]: !show[key] })}
              >
                {text}
              </Action>
            ))}
        </div>
        <div className="map-canvas">
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
                  points={points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  stroke="#0084FF"
                  strokeDasharray="5 5"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
            )}
          </svg>
          {zoneNames.map((zone) => (
            <span
              className="map-zone"
              key={zone}
              style={{
                left: `${PLACES[zone].x}%`,
                top: `${PLACES[zone].y + 7}%`,
              }}
            >
              {zone}
            </span>
          ))}
          {waypoints.map((point) => (
            <div
              className="map-waypoint"
              key={point.label}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <i aria-hidden="true" />
              <span>
                {point.label} · {point.detail}
              </span>
            </div>
          ))}
          {show.event &&
            evs.map((event) => (
              <Action
                className={cx(
                  "map-pin event",

                  selected?.kind === "event" &&
                    selected.id === event.id &&
                    "chosen",
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
          {show.photo &&
            pics.map((photo) => (
              <Action
                className={cx(
                  "map-pin photo",

                  selected?.kind === "photo" &&
                    selected.id === photo.id &&
                    "chosen",
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
          {show.payment &&
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
                  onClick={() =>
                    setSelected({ kind: "payment", id: payment.id })
                  }
                  style={{
                    left: `${pinPoint(payment.zone, payment.id).x}%`,

                    top: `${pinPoint(payment.zone, payment.id).y}%`,
                  }}
                >
                  {index + 1}
                </Action>
              )
            })}
          {pays.length + pics.length + evs.length === 0 && (
            <div className="map-empty">
              이 기간에는 지도에 표시할 기록이 없어요
            </div>
          )}
        </div>
        <div className="map-legend">
          <span>
            <i className="pay" /> 결제
          </span>
          <span>
            <i className="pay dashed" /> 근거 없는 결제
          </span>
          <span>
            <i className="photo" /> 사진
          </span>
          <span>
            <i className="event" /> 일정
          </span>
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
              </span>
              {chosenPayment.group && (
                <span className="map-preview-share">
                  내 몫{" "}
                  {won(
                    Math.round(
                      chosenPayment.amount / chosenPayment.group.length,
                    ),
                  )}
                </span>
              )}
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
        <div className="map-places">
          <p className="section-title">자주 간 장소</p>
          <div>
            {frequentPlaces(state).map(([place, count]) => (
              <span key={place}>
                {place} <b>{count}회</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
