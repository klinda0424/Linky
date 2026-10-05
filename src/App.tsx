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
import { type PermissionKey, type ProfileDetails, type Tone } from "@/types"

// 온보딩 5단계 → 메인 앱. 하루 리포트는 서사형으로 시작한다. 온보딩에서 정한 값은 마이페이지에서 그대로 다시 바꿀 수 있다.
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
  const [tone, setTone] = useState<Tone>("narrative")
  const next = () => setStep((value) => value + 1)
  const back = () => setStep((value) => Math.max(1, value - 1))
  const toggle = (key: PermissionKey) =>
    setPermissions((value) => ({ ...value, [key]: !value[key] }))

  const onboarding = (() => {
    if (step === 1)
      return (
        <BasicInfo
          next={next}
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
            setTone={setTone}
            tone={tone}
          />
        )}
      </div>
    </div>
  )
}
