// UT 전용 브랜치의 과제 정의와 로컬 기록. ?ut=1이 없으면 공개 함수는 무동작한다.
export type UTTask = {
  id: string
  label: string
  situation: string
  success: string[]
}

export const UT_TASKS: readonly UTTask[] = [
  {
    id: "T1",
    label: "개인정보 범위 설정",
    situation:
      "사진은 꼭 필요한 것만 쓰게 하고 싶어요. 앱을 시작하면서 설정해 보세요.",
    success: ["t1_privacy"],
  },
  {
    id: "T2",
    label: "필수 약관만 동의",
    situation:
      "카드 결제내역을 불러오려고 해요. 꼭 필요한 약관에만 동의하고 진행해 보세요.",
    success: ["t2_terms"],
  },
  {
    id: "T3",
    label: "결제 맥락 확인",
    situation:
      "오늘(10/31) 낮에 쓴 택시와 포토이즘 결제가 어디서 쓴 건지 확인하고, 맞으면 확인해 주세요.",
    success: ["t3_both_confirmed"],
  },
  {
    id: "T4",
    label: "그룹 지출 정산",
    situation:
      "오늘 저녁 고깃집은 동기 4명과 먹고 내가 냈어요. 내가 실제로 쓴 돈으로 정리해 주세요.",
    success: ["t4_settled", "t4_declined"],
  },
  {
    id: "T4B",
    label: "정산 인원 수정",
    situation:
      "과제 4를 끝내기 전에, 사실 한 명이 못 와서 3명이었다고 가정하고 인원을 바꿔 보세요. 건너뛰어도 돼요.",
    success: ["t4b_headcount3"],
  },
  {
    id: "T5",
    label: "송금 맥락 확인",
    situation:
      '어제(10/30) 밤 "김지은 18,000원"을 보냈는데 뭐였는지 기억이 안 나요. 앱에서 확인해 보세요.',
    success: ["t5_transfer_yes", "t5_transfer_no"],
  },
  {
    id: "T6",
    label: "앨범에서 기록 연결",
    situation:
      '10/30 낮 "(주)샐러디 선릉점"에는 기록이 없어요. 앨범에서 사진을 붙여 보세요.',
    success: ["t6_attached"],
  },
  {
    id: "T7",
    label: "동선 지도 확인",
    situation: "오늘 어디를 다녔는지 지도로 보고, 결제 핀을 하나 열어 보세요.",
    success: ["t7_pin_open"],
  },
  {
    id: "T8",
    label: "완료된 정산 확인",
    situation:
      "방금 정산한 고깃집이 정산 내역에서 어떻게 보이는지 확인해 보세요. 과제 4를 끝낸 뒤에만 진행해 주세요.",
    success: ["t8_settlement_list"],
  },
  {
    id: "T9",
    label: "다음 주 일정 확인",
    situation: "다음 주에 약속이 있는지 확인해 주세요.",
    success: ["t9_report_seen"],
  },
  {
    id: "T10",
    label: "장소 지출 검색",
    situation: "10~11월에 성수에서 쓴 돈을 찾아보세요.",
    success: ["t10_search_results"],
  },
]

export type UTConfig = {
  enabled: boolean
  participant: string
  startIndex: number
  share: boolean
}

const TASK_KEY = "linky-ut-task"
const LOG_KEY = "linky-ut-log"

export function parseUT(search: string): UTConfig {
  const params = new URLSearchParams(search)
  const enabled = params.get("ut") === "1"
  let participant = params.get("p") ?? ""
  try {
    participant ||= sessionStorage.getItem("linky-ut-p") ?? ""
  } catch {
    /* 저장 불가 환경 */
  }
  if (!participant) {
    participant = `P${Math.floor(1000 + Math.random() * 9000)}`
    try {
      sessionStorage.setItem("linky-ut-p", participant)
    } catch {
      /* 저장 불가 환경 */
    }
  }
  let taskId = params.get("task") ?? ""
  try {
    taskId ||= sessionStorage.getItem(`${TASK_KEY}-${participant}`) ?? ""
  } catch {
    /* 저장 불가 환경 */
  }
  const index = UT_TASKS.findIndex((task) => task.id === taskId)
  return {
    enabled,
    participant,
    startIndex: index >= 0 ? index : 0,
    share: params.get("share") !== "0",
  }
}

export type UTEventType = "start" | "screen" | "tap" | "miss" | "dead" | "milestone" | "complete" | "giveup" | "ease"
export type UTEvent = {
  participant: string
  task: string
  attempt: number
  type: UTEventType
  detail: string
  t: number
  at: string
}

const load = (): UTEvent[] => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]") as UTEvent[]
  } catch {
    return []
  }
}
let events = load()
let attempts = events.reduce((max, event) => Math.max(max, event.attempt), 0)
let current: { task: string; attempt: number; startedAt: number } | null = null
let milestoneBridge: ((name: string, detail: string) => void) | null = null
let screenBridge: ((name: string) => void) | null = null
const persist = () => {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(events))
  } catch {
    /* 메모리에만 유지 */
  }
}

export function setUTBridge(
  milestone: typeof milestoneBridge,
  screen: typeof screenBridge,
) {
  milestoneBridge = milestone
  screenBridge = screen
  return () => {
    if (milestoneBridge === milestone) milestoneBridge = null
    if (screenBridge === screen) screenBridge = null
  }
}
export const utMilestone = (name: string, detail = "") =>
  milestoneBridge?.(name, detail)
export const utScreen = (name: string) => screenBridge?.(name)

export function beginTask(participant: string, task: string) {
  attempts += 1
  current = { task, attempt: attempts, startedAt: Date.now() }
  logEvent(participant, "start", "")
}
export const endTask = () => {
  current = null
}
export function logEvent(
  participant: string,
  type: UTEventType,
  detail: string,
) {
  if (!current) return
  events.push({
    participant,
    task: current.task,
    attempt: current.attempt,
    type,
    detail: detail.slice(0, 120),
    t: Date.now() - current.startedAt,
    at: new Date().toISOString(),
  })
  persist()
}
export const eventCount = () => events.length
export function clearLog() {
  events = []
  attempts = 0
  persist()
}
export function rememberTask(participant: string, id: string) {
  try {
    sessionStorage.setItem(`${TASK_KEY}-${participant}`, id)
  } catch {
    /* 저장 불가 환경 */
  }
}

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`
export function eventsCsv() {
  const header = [
    "participant",
    "task",
    "attempt",
    "t_ms",
    "type",
    "detail",
    "at",
  ]
  return [
    header.join(","),
    ...events.map((event) =>
      [
        event.participant,
        event.task,
        event.attempt,
        event.t,
        event.type,
        event.detail,
        event.at,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n")
}
export function summaryCsv() {
  const header = [
    "participant",
    "task",
    "attempt",
    "result",
    "duration_s",
    "taps",
    "misses",
    "dead_taps",
    "screens",
    "ease_1to5",
  ]
  const groups = new Map<number, UTEvent[]>()
  events.forEach((event) =>
    groups.set(event.attempt, [...(groups.get(event.attempt) ?? []), event]),
  )
  const rows = [...groups.entries()].map(([attempt, list]) => {
    const count = (type: UTEventType) =>
      list.filter((event) => event.type === type).length
    const done = list.find(
      (event) => event.type === "complete" || event.type === "giveup",
    )
    const ease = list.find((event) => event.type === "ease")
    return [
      list[0].participant,
      list[0].task,
      attempt,
      done ? (done.type === "complete" ? "성공" : "포기") : "미완료",
      done ? (done.t / 1000).toFixed(1) : "",
      count("tap"),
      count("miss"),
      count("dead"),
      count("screen"),
      ease?.detail ?? "",
    ]
      .map(csvCell)
      .join(",")
  })
  return [header.join(","), ...rows].join("\n")
}
export function downloadText(filename: string, text: string) {
  const blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
