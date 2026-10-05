import { useState } from "react"
import { MainApp } from "@/MainApp"
import { StatusBar } from "@/components/common"
import {
  BasicInfo,
  ImportExpenses,
  Permissions,
  PrivacyNotice,
  RestoreResult,
  ToneSelection,
} from "@/screens/onboarding"
import { initialLedger } from "@/lib/ledger"
import { type PermissionKey, type ProfileDetails, type Tone } from "@/types"

// 온보딩 6단계 → 메인 앱. 온보딩에서 정한 값은 마이페이지에서 그대로 다시 바꿀 수 있다.
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
  const [tone, setTone] = useState<Tone>()
  const next = () => setStep((value) => value + 1)
  const back = () => setStep((value) => Math.max(1, value - 1))
  const toggle = (key: PermissionKey) =>
    setPermissions((value) => ({ ...value, [key]: !value[key] }))

  const onboarding = (() => {
    if (step === 1)
      return (
        <BasicInfo
          birthYear={profile.birthYear}
          job={profile.job}
          next={next}
          nickname={profile.nickname}
          setBirthYear={(birthYear) =>
            setProfile((value) => ({ ...value, birthYear }))
          }
          setJob={(job) => setProfile((value) => ({ ...value, job }))}
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
    if (step === 5)
      return (
        <RestoreResult
          back={back}
          next={next}
          state={{
            ...initialLedger,
            sources: {
              location: permissions.location,
              calendar: permissions.calendar,
              photos: permissions.photos,
            },
          }}
        />
      )
    if (step === 6)
      return <ToneSelection back={back} next={next} setTone={setTone} tone={tone} />
    return null
  })()

  return (
    <div className="app-shell">
      <div className="phone">
        <StatusBar />
        {step <= 6 ? (
          onboarding
        ) : (
          <MainApp
            permissions={permissions}
            profile={profile}
            setPermissions={setPermissions}
            setProfile={setProfile}
            setTone={setTone}
            tone={tone ?? "narrative"}
          />
        )}
      </div>
    </div>
  )
}
