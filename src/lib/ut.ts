// 사용성 테스트(UT) 모드: 과제 정의, 자동 기록, CSV 내보내기.
// 서버 없이 localStorage에만 저장한다. 주소에 ?ut=1 이 있을 때만 켜진다.
import { type Tone } from "@/types"

export type UTMode =
  | "confirm"
  | "exam"
  | "prepare"
  | "travel"
  | "after"
  | "monthLater"

export type UTTask = {
  id: string
  label: string
  // 참가자에게 읽어 줄 상황 (버튼 이름을 알려 주지 않는다)
  situation: string
  mode: UTMode
  // 이 이름의 이정표가 찍히면 과제 성공
  success: string[]
}

// 핵심 시연 중 5개만 UT 과제로 사용
export const UT_TASKS: readonly UTTask[] = [
  {
    id: "U3-1",
    label: "구매 항목 확인",
    situation:
      "12월 12일 밤이에요. 시험 스트레스로 옷을 여러 벌 샀어요. 그중 에이블리에서 결제한 건이 앱에 어떻게 기록됐는지 확인하고, 옷장에 정리해 보세요.",
    mode: "exam",
    success: ["u31_closet"],
  },
  {
    id: "U5-2",
    label: "하루 돌아보기",
    situation:
      "시험 공부로 지친 날 밤이에요. 오늘 하루를 앱에서 돌아보세요.",
    mode: "exam",
    success: ["u52_nudge_yes", "u52_nudge_no"],
  },
  {
    id: "U6-1",
    label: "건강 알림 처리",
    situation:
      "오늘 병원에서 수액을 맞고 왔어요. 앱에 알림이 떠 있어요. 알아서 처리해 보세요.",
    mode: "exam",
    success: ["u61_agree", "u61_decline"],
  },
  {
    id: "U7-1",
    label: "항공권 결제 처리",
    situation:
      "12월 20일이에요. 친구들과 제주 항공권을 샀어요. 앱에서 이 결제가 어떻게 보이는지 확인하고 처리해 보세요.",
    mode: "prepare",
    success: ["u71_yes", "u71_no"],
  },
  {
    id: "U11-1",
    label: "지난 기록 찾기",
    situation:
      "제주 여행을 다녀온 지 한 달이 지났어요. 그때 입으려고 샀던 옷이 뭐였는지 앱에서 찾아보세요.",
    mode: "monthLater",
    success: ["u111_results"],
  },
]

export type UTConfig = {
  enabled: boolean
  participant: string
  tone: Tone
  startIndex: number
}

export function parseUT(search: string): UTConfig {
  const params = new URLSearchParams(search)
  const enabled = params.get("ut") === "1"
  const toneParam = params.get("tone")
  const taskParam = params.get("task")
  const index = UT_TASKS.findIndex((task) => task.id === taskParam)
  let participant = params.get("p") ?? ""
  if (!participant) {
    try {
      participant = sessionStorage.getItem("linky-ut-p") ?? ""
    } catch {
      participant = ""
    }
  }
  if (!participant) {
    participant = `P${Math.floor(1000 + Math.random() * 9000)}`
    try {
      sessionStorage.setItem("linky-ut-p", participant)
    } catch {
      // 저장 불가 환경에서는 새로고침 시 번호가 바뀔 수 있음
    }
  }
  return {
    enabled,
    participant,
    tone: toneParam === "numeric" ? "numeric" : "narrative",
    startIndex: index >= 0 ? index : 0,
  }
}

export type UTEventType =
  | "start"
  | "screen"
  | "tap"
  | "miss"
  | "dead"
  | "milestone"
  | "complete"
  | "giveup"
  | "ease"

export type UTEvent = {
  participant: string
  task: string
  attempt: number
  type: UTEventType
  detail: string
  // 과제 시작 후 경과(ms)
  t: number
  at: string
}

const STORAGE_KEY = "linky-ut-log"

function load(): UTEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UTEvent[]) : []
  } catch {
    return []
  }
}

let events: UTEvent[] = load()
let attempts = events.reduce((max, event) => Math.max(max, event.attempt), 0)
let current: { task: string; attempt: number; startedAt: number } | null = null

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // 저장 실패 시 메모리 기록만 유지
  }
}

export function beginTask(participant: string, task: string) {
  attempts += 1
  current = { task, attempt: attempts, startedAt: Date.now() }
  logEvent(participant, "start", "")
}

export function endTask() {
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
    detail: detail.slice(0, 60),
    t: Date.now() - current.startedAt,
    at: new Date().toISOString(),
  })
  persist()
}

export function clearLog() {
  events = []
  attempts = 0
  persist()
}

export const eventCount = () => events.length

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`

export function eventsCsv(): string {
  const header = ["participant", "task", "attempt", "t_ms", "type", "detail", "at"]
  const rows = events.map((event) =>
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
  )
  return [header.join(","), ...rows].join("\n")
}

export function summaryCsv(tone: Tone): string {
  const header = [
    "participant",
    "task",
    "attempt",
    "tone",
    "result",
    "duration_s",
    "taps",
    "misses",
    "dead_taps",
    "screens",
    "ease_1to5",
  ]
  const groups = new Map<number, UTEvent[]>()
  for (const event of events) {
    groups.set(event.attempt, [...(groups.get(event.attempt) ?? []), event])
  }
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
      tone,
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
  // 엑셀에서 한글이 깨지지 않도록 BOM 추가
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
