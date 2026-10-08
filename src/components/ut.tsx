import { useCallback, useEffect, useRef, useState } from "react"
import {
  beginTask,
  clearLog,
  downloadText,
  endTask,
  eventCount,
  eventsCsv,
  logEvent,
  rememberTask,
  setUTBridge,
  summaryCsv,
  UT_TASKS,
  type UTConfig,
  type UTTask,
} from "@/lib/ut"

type Phase = "brief" | "running" | "complete" | "finished"
export type UTSession = ReturnType<typeof useUTSession>

export function useUTSession(config: UTConfig) {
  const [index, setIndex] = useState(config.startIndex)
  const [phase, setPhase] = useState<Phase>("brief")
  const [result, setResult] = useState<"success" | "giveup">("success")
  const [runKey, setRunKey] = useState(0)
  const [toast, setToast] = useState("")
  const [facilitator, setFacilitator] = useState(false)
  const [begun, setBegun] = useState(false)
  const [ready, setReady] = useState(false)
  const phaseRef = useRef<Phase>("brief")
  const taskRef = useRef<UTTask>(UT_TASKS[config.startIndex])
  const task = UT_TASKS[index]
  taskRef.current = task
  const changePhase = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }
  const log = useCallback(
    (type: Parameters<typeof logEvent>[1], detail = "") =>
      logEvent(config.participant, type, detail),
    [config.participant],
  )
  const milestone = useCallback(
    (name: string, detail: string) => {
      if (phaseRef.current !== "running") return
      log("milestone", detail ? `${name}:${detail}` : name)
      if (taskRef.current.success.includes(name)) {
        if (["T7", "T8", "T9"].includes(taskRef.current.id)) setReady(true)
        else {
          log("complete", name)
          setResult("success")
          changePhase("complete")
        }
      }
    },
    [log],
  )
  const screen = useCallback(
    (name: string) => {
      if (phaseRef.current === "running") log("screen", name)
    },
    [log],
  )

  useEffect(
    () => (config.enabled ? setUTBridge(milestone, screen) : undefined),
    [config.enabled, milestone, screen],
  )
  useEffect(() => {
    if (!config.enabled || phase !== "running") return
    const phone = document.querySelector(".phone")
    if (!phone) return
    let timer = 0
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement
      if (target.closest("[data-ut-ignore]")) return
      const actionable = target.closest(
        'button,[role="button"],input,a,[contenteditable="true"]',
      )
      const label = (actionable?.textContent || target.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40)
      if (target.closest('[data-dead],[aria-disabled="true"]')) {
        log("dead", label)
        setToast("프로토타입에서 준비 중이에요")
        window.clearTimeout(timer)
        timer = window.setTimeout(() => setToast(""), 1600)
      } else if (actionable) log("tap", label)
      else log("miss", target.className?.toString().slice(0, 40) ?? "")
    }
    phone.addEventListener("click", onClick, true)
    return () => {
      phone.removeEventListener("click", onClick, true)
      window.clearTimeout(timer)
    }
  }, [config.enabled, log, phase])
  useEffect(() => {
    if (!config.enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === "u")
        setFacilitator((open) => !open)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [config.enabled])

  const goTo = (next: number) => {
    endTask()
    const bounded = Math.max(0, Math.min(UT_TASKS.length - 1, next))
    rememberTask(config.participant, UT_TASKS[bounded].id)
    const url = new URL(window.location.href)
    url.searchParams.set("task", UT_TASKS[bounded].id)
    window.history.replaceState(null, "", url)
    setIndex(bounded)
    setRunKey((key) => key + 1)
    setBegun(false)
    setReady(false)
    changePhase("brief")
  }
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
    ready,
    setFacilitator,
    start: () => {
      if (!begun) {
        beginTask(config.participant, task.id)
        setBegun(true)
      }
      changePhase("running")
    },
    reopenBrief: () => changePhase("brief"),
    resume: () => changePhase("running"),
    giveUp: () => {
      log("giveup")
      setResult("giveup")
      changePhase("complete")
    },
    completeObserved: () => {
      log("complete", "participant_done")
      setResult("success")
      changePhase("complete")
    },
    rate: (score: number) => {
      log("ease", String(score))
      if (index + 1 < UT_TASKS.length) goTo(index + 1)
      else {
        endTask()
        changePhase("finished")
      }
    },
    jump: goTo,
  }
}

export function UTLayer({ session }: { session: UTSession }) {
  const [chipTaps, setChipTaps] = useState(0)
  const [copied, setCopied] = useState(false)
  // 끝난 화면: 두 파일 모두 받아야 해서 각각 받았는지 표시한다
  const [saved, setSaved] = useState({ summary: false, events: false })
  const openFacilitator = () => {
    const next = chipTaps + 1
    setChipTaps(next)
    window.setTimeout(() => setChipTaps(0), 1500)
    if (next >= 5) {
      setChipTaps(0)
      session.setFacilitator(true)
    }
  }
  const saveSummary = () => {
    downloadText(`ut-summary-${session.config.participant}.csv`, summaryCsv())
    setSaved((value) => ({ ...value, summary: true }))
  }
  const saveEvents = () => {
    downloadText(`ut-events-${session.config.participant}.csv`, eventsCsv())
    setSaved((value) => ({ ...value, events: true }))
  }
  // 파일이 안 받아질 때: 두 기록을 한 번에 복사해 구글폼에 붙여넣게 한다
  const copy = async () => {
    const text = `[요약 기록 ut-summary]\n${summaryCsv()}\n\n[상세 기록 ut-events]\n${eventsCsv()}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      window.prompt("아래 내용을 복사해 주세요", text)
    }
  }
  return (
    <div className="ut-layer" data-ut-ignore>
      {session.phase === "running" && (
        <div className="ut-chip">
          <button onClick={openFacilitator}>
            {session.index + 1}/{UT_TASKS.length} · {session.task.id}
          </button>
          <button onClick={session.reopenBrief}>상황 보기</button>
          {session.ready && (
            <button onClick={session.completeObserved}>다 했어요</button>
          )}
          <button onClick={session.giveUp}>못 하겠어요</button>
        </div>
      )}
      {session.toast && <div className="ut-toast">{session.toast}</div>}
      {session.phase === "brief" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <span className="ut-step">
              과제 {session.index + 1} / {UT_TASKS.length}
            </span>
            <strong>{session.task.label}</strong>
            {session.index === 0 && !session.begun && (
              <p className="ut-intro">
                화면은 실제 서비스처럼 눌러 볼 수 있어요. 막히면 편하게 말씀해
                주세요. 정답은 없어요.
              </p>
            )}
            <p className="ut-situation">{session.task.situation}</p>
            <button className="ut-primary" onClick={session.start}>
              {session.begun ? "계속하기" : "시작하기"}
            </button>
            {session.begun && (
              <button className="ut-secondary" onClick={session.giveUp}>
                못 하겠어요
              </button>
            )}
          </div>
        </div>
      )}
      {session.phase === "complete" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <span className="ut-step">
              과제 {session.index + 1} / {UT_TASKS.length}
            </span>
            <strong>
              {session.result === "success"
                ? "과제를 마쳤어요"
                : "여기까지 할게요"}
            </strong>
            <p className="ut-situation">
              방금 과제는 얼마나 쉬웠나요?
              <br />1 매우 어려움 ~ 5 매우 쉬움
            </p>
            <div className="ut-scale">
              {[1, 2, 3, 4, 5].map((score) => (
                <button key={score} onClick={() => session.rate(score)}>
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {session.phase === "finished" && (
        <div className="ut-backdrop">
          <div className="ut-card">
            <strong>수고하셨어요!</strong>
            <p className="ut-situation">참여해 주셔서 감사합니다.</p>
            {/* 주소에 p가 없으면 자동 번호라 참가자가 모른다 → 제출 폼에 적을 번호를 크게 보여 준다 */}
            <div className="ut-pid">
              <span>내 참가자 번호</span>
              <b>{session.config.participant}</b>
              <small>제출 폼의 '참가자 번호' 칸에 이 번호를 적어 주세요</small>
            </div>
            {session.config.share && (
              <>
                <p className="ut-intro">
                  이름·연락처 없이 화면 조작 기록만 담긴 파일 2개를 모두 받아 보내 주세요.
                </p>
                <button
                  className={saved.summary ? "ut-secondary ut-saved" : "ut-primary"}
                  onClick={saveSummary}
                >
                  {saved.summary ? "✓ 1. 요약 파일 받았어요" : "1. 요약 파일 받기"}
                </button>
                <button
                  className={saved.events ? "ut-secondary ut-saved" : "ut-primary"}
                  onClick={saveEvents}
                >
                  {saved.events ? "✓ 2. 상세 기록 파일 받았어요" : "2. 상세 기록 파일 받기"}
                </button>
                <button className="ut-secondary" onClick={copy}>
                  {copied ? "두 기록을 복사했어요" : "파일이 안 받아지면 두 기록 한 번에 복사하기"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {session.facilitator && (
        <div className="ut-backdrop ut-facilitator">
          <div className="ut-card">
            <strong>진행자 패널</strong>
            <p className="ut-intro">
              {session.config.participant} · 기록 {eventCount()}건
            </p>
            <div className="ut-jumps">
              {UT_TASKS.map((task, index) => (
                <button
                  key={task.id}
                  onClick={() => {
                    session.jump(index)
                    session.setFacilitator(false)
                  }}
                >
                  {task.id}
                </button>
              ))}
            </div>
            <button
              className="ut-secondary"
              onClick={() => {
                clearLog()
                session.setFacilitator(false)
              }}
            >
              기록 지우기
            </button>
            <button
              className="ut-secondary"
              onClick={() => session.setFacilitator(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
