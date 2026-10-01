import { useMemo, useState, type ReactNode } from "react"
import { MainApp } from "@/MainApp"
import { StatusBar } from "@/components/common"
import { UTLayer, useUTSession } from "@/components/ut"
import { parseUT } from "@/lib/ut"
import {
  AnalysisComplete,
  BasicInfo,
  CoachCarousel,
  Domains,
  Goals,
  Permissions,
  ToneSelection,
} from "@/screens/onboarding"
import { type DomainKey, type PermissionKey, type Tone } from "@/types"

export default function App() {
  // UT 모드(?ut=1)에서는 온보딩을 건너뛰고 과제 시작 상태로 바로 진입
  const utConfig = useMemo(() => parseUT(window.location.search), [])
  const ut = useUTSession(utConfig)
  const [step, setStep] = useState(utConfig.enabled ? 8 : 1)
  const [nickname, setNickname] = useState("")
  const [job, setJob] = useState("")
  const [goals, setGoals] = useState<string[]>([])
  const [domains, setDomains] = useState<Record<DomainKey, boolean>>({
    // 지출은 잠금(기본) 항목이라 ON 고정, 나머지 수집 동의는 모두 OFF로 시작
    spend: true,
    emotion: false,
    schedule: false,
    health: false,
    shopping: false,
  })
  const [healthToast, setHealthToast] = useState(true)
  const [permissions, setPermissions] =
    useState<Record<PermissionKey, boolean>>({
      // 카드·계좌는 필수(잠금) 항목이라 ON 고정, 나머지 연동은 모두 OFF로 시작
      payment: true,
      calendar: false,
      location: false,
      photos: false,
      health: false,
    })
  const [tone, setTone] = useState<Tone | undefined>(
    utConfig.enabled ? utConfig.tone : undefined,
  )
  const [slide, setSlide] = useState(0)
  const [nudge, setNudge] = useState(false)

  const next = () => setStep((current) => Math.min(8, current + 1))
  const back = () => setStep((current) => Math.max(1, current - 1))
  const toggleGoal = (goal: string) =>
    setGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal],
    )
  const toggleDomain = (key: DomainKey) => {
    setDomains((current) => ({ ...current, [key]: !current[key] }))
    if (key === "health" && !domains.health) setHealthToast(true)
  }
  const togglePermission = (key: PermissionKey) =>
    setPermissions((current) => ({ ...current, [key]: !current[key] }))

  let content: ReactNode
  if (step === 1)
    content = (
      <BasicInfo
        job={job}
        nickname={nickname}
        next={next}
        setJob={setJob}
        setNickname={setNickname}
      />
    )
  else if (step === 2)
    content = (
      <Goals back={back} next={next} selected={goals} toggle={toggleGoal} />
    )
  else if (step === 3)
    content = (
      <Domains
        closeToast={() => setHealthToast(false)}
        back={back}
        next={next}
        toast={healthToast}
        toggle={toggleDomain}
        values={domains}
      />
    )
  else if (step === 4)
    content = (
      <Permissions
        back={back}
        next={next}
        toggle={togglePermission}
        values={permissions}
      />
    )
  else if (step === 5) content = <AnalysisComplete back={back} next={next} />
  else if (step === 6)
    content = (
      <ToneSelection back={back} next={next} setTone={setTone} tone={tone} />
    )
  else if (step === 7)
    content = (
      <CoachCarousel
        back={back}
        finish={() => setStep(8)}
        nudge={nudge}
        setNudge={setNudge}
        setSlide={setSlide}
        slide={slide}
      />
    )
  else
    content = (
      <MainApp
        key={ut.runKey}
        goals={goals}
        nickname={nickname}
        nudge={nudge}
        setTone={setTone}
        tone={tone ?? "narrative"}
        ut={utConfig.enabled ? ut.api : undefined}
      />
    )

  return (
    <div className="app-shell">
      <div className="phone">
        <StatusBar />
        {content}
        {utConfig.enabled && <UTLayer session={ut} />}
      </div>
    </div>
  )
}
