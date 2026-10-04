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

// 핵심 시연 중 6개를 UT 과제로 사용한다.
// 입력 과제(U0-2 일정 등록, U5-1 기분 입력)로 "기록 1건 소요 시간"을 재고,
// 서사형/수치형 톤 비교는 사후 인터뷰로 옮겼으므로 U5-2(하루 리포트)는 과제에서 뺐다.
// (U5-2 화면·기능과 마일스톤 호출은 일반 시연 흐름에서 그대로 쓰인다.)
export const UT_TASKS: readonly UTTask[] = [
  {
    id: "U0-2",
    label: "시험기간 일정 등록",
    situation:
      "이번 학기 기말고사 일정을 앱에 등록하려고 해요. 학사일정 페이지 링크가 준비돼 있어요.",
    // 일정 미등록 상태(11/21)에서 시작
    mode: "confirm",
    // 링크 업로드 → 인식 확인 "맞아요" → 캘린더에 '시험기간' 태그 생성
    success: ["u02_exam"],
  },
  {
    id: "U3-1",
    label: "구매 항목 확인",
    situation:
      "시험 스트레스로 에이블리에서 옷을 샀어요. 어떻게 기록됐는지 확인하고 정리해 주세요.",
    mode: "exam",
    // 지출 상세에서 "옷장에 넣기"
    success: ["u31_closet"],
  },
  {
    id: "U5-1",
    label: "오늘 기분 남기기",
    situation: "지친 하루가 끝났어요. 오늘 기분을 남겨 주세요.",
    // 그날 기분 미기록 상태(12/12)에서 시작
    mode: "exam",
    // 기분 1개 선택 → 감정 보관함에 저장
    success: ["u51_mood"],
  },
  {
    id: "U6-1",
    label: "건강 알림 처리",
    situation:
      "병원에 다녀왔고 앱에 알림이 떠 있어요. 알아서 처리해 주세요.",
    mode: "exam",
    success: ["u61_agree", "u61_decline"],
  },
  {
    id: "U7-1",
    label: "항공권 결제 처리",
    situation:
      "친구들과 제주 항공권을 샀어요. 앱에서 확인하고 처리해 주세요.",
    mode: "prepare",
    success: ["u71_yes", "u71_no"],
  },
  {
    id: "U11-1",
    label: "지난 기록 찾기",
    situation:
      "여행 한 달 뒤예요. 그때 산 옷이 뭐였는지 앱에서 찾아 주세요.",
    mode: "monthLater",
    success: ["u111_results"],
  },
]

export type UTConfig = {
  enabled: boolean
  participant: string
  tone: Tone
  startIndex: number
  // 끝난 화면에서 참가자가 기록 파일을 직접 받게 할지 (원격 진행 기본값). 한 기기를 돌려 쓸 때는 &share=0
  share: boolean
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
    share: params.get("share") !== "0",
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
