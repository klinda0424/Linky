import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { ChevronLeft } from "lucide-react"

export const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ")
export function Action({
  children,
  className,
  onClick,
  disabled,
  label,
  style,
}: {
  children?: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  label?: string
  // 지도 핀처럼 위치를 직접 지정해야 하는 경우
  style?: CSSProperties
}) {
  const activate = () => {
    if (!disabled) onClick?.()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      activate()
    }
  }
  return (
    <div
      aria-disabled={disabled}
      aria-label={label}
      className={cx("action", className, disabled && "disabled")}
      style={style}
      onClick={activate}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  )
}
export function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="status-symbols">
        <span>●●●</span>
        <span>⌁</span>
        <i />
      </div>
    </div>
  )
}
// 온보딩 단계 수: 본인인증 → 권한 연동 → 개인정보 고지 → 결제내역 불러오기 → 일괄 복원 결과
const ONBOARDING_STEPS = 5

export function OnboardingHeader({
  step,
  onBack,
}: {
  step: number
  onBack?: () => void
}) {
  return (
    <div className="onboarding-header">
      <div className="brand">
        <span className="brand-mark">L</span>
        <span>Linky</span>
      </div>
      <div className="progress-row">
        {step > 1 ? (
          <Action className="back-button" onClick={onBack} label="이전 화면">
            <ChevronLeft size={17} strokeWidth={1.8} />
          </Action>
        ) : (
          <div className="back-placeholder" />
        )}
        <div className="progress-bars">
          {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
            <span className={index < step ? "complete" : ""} key={index} />
          ))}
        </div>
        <span className="step-count">
          {step}/{ONBOARDING_STEPS}
        </span>
      </div>
    </div>
  )
}
export function PageTitle({
  title,
  sub,
}: {
  title: string
  sub: string
}) {
  return (
    <div className="page-title">
      <p className="title">{title}</p>
      <p className="sub">{sub}</p>
    </div>
  )
}
export function Footer({
  caption,
  button,
  onNext,
  disabled,
  skip,
}: {
  caption?: string
  button: string
  onNext: () => void
  disabled?: boolean
  skip?: () => void
}) {
  return (
    <div className={cx("footer", !skip && "no-skip")}>
      {caption && <p className="footer-caption">{caption}</p>}
      <Action className="primary-button" disabled={disabled} onClick={onNext}>
        {button}
      </Action>
      {skip && (
        <Action className="skip-link" onClick={skip}>
          나중에 할게요
        </Action>
      )}
    </div>
  )
}
export function Toggle({
  on,
  locked,
  onClick,
}: {
  on: boolean
  locked?: boolean
  onClick?: () => void
}) {
  return (
    <Action
      className={cx("toggle", on && "on", locked && "locked")}
      disabled={locked}
      label={on ? "켜짐" : "꺼짐"}
      onClick={onClick}
    >
      <span />
    </Action>
  )
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>
}
export function Screen({
  step,
  children,
  onBack,
}: {
  step: number
  children: ReactNode
  onBack?: () => void
}) {
  return (
    <div className="screen">
      <OnboardingHeader onBack={onBack} step={step} />
      <main className="page-content">{children}</main>
    </div>
  )
}
export function EditableLine({
  value,
  setValue,
  placeholder,
}: {
  value: string
  setValue: (value: string) => void
  placeholder: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // key로 다시 마운트하면 입력할 때마다 커서가 맨 앞으로 튄다.
  // 칩 선택처럼 바깥에서 값이 바뀐 경우에만 DOM 텍스트를 맞춘다.
  useEffect(() => {
    const element = ref.current
    if (element && element.textContent !== value) element.textContent = value
  }, [value])
  return (
    <div
      className="main-input"
      contentEditable
      data-placeholder={placeholder}
      onInput={(event) => setValue(event.currentTarget.textContent || "")}
      // 한 줄 입력이라 Enter로 줄이 바뀌지 않게 한다
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault()
      }}
      ref={ref}
      role="textbox"
      suppressContentEditableWarning
    />
  )
}
export function PersonAvatar({
  name,
  size = "normal",
}: {
  name: "나" | "지은" | "민지" | "수진"
  size?: "normal" | "small"
}) {
  return (
    <span
      className={cx(
        "person-avatar",
        name === "나" && "me",
        name === "지은" && "su",
        name === "민지" && "min",
        name === "수진" && "jin",
        size === "small" && "small",
      )}
    >
      {name === "나" ? "나" : name.slice(0, 1)}
    </span>
  )
}
export function StatusChip({ type }: { type: "done" | "waiting" | "check" }) {
  return (
    <span className={cx("status-chip", type)}>
      {type === "done" ? "✓ 완료" : type === "waiting" ? "◷ 대기" : "확인 필요"}
    </span>
  )
}
