import { ArrowLeft } from "lucide-react"
import { Action } from "@/components/common"

export function MainHeader({
  title,
  back,
}: {
  title: string
  back?: () => void
}) {
  if (back)
    return (
      <div className="main-subheader">
        <Action className="main-back" onClick={back} label="뒤로 가기">
          <ArrowLeft size={20} strokeWidth={1.6} />
        </Action>
        <p>{title}</p>
        <span />
      </div>
    )
  return (
    <div className="main-simple-header">
      <p>{title}</p>
    </div>
  )
}
