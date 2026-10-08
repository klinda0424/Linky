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
  // UT: T3 이상 과제가 시작됐는데 아직 온보딩 중이면 메인 앱으로 보낸다
  // (T2 뒤 남은 온보딩 화면 위에 T3 안내가 뜨거나, 남은 온보딩 시간이 T3에 섞이지 않게)
  useEffect(() => {
    if (!utConfig.enabled || ut.index < 2) return
    // 온보딩 중 포기로 닉네임이 비었으면 '건너뛰기'처럼 목업 주인공 이름으로 채운다
    setProfile((value) => ({ ...value, nickname: value.nickname.trim() || "소연" }))
    setStep((value) => (value < 6 ? 6 : value))
  }, [utConfig.enabled, ut.index])
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
  const next = () => setStep((value) => value + 1)
  const back = () => setStep((value) => Math.max(1, value - 1))
  const toggle = (key: PermissionKey) =>
    setPermissions((value) => ({ ...value, [key]: !value[key] }))

  const onboarding = (() => {
    if (step === 1)
      return (
        <BasicInfo
          next={next}
          skipAll={() => {
            // 닉네임이 비어 있으면 목업 주인공 이름으로 채우고 바로 메인 앱으로
            setProfile((value) => ({ ...value, nickname: value.nickname.trim() || "소연" }))
            setStep(6)
          }}
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
