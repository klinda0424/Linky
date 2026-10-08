import { useEffect, useMemo, useState } from "react"
import { MainApp } from "@/MainApp"
import { StatusBar } from "@/components/common"
import { UTLayer, useUTSession } from "@/components/ut"
import { parseUT, utMilestone } from "@/lib/ut"
import {
  BasicInfo,
  ImportExpenses,
  Permissions,
  PrivacyNotice,
  Welcome,
} from "@/screens/onboarding"
import { type PermissionKey, type ProfileDetails } from "@/types"

// 온보딩 5단계 → 메인 앱. 하루 리포트는 서사형 하나로 보여 준다.
export default function App() {
  const utConfig = useMemo(() => parseUT(window.location.search), [])
  const ut = useUTSession(utConfig)
  const skipOnboarding = utConfig.enabled && utConfig.startIndex >= 2
  const [step, setStep] = useState(skipOnboarding ? 6 : 1)
  const [profile, setProfile] = useState<ProfileDetails>({
    nickname: "",
    birthYear: "1997",
    job: "",
  })
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    payment: true,
    calendar: true,
    photos: true,
    location: true,
  })
  // UT: 과제가 바뀔 때(다음 과제·진행자 점프) 그 과제를 시작할 화면으로 맞춘다
  // - T1: 온보딩 처음 / T2: 결제내역 불러오기(4단계)
  // - T3 이상: 아직 온보딩 중이면 메인 앱 (T2 뒤 남은 온보딩 위에 T3 안내가 뜨지 않게)
  useEffect(() => {
    if (!utConfig.enabled) return
    if (ut.index === 0) return setStep(1)
    if (ut.index === 1) return setStep(4)
    // 온보딩 중 포기로 닉네임이 비었으면 '건너뛰기'처럼 목업 주인공 이름으로 채운다
    setProfile((value) => ({ ...value, nickname: value.nickname.trim() || "소연" }))
    setStep((value) => (value < 6 ? 6 : value))
  }, [utConfig.enabled, ut.index, ut.runKey])
  const next = () => setStep((value) => value + 1)
  const back = () => setStep((value) => Math.max(1, value - 1))
  const toggle = (key: PermissionKey) =>
    setPermissions((value) => ({ ...value, [key]: !value[key] }))

  const onboarding = (() => {
    if (step === 1)
      return (
        <BasicInfo
          next={next}
          // UT 모드에서는 참가자가 온보딩 과제를 건너뛰지 않도록 버튼을 숨긴다
          skipAll={
            utConfig.enabled
              ? undefined
              : () => {
                  // 닉네임이 비어 있으면 목업 주인공 이름으로 채우고 바로 메인 앱으로
                  setProfile((value) => ({ ...value, nickname: value.nickname.trim() || "소연" }))
                  setStep(6)
                }
          }
          nickname={profile.nickname}
          setNickname={(nickname) =>
            setProfile((value) => ({ ...value, nickname }))
          }
        />
      )
    if (step === 2)
      return (
        <Permissions back={back} next={next} toggle={toggle} values={permissions} />
      )
    if (step === 3)
      return (
        <PrivacyNotice
          back={back}
          next={() => {
            utMilestone("t1_privacy", permissions.photos ? "photos_on" : "photos_off")
            next()
          }}
          toggle={toggle}
          values={permissions}
        />
      )
    if (step === 4)
      return (
        <ImportExpenses
          back={back}
          next={next}
          onImported={(requiredOnly) =>
            utMilestone("t2_terms", requiredOnly ? "required_only" : "with_optional")
          }
        />
      )
    if (step === 5) return <Welcome back={back} next={next} />
    return null
  })()

  return (
    <div className="app-shell">
      <div className="phone">
        <StatusBar />
        {step <= 5 ? (
          onboarding
        ) : (
          <MainApp
            key={utConfig.enabled ? ut.runKey : undefined}
            permissions={permissions}
            profile={profile}
            setPermissions={setPermissions}
            setProfile={setProfile}
            utTaskId={utConfig.enabled ? ut.task.id : undefined}
          />
        )}
        {utConfig.enabled && <UTLayer session={ut} />}
      </div>
    </div>
  )
}
