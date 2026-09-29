import { type KeyboardEvent, type ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

export const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ")
export function Action({
  children,
  className,
  onClick,
  disabled,
  label,
}: {
  children?: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  label?: string
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
          {Array.from({ length: 7 }, (_, index) => (
            <span className={index < step ? "complete" : ""} key={index} />
          ))}
        </div>
        <span className="step-count">{step}/7</span>
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
  return (
    <div
      className="main-input"
      contentEditable
      data-placeholder={placeholder}
      key={value}
      onInput={(event) => setValue(event.currentTarget.textContent || "")}
      role="textbox"
      suppressContentEditableWarning
    >
      {value}
    </div>
  )
}
export function PersonAvatar({
  name,
  size = "normal",
}: {
  name: "나" | "수현" | "민지"
  size?: "normal" | "small"
}) {
  return (
    <span
      className={cx(
        "person-avatar",
        name === "나" && "me",
        name === "수현" && "su",
        name === "민지" && "min",
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
