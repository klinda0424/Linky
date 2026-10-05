import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Link2,
  MessageCircle,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Action, Badge, PageTitle, Toggle, cx } from "@/components/common"
import { MainHeader } from "@/components/layout"
import {
  birthYears,
  jobOptions,
  permissions as permissionOptions,
  ToneOptions,
} from "@/screens/onboarding"
import {
  type NotificationKey,
  type PermissionKey,
  type ProfileDetails,
  type Tone,
} from "@/types"

// ---------- 마이페이지 (탭) ----------
export function MyPage({
  name,
  openInfo,
  openConnections,
  openPrivacy,
  openSettlement,
  openTone,
  openNotifications,
}: {
  name: string
  openInfo: () => void
  openConnections: () => void
  openPrivacy: () => void
  openSettlement: () => void
  openTone: () => void
  openNotifications: () => void
}) {
  const items: Array<[string, ReactNode, () => void]> = [
    ["회원 정보", <UserRound size={18} strokeWidth={1.5} />, openInfo],
    ["연동 서비스 관리", <Link2 size={18} strokeWidth={1.5} />, openConnections],
    ["개인정보·권한", <ShieldCheck size={18} strokeWidth={1.5} />, openPrivacy],
    ["정산 내역", <Receipt size={18} strokeWidth={1.5} />, openSettlement],
    ["리포트 톤 설정", <MessageCircle size={18} strokeWidth={1.5} />, openTone],
    ["알림 설정", <Bell size={18} strokeWidth={1.5} />, openNotifications],
  ]
  return (
    <>
      <div className="main-simple-header">
        <p>마이페이지</p>
      </div>
      <div className="mypage-scroll">
        <div className="profile-top">
          <span>{name.slice(0, 1)}</span>
          <div>
            <strong>{name}</strong>
            <p>내 캘린더·사진·위치 기록으로 지출을 복원해요</p>
          </div>
        </div>
        <div className="profile-list">
          {items.map(([label, icon, onClick]) => (
            <Action className="profile-row" key={label} onClick={onClick}>
              <span>{icon}</span>
              <strong>{label}</strong>
              <ChevronRight size={17} strokeWidth={1.5} />
            </Action>
          ))}
        </div>
      </div>
    </>
  )
}

// ---------- 연동 서비스 관리 ----------
export function ConnectionSettings({
  values,
  toggle,
  back,
}: {
  values: Record<PermissionKey, boolean>
  toggle: (key: PermissionKey) => void
  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="연동 서비스 관리" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">연결 상태</p>
        <p className="settings-sub">필요한 서비스만 언제든 켜고 끌 수 있어요</p>
        <div className="list-cards permission-cards">
          {permissionOptions.map((item) => (
            <div className="list-card" key={item.key}>
              <span className="icon-box neutral">{item.icon}</span>
              <div className="list-copy">
                <div className="label-row">
                  <strong>
                    {item.title}
                    {item.parenthetical && (
                      <small> ({item.parenthetical})</small>
                    )}
                  </strong>
                  <Badge>{item.required ? "필수" : "선택"}</Badge>
                </div>
                <span>{values[item.key] ? "연결됨" : "연결 안 됨"}</span>
              </div>
              <Toggle
                locked={item.required}
                on={values[item.key]}
                onClick={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>
        <div className="settings-note">
          <Info size={15} strokeWidth={1.7} />
          <span>
            카드·계좌는 결제 목록을 만드는 필수 항목이라 해제할 수 없어요
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------- 개인정보·권한: 소스별 수집 범위, 개별 해제 ----------
export function PrivacySettings({
  values,
  toggle,
  back,
}: {
  values: Record<PermissionKey, boolean>
  toggle: (key: PermissionKey) => void
  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="개인정보·권한" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">소스별 수집 범위</p>
        <p className="settings-sub">
          수집한 기록은 기기 안에 암호화해 저장하고 서버로 보내지 않아요
        </p>
        <div className="privacy-list">
          {permissionOptions.map((item) => (
            <div className="main-card privacy-card" key={item.key}>
              <div className="privacy-head">
                <span className="icon-box neutral">{item.icon}</span>
                <strong>{item.title}</strong>
                <Toggle
                  locked={item.required}
                  on={values[item.key]}
                  onClick={() => toggle(item.key)}
                />
              </div>
              <dl>
                <div>
                  <dt>수집 항목</dt>
                  <dd>{item.collects}</dd>
                </div>
                <div>
                  <dt>목적</dt>
                  <dd>{item.purpose}</dd>
                </div>
                {item.scope && (
                  <div>
                    <dt>사용 범위</dt>
                    <dd className="privacy-scope">{item.scope}</dd>
                  </div>
                )}
              </dl>
              {!values[item.key] && (
                <p className="privacy-off">
                  수집을 해제했어요. 이 기록은 결제 근거에서 빠져요.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- 알림 설정 ----------
const notificationOptions: Array<{
  key: NotificationKey
  title: string
  description: string
}> = [
  {
    key: "restore",
    title: "복원 알림",
    description: "근거가 모여 미복원 결제를 채울 수 있으면 알려드려요",
  },
  {
    key: "report",
    title: "리포트 알림",
    description: "하루 리포트가 준비되면 알려드려요",
  },
  {
    key: "settlement",
    title: "정산 알림",
    description: "그룹 지출 입금이 확인되면 알려드려요",
  },
]

export function NotificationSettings({
  values,
  toggle,
  back,
}: {
  values: Record<NotificationKey, boolean>
  toggle: (key: NotificationKey) => void
  back: () => void
}) {
  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="알림 설정" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">받을 알림</p>
        <p className="settings-sub">필요한 알림만 조용히 전해드려요</p>
        <div className="list-cards notification-settings-list">
          {notificationOptions.map((item) => (
            <div className="list-card" key={item.key}>
              <span className="icon-box neutral">
                <FileText size={19} strokeWidth={1.5} />
              </span>
              <div className="list-copy">
                <div className="label-row">
                  <strong>{item.title}</strong>
                </div>
                <span>{item.description}</span>
              </div>
              <Toggle on={values[item.key]} onClick={() => toggle(item.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- 회원 정보 ----------
export function ProfileInfoSettings({
  value,

  save,

  back,
}: {
  value: ProfileDetails

  save: (value: ProfileDetails) => void

  back: () => void
}) {
  const [draft, setDraft] = useState(value)

  const valid = Boolean(draft.nickname.trim() && draft.birthYear && draft.job)

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="회원 정보" />
      <div className="sub-content profile-settings-content">
        <p className="sub-heading">기본 정보</p>
        <p className="settings-sub">
          온보딩에서 입력한 정보를 확인하고 바꿀 수 있어요
        </p>
        <div className="field">
          <p className="field-label">닉네임</p>
          <div className="text-field">
            <input
              aria-label="닉네임"
              maxLength={10}
              onChange={(event) => {
                const nickname = event.currentTarget.value

                setDraft((current) => ({ ...current, nickname }))
              }}
              placeholder="예: 지은이"
              value={draft.nickname}
            />
            <span>{draft.nickname.length}/10</span>
          </div>
        </div>
        <div className="field">
          <p className="field-label">출생연도</p>
          <div className="select-field">
            <select
              aria-label="출생연도"
              onChange={(event) => {
                const birthYear = event.currentTarget.value

                setDraft((current) => ({ ...current, birthYear }))
              }}
              value={draft.birthYear}
            >
              {birthYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <ChevronDown
              className="select-chevron"
              size={17}
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="field">
          <p className="field-label">직업 상태</p>
          <div className="job-grid">
            {jobOptions.map((item) => (
              <Action
                className={cx("choice-chip", draft.job === item && "selected")}
                key={item}
                onClick={() =>
                  setDraft((current) => ({ ...current, job: item }))
                }
              >
                {item}
              </Action>
            ))}
          </div>
        </div>
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          disabled={!valid}
          onClick={() => save({ ...draft, nickname: draft.nickname.trim() })}
        >
          저장
        </Action>
      </div>
    </div>
  )
}

// ---------- 리포트 톤 설정 ----------
export function ProfileTone({
  tone,

  setTone,

  back,
}: {
  tone: Tone

  setTone: (tone: Tone) => void

  back: () => void
}) {
  const [draft, setDraft] = useState<Tone>(tone)

  return (
    <div className="main-page sub-page">
      <MainHeader back={back} title="리포트 톤 설정" />
      <div className="sub-content tone-settings">
        <p className="sub-heading">어떤 방식이 더 편한가요?</p>
        <p className="settings-sub">다음 리포트부터 바로 반영해요</p>
        <ToneOptions setTone={setDraft} tone={draft} />
      </div>
      <div className="main-footer">
        <Action
          className="primary-button"
          onClick={() => {
            setTone(draft)

            back()
          }}
        >
          저장
        </Action>
      </div>
    </div>
  )
}
