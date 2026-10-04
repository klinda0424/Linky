import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  UT_TASKS,
  beginTask,
  clearLog,
  downloadText,
  endTask,
  eventCount,
  eventsCsv,
  logEvent,
  summaryCsv,
  type UTConfig,
  type UTMode,
  type UTTask,
} from "@/lib/ut"

export type UTPhase = "brief" | "running" | "complete" | "finished"

// MainApp이 받는 UT 연결부: 시작 상태, 성공 지점, 화면 기록
export type UTApi = {
  mode: UTMode
  milestone: (name: string) => void
  screen: (name: string) => void
}

export type UTSession = {
  config: UTConfig
  task: UTTask
  index: number
  phase: UTPhase
  result: "success" | "giveup"
  // 값이 바뀌면 MainApp을 새로 마운트해 초기 상태로 되돌림
  runKey: number
  toast: string
  facilitator: boolean
  // 이번 과제의 타이머가 이미 시작됐는지 (상황 카드를 다시 볼 때 구분)
  begun: boolean
  setFacilitator: (open: boolean) => void
  api: UTApi
  start: () => void
  reopenBrief: () => void
  giveUp: () => void
  rate: (score: number) => void
  jump: (index: number) => void
  restart: () => void
}

const DEAD_TOAST = "프로토타입에서 준비 중이에요"

export function useUTSession(config: UTConfig): UTSession {
  const [index, setIndex] = useState(config.startIndex)
  const [phase, setPhase] = useState<UTPhase>("brief")
  const [result, setResult] = useState<"success" | "giveup">("success")
  const [runKey, setRunKey] = useState(0)
  const [toast, setToast] = useState("")
  const [facilitator, setFacilitator] = useState(false)
  const [begun, setBegun] = useState(false)
  const phaseRef = useRef<UTPhase>("brief")
  const taskRef = useRef<UTTask>(UT_TASKS[config.startIndex])
  const task = UT_TASKS[index]
  taskRef.current = task
  const changePhase = useCallback((next: UTPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])
  const log = useCallback(
    (type: Parameters<typeof logEvent>[1], detail: string) =>
      logEvent(config.participant, type, detail),
    [config.participant],
  )

  const milestone = useCallback(
    (name: string) => {
      if (phaseRef.current !== "running") return
      log("milestone", name)
      if (taskRef.current.success.includes(name)) {
        log("complete", name)
        setResult("success")
        changePhase("complete")
      }
    },
    [changePhase, log],
  )
  const screen = useCallback(
    (name: string) => {
      if (phaseRef.current === "running") log("screen", name)
    },
    [log],
  )

  // 탭 기록: 반응하는 요소 = tap, 준비 중인 버튼 = dead, 아무것도 없는 곳 = miss
  useEffect(() => {
    if (!config.enabled || phase !== "running") return
    const phone = document.querySelector(".phone")
    if (!phone) return
    let timer = 0
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement
      if (target.closest("[data-ut-ignore]")) return
      const label = (
        target.closest("[role=button],button")?.textContent ||
        target.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 30)
      const live = target.closest(
        '[role=button]:not([data-dead]),button,input,[contenteditable="true"],a',
      )
      if (live) log("tap", label)
      else if (target.closest("[data-dead]")) {
        log("dead", label)
        setToast(DEAD_TOAST)
        window.clearTimeout(timer)
        timer = window.setTimeout(() => setToast(""), 1600)
      } else log("miss", target.className?.toString().slice(0, 30) ?? "")
    }
    phone.addEventListener("click", onClick, true)
    return () => {
      phone.removeEventListener("click", onClick, true)
      window.clearTimeout(timer)
    }
  }, [config.enabled, log, phase])

  // 진행자 단축키: Alt+Shift+U
  useEffect(() => {
    if (!config.enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === "u")
        setFacilitator((open) => !open)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [config.enabled])

  const start = () => {
    if (!begun) {
      beginTask(config.participant, taskRef.current.id)
      setBegun(true)
    }
    changePhase("running")
  }
  const goTo = (next: number) => {
    endTask()
    setBegun(false)
    setIndex(next)
    setRunKey((key) => key + 1)
    changePhase("brief")
  }
  const rate = (score: number) => {
    log("ease", String(score))
    if (index + 1 < UT_TASKS.length) goTo(index + 1)
    else {
      endTask()
      changePhase("finished")
    }
  }
  const giveUp = () => {
    log("giveup", "")
    setResult("giveup")
    changePhase("complete")
  }

  // 참조가 매 렌더마다 바뀌면 MainApp의 화면 기록 effect가 반복 실행되므로 고정
  const api = useMemo<UTApi>(
    () => ({ mode: task.mode, milestone, screen }),
    [milestone, screen, task.mode],
  )

  return {
    config,
    task,
    index,
    phase,
    result,
    runKey,
    toast,
    facilitator,
    begun,
    setFacilitator,
    api,
    start,
    // 상황 카드를 다시 볼 때는 타이머를 멈추지 않고 보기만 한다
    reopenBrief: () => changePhase("brief"),
    giveUp,
    rate,
    jump: goTo,
    restart: () => goTo(index),
  }
}

export function UTLayer({ session }: { session: UTSession }) {
  const { task, index, phase } = session
  const [taps, setTaps] = useState(0)
  const [copied, setCopied] = useState(false)
  const total = UT_TASKS.length
  // 다운로드가 막히는 앱 안 브라우저를 위해 요약을 복사해서 메시지로 보낼 수 있게 한다
  const copySummary = async () => {
    const text = summaryCsv(session.config.tone)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      window.prompt("아래 내용을 복사해서 보내 주세요", text)
    }
  }
  const openFacilitatorByTaps = () => {
    // 참가자 모르게 진행자 패널 열기: 칩을 빠르게 5번 탭
    const next = taps + 1
    setTaps(next)
    window.setTimeout(() => setTaps(0), 1500)
    if (next >= 5) {
      setTaps(0)
      session.setFacilitator(true)
    }
  }
  return (
    <div className="ut-layer" data-ut-ignore>
      {phase === "running" && (
        <div className="ut-chip">
          <span onClick={openFacilitatorByTaps}>
            {index + 1}/{total} · {task.id}
          </span>
          <button onClick={session.reopenBrief} type="button">
            상황 보기
          </button>
        </div>
      )}
      {session.toast && <div className="ut-toast">{session.toast}</div>}
      {phase === "brief" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <span className="ut-step">
              과제 {index + 1} / {total}
            </span>
            <strong>{task.label}</strong>
            {index === 0 && !session.begun && (
              <p className="ut-intro">
                화면은 실제 서비스처럼 눌러 볼 수 있어요. 막히면 편하게
                말씀해 주세요. 정답은 없어요.
              </p>
            )}
            <p className="ut-situation">{task.situation}</p>
            <button
              className="ut-primary"
              onClick={session.start}
              type="button"
            >
              {session.begun ? "계속하기" : "시작하기"}
            </button>
            {session.begun && (
              <button
                className="ut-secondary"
                onClick={() => {
                  if (window.confirm("이 과제를 그만할까요?")) session.giveUp()
                }}
                type="button"
              >
                이 과제 그만하기
              </button>
            )}
          </div>
        </div>
      )}
      {phase === "complete" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <span className="ut-step">
              과제 {index + 1} / {total}
            </span>
            <strong>
              {session.result === "success"
                ? "과제를 마쳤어요"
                : "여기까지 할게요"}
            </strong>
            <p className="ut-situation">
              방금 과제는 얼마나 쉬웠나요?
              <br />
              1 매우 어려움 ~ 5 매우 쉬움
            </p>
            <div className="ut-scale">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => session.rate(score)}
                  type="button"
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === "finished" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <strong>수고하셨어요!</strong>
            <p className="ut-situation">참여해 주셔서 감사합니다.</p>
            {session.config.share && (
              <>
                <p className="ut-intro">
                  마지막으로 아래 두 파일을 받아 진행자에게 보내 주세요. 이름·연락처
                  없이 어떤 버튼을 얼마나 눌렀는지만 담겨 있어요.
                </p>
                <button
                  className="ut-primary"
                  onClick={() =>
                    downloadText(
                      `ut-summary-${session.config.participant}.csv`,
                      summaryCsv(session.config.tone),
                    )
                  }
                  type="button"
                >
                  요약 파일 받기
                </button>
                <button
                  className="ut-secondary"
                  onClick={() =>
                    downloadText(
                      `ut-events-${session.config.participant}.csv`,
                      eventsCsv(),
                    )
                  }
                  type="button"
                >
                  상세 기록 파일 받기
                </button>
                <button
                  className="ut-secondary"
                  onClick={copySummary}
                  type="button"
                >
                  {copied
                    ? "복사했어요 · 메시지에 붙여넣기"
                    : "파일이 안 받아지면 내용 복사하기"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {session.facilitator && <FacilitatorPanel session={session} />}
    </div>
  )
}

function FacilitatorPanel({ session }: { session: UTSession }) {
  const { config } = session
  return (
    <div className="ut-backdrop ut-facilitator">
      <div className="ut-card">
        <strong>진행자 패널</strong>
        <p className="ut-situation">
          참가자 {config.participant} · 톤 {config.tone} · 기록{" "}
          {eventCount()}건
        </p>
        <div className="ut-jumps">
          {UT_TASKS.map((item, itemIndex) => (
            <button
              key={item.id}
              onClick={() => {
                session.jump(itemIndex)
                session.setFacilitator(false)
              }}
              type="button"
            >
              {item.id}
            </button>
          ))}
        </div>
        <button
          className="ut-secondary"
          onClick={() => {
            session.restart()
            session.setFacilitator(false)
          }}
          type="button"
        >
          현재 과제 처음부터
        </button>
        <button
          className="ut-secondary"
          onClick={() =>
            downloadText(`ut-events-${config.participant}.csv`, eventsCsv())
          }
          type="button"
        >
          이벤트 CSV 받기
        </button>
        <button
          className="ut-secondary"
          onClick={() =>
            downloadText(
              `ut-summary-${config.participant}.csv`,
              summaryCsv(config.tone),
            )
          }
          type="button"
        >
          요약 CSV 받기
        </button>
        <button
          className="ut-secondary"
          onClick={() => {
            if (window.confirm("저장된 UT 기록을 모두 지울까요?")) clearLog()
          }}
          type="button"
        >
          기록 삭제
        </button>
        <button
          className="ut-primary"
          onClick={() => session.setFacilitator(false)}
          type="button"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
