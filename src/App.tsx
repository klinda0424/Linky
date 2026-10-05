import { useState } from "react"
import { MainApp } from "@/MainApp"
import { StatusBar } from "@/components/common"
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
  const [step, setStep] = useState(1)
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
        <PrivacyNotice back={back} next={next} toggle={toggle} values={permissions} />
      )
    if (step === 4) return <ImportExpenses back={back} next={next} />
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
            permissions={permissions}
            profile={profile}
            setPermissions={setPermissions}
            setProfile={setProfile}
          />
        )}
      </div>
    </div>
  )
}
