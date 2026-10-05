import { useMemo, useState } from "react"
import { BottomTabs } from "@/components/layout"
import {
  type CalEvent,
  type LedgerState,
  type Payment,
  type Photo,
  type YMD,
  initialLedger,
  payments,
} from "@/lib/ledger"
import { AlbumTab, EventReport, PhotoDetail } from "@/screens/album"
import { CalendarHome, DaySheet } from "@/screens/calendar"
import { HomePage } from "@/screens/home"
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
            setMapDay(undefined)
            setMapPeriod("day")
            setTab("map")
          }}
          openPayment={(payment) => openPayment(payment)}
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
    return (
      <MyPage
        name={profile.nickname || "소연"}
        openConnections={() => setView("connections")}
        openInfo={() => setView("profileInfo")}
        openNotifications={() => setView("notifications")}
        openPrivacy={() => setView("privacy")}
        openSettlement={() => setView("settlementList")}
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
      case "settlementList":
        return (
          <SettlementList
            back={toTabs}
            completed={settled}
            open={() => setView("settlement")}
            state={state}
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
              setReturnToMonth(undefined)
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
            if (returnToMonth) {
              setMapDay(returnToMonth)
              setMapPeriod("month")
              setReturnToMonth(undefined)
              setTab("map")
            }
          }}
          day={sheetDay}
          focusPayment={focusPayment}
          move={(day) => {
            setFocusPayment(undefined)
            setReturnToMonth(undefined)
            setSheetDay(day)
          }}
          openRecord={openRecord}
          markPersonal={markPersonal}
          openSplit={setSplitting}
          showMap={(day) => {
            setSheetDay(undefined)
            setMapDay(day)
            setMapPeriod("day")
            setReturnToMonth(undefined)
            setTab("map")
          }}
          state={state}
          unlink={unlink}
          relink={relink}
          relinkPhoto={relinkPhoto}
          unlinkPhoto={unlinkPhoto}
          verify={verify}
        />
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
