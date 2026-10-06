import { useMemo, useState } from "react"
import { UserRound } from "lucide-react"
import { Action } from "@/components/common"
import { BottomTabs } from "@/components/layout"
import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Photo,
  type YMD,
  TODAY,
  initialLedger,
  payments,
  transferGuess,
} from "@/lib/ledger"
import { AlbumTab, EventReport, PhotoDetail } from "@/screens/album"
import { CalendarHome, DayPanel } from "@/screens/calendar"
import { HomePage } from "@/screens/home"
import { ReportTab } from "@/screens/report"
import { meeting, summarize } from "@/lib/settlement"
import { MapTab } from "@/screens/map"
import {
  ConnectionSettings,
  MyPage,
  NotificationSettings,
  PrivacySettings,
  ProfileInfoSettings,
} from "@/screens/profile"
import { AlbumPicker, addedPhotoText } from "@/screens/record"
import { SearchScreen } from "@/screens/search"
import { TransferConfirm } from "@/screens/transfer"
import {
  GroupSplitSheet,
  SettlementConfirm,
  SettlementEdit,
  SettlementInbox,
  SettlementList,
  SettlementResult,
  SettlementTable,
} from "@/screens/settlement"
import {
  type MainTab,
  type MainView,
  type NotificationKey,
  type PermissionKey,
  type ProfileDetails,
} from "@/types"

export function MainApp({
  profile,
  setProfile,
  permissions,
  setPermissions,
}: {
  profile: ProfileDetails
  setProfile: (value: ProfileDetails) => void
  permissions: Record<PermissionKey, boolean>
  setPermissions: (
    update: (value: Record<PermissionKey, boolean>) => Record<PermissionKey, boolean>,
  ) => void
}) {
  const [tab, setTab] = useState<MainTab>("home")
  const [view, setView] = useState<MainView>("tabs")
  const [ledger, setLedger] = useState<LedgerState>(initialLedger)
  // 날짜 시트: 캘린더 탭 위에 열린다. 지도 핀·검색에서 넘어오면 해당 결제를 강조한다.
  const [sheetDay, setSheetDay] = useState<YMD>()
  const [focusPayment, setFocusPayment] = useState<string>()
  const [mapDay, setMapDay] = useState<YMD>()
  const [mapPeriod, setMapPeriod] = useState<"day" | "month">("day")
  const [returnToMonth, setReturnToMonth] = useState<YMD>()
  const [recordTarget, setRecordTarget] = useState<string>()
  const [splitting, setSplitting] = useState<Payment>()
  // 링키가 찾았어요: 확인 중인 송금
  const [transferId, setTransferId] = useState<string>()
  const [photo, setPhoto] = useState<Photo>()
  const [event, setEvent] = useState<CalEvent>()
  const [excluded, setExcluded] = useState<string[]>([])
  const [matched, setMatched] = useState(false)
  const [settled, setSettled] = useState(false)
  // 정산 대기함은 홈 알림과 리포트 > 정산 내역 양쪽에서 열리므로 어디서 왔는지 기억한다
  const [inboxFromHome, setInboxFromHome] = useState(false)
  const [notifications, setNotifications] = useState<
    Record<NotificationKey, boolean>
  >({ restore: true, report: true, settlement: true })

  // 연동을 끈 소스는 근거 계산에서 빠진다
  const state = useMemo<LedgerState>(
    () => ({
      ...ledger,
      sources: {
        location: permissions.location,
        calendar: permissions.calendar,
        photos: permissions.photos,
      },
    }),
    [ledger, permissions],
  )
  // 그룹 결제 확인의 "아니요, 개인 지출"이 가리키는 결제
  const meetingId = meeting?.id
  const toTabs = () => setView("tabs")
  // 맥락을 찾았지만 아직 맞아요/아니에요를 누르지 않은 송금 (홈 알림)
  const foundTransfer = payments.find(
    (item) =>
      item.kind === "transfer" &&
      !state.transferMatched.includes(item.id) &&
      !(state.transferDeclined ?? []).includes(item.id) &&
      transferGuess(item, state) !== null,
  )
  const foundGuess = foundTransfer ? transferGuess(foundTransfer, state) : null
  const transferPayment = payments.find((item) => item.id === transferId)
  const confirmTransfer = (payment: Payment) => {
    setLedger((value) => ({
      ...value,
      transferMatched: [...value.transferMatched, payment.id],
    }))
    // 재분류된 결과를 지출 내역(날짜 시트)에서 바로 보여 준다
    openPayment(payment)
  }
  const declineTransfer = (payment: Payment) => {
    setLedger((value) => ({
      ...value,
      transferDeclined: [...(value.transferDeclined ?? []), payment.id],
    }))
    toTabs()
  }
  const recordPayment = payments.find((item) => item.id === recordTarget)

  const openPayment = (payment: Payment, monthContext?: YMD) => {
    setReturnToMonth(monthContext)
    setTab("calendar")
    setView("tabs")
    setSheetDay(payment.date)
    setFocusPayment(payment.id)
  }
  const unlink = (paymentId: string, key: string) =>
    setLedger((value) => ({
      ...value,
      unlinked: {
        ...value.unlinked,
        [paymentId]: [...(value.unlinked[paymentId] ?? []), key],
      },
    }))
  // text가 있으면 캡처에서 인식한 문구(예: "블라우스 1벌")를 근거로 붙인다
  const unlinkPhoto = (id: string) =>
    setLedger((value) => ({
      ...value,
      photoUnlinked: value.photoUnlinked.includes(id)
        ? value.photoUnlinked
        : [...value.photoUnlinked, id],
    }))
  const relink = (paymentId: string, key: string) =>
    setLedger((value) => ({
      ...value,
      unlinked: {
        ...value.unlinked,
        [paymentId]: (value.unlinked[paymentId] ?? []).filter((item) => item !== key),
      },
    }))
  const relinkPhoto = (id: string) =>
    setLedger((value) => ({
      ...value,
      photoUnlinked: value.photoUnlinked.filter((item) => item !== id),
    }))
  const verify = (paymentId: string) =>
    setLedger((value) => ({
      ...value,
      verified: [...(value.verified ?? []), paymentId],
    }))
  const confirmRestore = (paymentId: string) =>
    setLedger((value) => ({
      ...value,
      restoreConfirmed: [...value.restoreConfirmed, paymentId],
    }))
  const markPersonal = (paymentId: string) =>
    setLedger((value) => ({
      ...value,
      personal: [...(value.personal ?? []), paymentId],
    }))
  const attach = (paymentId: string, text?: string) => {
    setLedger((value) => {
      const current = value.added[paymentId] ?? []
      return {
        ...value,
        added: {
          ...value.added,
          [paymentId]: [
            ...current,
            { kind: "added", text: text ?? addedPhotoText },
          ],
        },
      }
    })
    setView("tabs")
    setRecordTarget(undefined)
  }
  const openRecord = (paymentId?: string) => {
    setRecordTarget(paymentId)
  }

  // 홈에서 날짜·결제를 누르면 캘린더 탭의 날짜 시트로 이어진다
  const openDayInCalendar = (day: YMD) => {
    setFocusPayment(undefined)
    setSheetDay(day)
    setTab("calendar")
  }

  const tabScreen = () => {
    if (tab === "home")
      return (
        <HomePage
          openAlbum={() => setTab("album")}
          openDay={openDayInCalendar}
          openMap={() => {
            setMapDay(TODAY)
            setMapPeriod("day")
            setTab("map")
          }}
          openPhoto={(item) => {
            setPhoto(item)
            setView("photo")
          }}
          openSettlement={() => {
            setInboxFromHome(true)
            setView("settlement")
          }}
          foundTransfer={
            foundTransfer && foundGuess
              ? { payment: foundTransfer, guess: foundGuess }
              : undefined
          }
          openTransfer={() => {
            setTransferId(foundTransfer?.id)
            setView("transfer")
          }}
          pendingSettlement={
            settled || Boolean(meetingId && (state.personal ?? []).includes(meetingId))
              ? undefined
              : (() => {
                  const pending = summarize(excluded)
                  return pending.items.length > 0
                    ? { count: pending.items.length, total: pending.total }
                    : undefined
                })()
          }
          openPayment={(payment) => openPayment(payment)}
          openProfile={() => setView("profile")}
          openSearch={() => setView("search")}
          state={state}
        />
      )
    if (tab === "calendar")
      return (
        <CalendarHome
          openDay={(day) => {
            setFocusPayment(undefined)
            setSheetDay(day)
          }}
          detail={
            <DayPanel
              back={() => {
                setSheetDay(undefined)
                setFocusPayment(undefined)
                if (returnToMonth) {
                  setMapDay(returnToMonth)
                  setMapPeriod("month")
                  setReturnToMonth(undefined)
                  setTab("map")
                }
              }}
              canReturn={Boolean(returnToMonth)}
              confirmRestore={confirmRestore}
              day={sheetDay ?? TODAY}
              focusPayment={focusPayment}
              markPersonal={markPersonal}
              openRecord={openRecord}
              openSplit={setSplitting}
              relink={relink}
              relinkPhoto={relinkPhoto}
              showMap={(day) => {
                setSheetDay(undefined)
                setMapDay(day)
                setMapPeriod("day")
                setReturnToMonth(undefined)
                setTab("map")
              }}
              state={state}
              unlink={unlink}
              unlinkPhoto={unlinkPhoto}
              verify={verify}
            />
          }
          openProfile={() => setView("profile")}
          openSearch={() => setView("search")}
          sheetDay={sheetDay}
          state={state}
        />
      )
    if (tab === "map")
      return (
        <MapTab
          initialDay={mapDay}
          initialPeriod={mapPeriod}
          key={mapDay ? `${mapPeriod}-${mapDay.y}-${mapDay.m}-${mapDay.d}` : "all"}
          openPayment={openPayment}
          state={state}
        />
      )
    if (tab === "album")
      return (
        <AlbumTab
          openEvent={(item) => {
            setEvent(item)
            setView("eventReport")
          }}
          openPhoto={(item) => {
            setPhoto(item)
            setView("photo")
          }}
          state={state}
        />
      )
    if (tab === "report")
      return (
        <ReportTab
          openSettlement={() => setView("settlementList")}
          state={state}
        />
      )
    return null
  }

  const fullScreen = () => {
    switch (view) {
      case "search":
        return (
          <SearchScreen
            back={toTabs}
            openPayment={openPayment}
            state={state}
          />
        )
      case "photo":
        return photo ? (
          <PhotoDetail
            back={toTabs}
            openPayment={openPayment}
            photo={photo}
            state={state}
            unlink={(id) =>
              setLedger((value) => ({
                ...value,
                photoUnlinked: [...value.photoUnlinked, id],
              }))
            }
          />
        ) : null
      case "eventReport":
        return event ? (
          <EventReport
            back={toTabs}
            event={event}
            openPayment={openPayment}
            state={state}
          />
        ) : null
      case "profile":
        return (
          <MyPage
            back={toTabs}
            name={profile.nickname || "소연"}
            openConnections={() => setView("connections")}
            openInfo={() => setView("profileInfo")}
            openNotifications={() => setView("notifications")}
            openPrivacy={() => setView("privacy")}
          />
        )
      case "profileInfo":
        return (
          <ProfileInfoSettings
            back={() => setView("profile")}
            save={(value) => {
              setProfile(value)
              setView("profile")
            }}
            value={profile}
          />
        )
      case "connections":
        return (
          <ConnectionSettings
            back={() => setView("profile")}
            toggle={(key) =>
              setPermissions((value) => ({ ...value, [key]: !value[key] }))
            }
            values={permissions}
          />
        )
      case "privacy":
        return (
          <PrivacySettings
            back={() => setView("profile")}
            toggle={(key) =>
              setPermissions((value) => ({ ...value, [key]: !value[key] }))
            }
            values={permissions}
          />
        )
      case "notifications":
        return (
          <NotificationSettings
            back={() => setView("profile")}
            toggle={(key) =>
              setNotifications((value) => ({ ...value, [key]: !value[key] }))
            }
            values={notifications}
          />
        )
      case "transfer":
        return transferPayment ? (
          <TransferConfirm
            back={toTabs}
            confirm={() => confirmTransfer(transferPayment)}
            decline={() => declineTransfer(transferPayment)}
            payment={transferPayment}
            state={state}
          />
        ) : null
      case "settlementList":
        return (
          <SettlementList
            back={toTabs}
            completed={settled}
            open={() => {
              setInboxFromHome(false)
              setView("settlement")
            }}
            state={state}
          />
        )
      case "settlement":
        return (
          <SettlementInbox
            back={() => (inboxFromHome ? toTabs() : setView("settlementList"))}
            excluded={excluded}
            notGroup={
              meetingId
                ? () => {
                    markPersonal(meetingId)
                    toTabs()
                  }
                : undefined
            }
            openTable={() => setView("settlementTable")}
            state={state}
          />
        )
      case "settlementTable":
        return (
          <SettlementTable
            back={() => setView("settlement")}
            edit={() => setView("settlementEdit")}
            excluded={excluded}
            proceed={() => setView("settlementConfirm")}
          />
        )
      case "settlementEdit":
        return (
          <SettlementEdit
            back={() => setView("settlementTable")}
            done={(list) => {
              setExcluded(list)
              setView("settlementTable")
            }}
            excluded={excluded}
          />
        )
      case "settlementConfirm":
        return (
          <SettlementConfirm
            back={() => setView("settlementTable")}
            excluded={excluded}
            matched={matched}
            notify={() => setMatched(true)}
            result={() => setView("settlementResult")}
          />
        )
      case "settlementResult":
        return (
          <SettlementResult
            excluded={excluded}
            finish={() => {
              setSettled(true)
              setInboxFromHome(false)
              setTab("report")
              setView("settlementList")
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {view === "tabs" ? (
        <>
          <div className="main-page">
            {tabScreen()}
            {tab === "report" && (
              <Action
                className="cal-icon report-profile"
                label="프로필"
                onClick={() => setView("profile")}
              >
                <UserRound size={20} strokeWidth={1.6} />
              </Action>
            )}
          </div>
          <BottomTabs
            active={tab}
            change={(next) => {
              setSheetDay(undefined)
              setFocusPayment(undefined)
              setReturnToMonth(undefined)
              if (next !== "map") setMapDay(undefined)
              setTab(next)
            }}
          />
        </>
      ) : (
        fullScreen()
      )}
      {recordPayment && (
        <AlbumPicker
          attach={attach}
          close={() => setRecordTarget(undefined)}
          payment={recordPayment}
        />
      )}
      {splitting && (
        <GroupSplitSheet
          close={() => setSplitting(undefined)}
          // 확인하면 원장만 갱신하고, 시트는 반영 결과(S4-3)를 보여 준 뒤 사용자가 닫는다
          confirm={() => {
            const id = splitting.id
            setLedger((value) =>
              value.splitConfirmed.includes(id)
                ? value
                : { ...value, splitConfirmed: [...value.splitConfirmed, id] },
            )
          }}
          openHistory={() => {
            setSplitting(undefined)
            setSheetDay(undefined)
            setView("settlementList")
          }}
          payment={splitting}
          state={state}
        />
      )}
    </>
  )
}
