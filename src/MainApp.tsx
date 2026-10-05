import { useMemo, useState } from "react"
import { BottomTabs } from "@/components/layout"
import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Photo,
  type YMD,
  initialLedger,
} from "@/lib/ledger"
import { AlbumTab, EventReport, PhotoDetail } from "@/screens/album"
import { CalendarHome, DaySheet } from "@/screens/calendar"
import { MapTab } from "@/screens/map"
import {
  ConnectionSettings,
  MyPage,
  NotificationSettings,
  PrivacySettings,
  ProfileInfoSettings,
  ProfileTone,
} from "@/screens/profile"
import {
  type RecordKind,
  RecordAttach,
  RecordSheet,
  addedText,
} from "@/screens/record"
import { SearchScreen } from "@/screens/search"
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
  type Tone,
} from "@/types"

export function MainApp({
  profile,
  setProfile,
  tone,
  setTone,
  permissions,
  setPermissions,
}: {
  profile: ProfileDetails
  setProfile: (value: ProfileDetails) => void
  tone: Tone
  setTone: (tone: Tone) => void
  permissions: Record<PermissionKey, boolean>
  setPermissions: (
    update: (value: Record<PermissionKey, boolean>) => Record<PermissionKey, boolean>,
  ) => void
}) {
  const [tab, setTab] = useState<MainTab>("calendar")
  const [view, setView] = useState<MainView>("tabs")
  const [ledger, setLedger] = useState<LedgerState>(initialLedger)
  // 날짜 시트: 캘린더 탭 위에 열린다. 지도 핀·검색에서 넘어오면 해당 결제를 강조한다.
  const [sheetDay, setSheetDay] = useState<YMD>()
  const [focusPayment, setFocusPayment] = useState<string>()
  const [mapDay, setMapDay] = useState<YMD>()
  const [recordSheet, setRecordSheet] = useState(false)
  const [recordTarget, setRecordTarget] = useState<string>()
  const [recordKind, setRecordKind] = useState<RecordKind>("paymentCapture")
  const [splitting, setSplitting] = useState<Payment>()
  const [photo, setPhoto] = useState<Photo>()
  const [event, setEvent] = useState<CalEvent>()
  const [excluded, setExcluded] = useState<string[]>([])
  const [matched, setMatched] = useState(false)
  const [settled, setSettled] = useState(false)
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
  const toTabs = () => setView("tabs")

  const openPayment = (payment: Payment) => {
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
  const attach = (paymentId: string, text?: string) => {
    setLedger((value) => {
      const current = value.added[paymentId] ?? []
      return {
        ...value,
        added: {
          ...value.added,
          [paymentId]: [
            ...current,
            { kind: "added", text: text ?? addedText[recordKind] },
          ],
        },
      }
    })
    setView("tabs")
  }
  const openRecord = (paymentId?: string) => {
    setRecordTarget(paymentId)
    setRecordSheet(true)
  }

  const tabScreen = () => {
    if (tab === "calendar")
      return (
        <CalendarHome
          openDay={(day) => {
            setFocusPayment(undefined)
            setSheetDay(day)
          }}
          openRecord={() => openRecord()}
          openSearch={() => setView("search")}
          sheetDay={sheetDay}
          state={state}
        />
      )
    if (tab === "map")
      return (
        <MapTab
          initialDay={mapDay}
          key={mapDay ? `${mapDay.y}-${mapDay.m}-${mapDay.d}` : "all"}
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
    return (
      <MyPage
        name={profile.nickname || "소연"}
        openConnections={() => setView("connections")}
        openInfo={() => setView("profileInfo")}
        openNotifications={() => setView("notifications")}
        openPrivacy={() => setView("privacy")}
        openSettlement={() => setView("settlementList")}
        openTone={() => setView("tone")}
      />
    )
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
      case "recordAttach":
        return (
          <RecordAttach
            attach={attach}
            back={toTabs}
            kind={recordKind}
            paymentId={recordTarget}
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
      case "profileInfo":
        return (
          <ProfileInfoSettings
            back={toTabs}
            save={(value) => {
              setProfile(value)
              toTabs()
            }}
            value={profile}
          />
        )
      case "connections":
        return (
          <ConnectionSettings
            back={toTabs}
            toggle={(key) =>
              setPermissions((value) => ({ ...value, [key]: !value[key] }))
            }
            values={permissions}
          />
        )
      case "privacy":
        return (
          <PrivacySettings
            back={toTabs}
            toggle={(key) =>
              setPermissions((value) => ({ ...value, [key]: !value[key] }))
            }
            values={permissions}
          />
        )
      case "notifications":
        return (
          <NotificationSettings
            back={toTabs}
            toggle={(key) =>
              setNotifications((value) => ({ ...value, [key]: !value[key] }))
            }
            values={notifications}
          />
        )
      case "tone":
        return <ProfileTone back={toTabs} setTone={setTone} tone={tone} />
      case "settlementList":
        return (
          <SettlementList
            back={toTabs}
            completed={settled}
            open={() => setView("settlement")}
          />
        )
      case "settlement":
        return (
          <SettlementInbox
            back={() => setView("settlementList")}
            excluded={excluded}
            openTable={() => setView("settlementTable")}
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
          <div className="main-page">{tabScreen()}</div>
          <BottomTabs
            active={tab}
            change={(next) => {
              setSheetDay(undefined)
              setFocusPayment(undefined)
              if (next !== "map") setMapDay(undefined)
              setTab(next)
            }}
          />
        </>
      ) : (
        fullScreen()
      )}
      {view === "tabs" && tab === "calendar" && sheetDay && (
        <DaySheet
          close={() => {
            setSheetDay(undefined)
            setFocusPayment(undefined)
          }}
          day={sheetDay}
          focusPayment={focusPayment}
          move={(day) => {
            setFocusPayment(undefined)
            setSheetDay(day)
          }}
          openRecord={openRecord}
          openSplit={setSplitting}
          showMap={(day) => {
            setSheetDay(undefined)
            setMapDay(day)
            setTab("map")
          }}
          state={state}
          tone={tone}
          unlink={unlink}
        />
      )}
      {recordSheet && (
        <RecordSheet
          close={() => setRecordSheet(false)}
          pick={(kind) => {
            setRecordKind(kind)
            setRecordSheet(false)
            setView("recordAttach")
          }}
        />
      )}
      {splitting && (
        <GroupSplitSheet
          close={() => setSplitting(undefined)}
          confirm={() => {
            const id = splitting.id
            setLedger((value) => ({
              ...value,
              splitConfirmed: [...value.splitConfirmed, id],
            }))
            setSplitting(undefined)
          }}
          payment={splitting}
        />
      )}
    </>
  )
}
