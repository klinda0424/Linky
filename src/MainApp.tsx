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
import { GroupSuggestSheet } from "@/screens/groupSuggest"
import { PaymentDetail } from "@/screens/payment"
import { AlbumPicker, addedPhotoText } from "@/screens/record"
import { SearchScreen } from "@/screens/search"
import { TransferConfirm } from "@/screens/transfer"
import {
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
  const [homeDay, setHomeDay] = useState<YMD>(TODAY)
  const [ledger, setLedger] = useState<LedgerState>(initialLedger)
  // 날짜 시트: 캘린더 탭 위에 열린다. 지도 핀·검색에서 넘어오면 해당 결제를 강조한다.
  const [sheetDay, setSheetDay] = useState<YMD>()
  // 리포트에서 날짜로 이동할 때마다 늘려서 캘린더가 그 날 상세까지 스크롤하게 한다
  const [calendarScrollKey, setCalendarScrollKey] = useState(0)
  const [focusPayment, setFocusPayment] = useState<string>()
  // 검색 결과 위에 여는 결제 상세. 검색 화면을 유지해 검색어·결과가 사라지지 않게 한다.
  const [searchPayment, setSearchPayment] = useState<Payment>()
  const [mapDay, setMapDay] = useState<YMD>()
  const [mapSheetOpen, setMapSheetOpen] = useState(false)
  const [mapSheetClosing, setMapSheetClosing] = useState(false)
  const [albumSheetOpen, setAlbumSheetOpen] = useState(false)
  const [albumSheetClosing, setAlbumSheetClosing] = useState(false)
  // 지도·앨범은 탭이 아니라 홈·캘린더에서 여는 화면이라, 뒤로 가기와 하단 탭 강조에 진입한 탭을 쓴다
  const [backTab, setBackTab] = useState<MainTab>("home")
  const [mapPeriod, setMapPeriod] = useState<"day" | "week" | "month">("day")
  const [returnToMonth, setReturnToMonth] = useState<YMD>()
  const [recordTarget, setRecordTarget] = useState<string>()
  const [splitting, setSplitting] = useState<Payment>()
  // 링키가 찾았어요: 확인 중인 송금
  const [transferId, setTransferId] = useState<string>()
  // 지출 내역 상세: 홈 오늘 지출에서 연 결제
  const [detailId, setDetailId] = useState<string>()
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
  const detailPayment = payments.find((item) => item.id === detailId)
  const openDetail = (payment: Payment) => {
    setDetailId(payment.id)
    setView("paymentDetail")
  }
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
  // 인원 분할 확정: 캘린더·리포트의 내 몫 집계는 이 상태를 기준으로 계산한다
  const confirmSplit = (paymentId: string) =>
    setLedger((value) =>
      value.splitConfirmed.includes(paymentId)
        ? value
        : { ...value, splitConfirmed: [...value.splitConfirmed, paymentId] },
    )
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
    if (view !== "paymentDetail") setView("tabs")
    setRecordTarget(undefined)
  }
  const openRecord = (paymentId?: string) => {
    setRecordTarget(paymentId)
  }

  const closeMapSheet = (afterClose?: () => void) => {
    if (mapSheetClosing) return
    setMapSheetClosing(true)
    window.setTimeout(() => {
      setMapSheetOpen(false)
      setMapSheetClosing(false)
      afterClose?.()
    }, 220)
  }
  const closeAlbumSheet = () => {
    if (albumSheetClosing) return
    setAlbumSheetClosing(true)
    window.setTimeout(() => {
      setAlbumSheetOpen(false)
      setAlbumSheetClosing(false)
    }, 220)
  }

  const tabScreen = () => {
    if (tab === "home")
      return (
        <HomePage
          day={homeDay}
          openAlbum={() => {
            setAlbumSheetClosing(false)
            setAlbumSheetOpen(true)
          }}
          openMap={(day) => {
            setMapDay(day)
            setMapPeriod("day")
            setMapSheetClosing(false)
            setMapSheetOpen(true)
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
          openPayment={openDetail}
          openProfile={() => setView("profile")}
          openSearch={() => setView("search")}
          selectDay={setHomeDay}
          state={state}
        />
      )
    if (tab === "calendar")
      return (
        <CalendarHome
          onScrolledToDay={() => setCalendarScrollKey(0)}
          scrollToDayKey={calendarScrollKey}
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
              openDetail={openDetail}
              openRecord={openRecord}
              openSettlement={() => {
                setInboxFromHome(true)
                setView("settlement")
              }}
              openSplit={setSplitting}
              relink={relink}
              relinkPhoto={relinkPhoto}
              settlementPaymentId={meetingId}
              openAlbum={() => {
                setAlbumSheetClosing(false)
                setAlbumSheetOpen(true)
              }}
              showMap={(day) => {
                setMapDay(day)
                setMapPeriod("day")
                setMapSheetClosing(false)
                setMapSheetOpen(true)
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
          back={() => setTab(backTab)}
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
          back={() => setTab(backTab)}
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
          openDay={(day) => {
            // 가장 많이 쓴 날 → 캘린더에서 그 날짜를 연다
            setFocusPayment(undefined)
            setSheetDay(day)
            setCalendarScrollKey((key) => key + 1)
            setTab("calendar")
          }}
          openSettlement={() => setView("settlementList")}
          openWeekMap={(day) => {
            // 가장 많이 쓴 곳 → 그 주의 동선 지도 (시트)
            setMapDay(day)
            setMapPeriod("week")
            setMapSheetClosing(false)
            setMapSheetOpen(true)
          }}
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
            back={() => {
              setSearchPayment(undefined)
              toTabs()
            }}
            closeDetail={() => setSearchPayment(undefined)}
            detail={
              searchPayment ? (
                <DayPanel
                  back={() => setSearchPayment(undefined)}
                  canReturn={false}
                  confirmRestore={confirmRestore}
                  day={searchPayment.date}
                  focusPayment={searchPayment.id}
                  markPersonal={markPersonal}
                  openDetail={openDetail}
                  openRecord={openRecord}
                  openSplit={setSplitting}
                  relink={relink}
                  relinkPhoto={relinkPhoto}
                  showMap={(day) => {
                    setMapDay(day)
                    setMapPeriod("day")
                    setMapSheetClosing(false)
                    setMapSheetOpen(true)
                  }}
                  state={state}
                  unlink={unlink}
                  unlinkPhoto={unlinkPhoto}
                  verify={verify}
                />
              ) : undefined
            }
            openPayment={setSearchPayment}
            state={state}
          />
        )
      case "photo":
        return photo ? (
          <PhotoDetail
            back={toTabs}
            openPayment={(payment) => {
              setAlbumSheetOpen(false)
              openPayment(payment)
            }}
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
            openPayment={(payment) => {
              setAlbumSheetOpen(false)
              openPayment(payment)
            }}
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
      case "paymentDetail":
        return detailPayment ? (
          <PaymentDetail
            back={toTabs}
            confirmRestore={confirmRestore}
            openRecord={openRecord}
            payment={detailPayment}
            relink={relink}
            relinkPhoto={relinkPhoto}
            state={state}
            unlink={unlink}
            unlinkPhoto={unlinkPhoto}
          />
        ) : null
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
            goHome={() => {
              setTab("home")
              toTabs()
            }}
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
            result={() => {
              // 정산 결과는 "내 몫만 가계에 반영"이므로 이 시점에 분할을 확정해 캘린더·리포트 집계에 반영한다
              if (meetingId) confirmSplit(meetingId)
              setView("settlementResult")
            }}
          />
        )
      case "settlementResult":
        return (
          <SettlementResult
            excluded={excluded}
            finish={() => {
              setSettled(true)
              setInboxFromHome(false)
              // 탭은 정산을 시작한 곳(홈·캘린더·리포트)에 그대로 둔다. 정산 내역에서 뒤로 가면 시작한 화면으로 돌아간다
              setView("settlementList")
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    // 메인 앱 전체를 한 축척(0.85배)으로 줄여 모든 화면의 글자 위계를 홈 기준으로 맞춘다
    <div className="main-scale">
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
            active={tab === "map" || tab === "album" ? backTab : tab}
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
      {mapSheetOpen && (
        <div
          className={`media-sheet-dim${mapSheetClosing ? " closing" : ""}`}
          onClick={() => closeMapSheet()}
        >
          <section
            aria-label="동선 지도"
            aria-modal="true"
            className="media-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-grip" />
            <MapTab
              back={() => closeMapSheet()}
              initialDay={mapDay}
              initialPeriod={mapPeriod}
              key={mapDay ? `sheet-${mapPeriod}-${mapDay.y}-${mapDay.m}-${mapDay.d}` : "sheet-all"}
              openPayment={(payment) => {
                closeMapSheet(() => openPayment(payment))
              }}
              state={state}
            />
          </section>
        </div>
      )}
      {albumSheetOpen && view !== "photo" && view !== "eventReport" && (
        <div
          className={`media-sheet-dim${albumSheetClosing ? " closing" : ""}`}
          onClick={closeAlbumSheet}
        >
          <section
            aria-label="앨범"
            aria-modal="true"
            className="media-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="sheet-grip" />
            <AlbumTab
              back={closeAlbumSheet}
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
          </section>
        </div>
      )}
      {recordPayment && (
        <AlbumPicker
          attach={attach}
          close={() => setRecordTarget(undefined)}
          payment={recordPayment}
        />
      )}
      {splitting && (
        <GroupSuggestSheet
          close={() => setSplitting(undefined)}
          // "그룹 지출이 아니에요" → 개인 지출로 두고 시트를 닫는다
          notGroup={() => {
            markPersonal(splitting.id)
            setSplitting(undefined)
          }}
          // "인원 수정" → 정산 흐름(정산표 수정)으로 이동
          editPeople={() => {
            setSplitting(undefined)
            setInboxFromHome(true)
            setView("settlement")
          }}
          // 확인하면 원장만 갱신하고, 시트는 반영 결과(S4-3)를 보여 준 뒤 사용자가 닫는다
          confirm={() => {
            confirmSplit(splitting.id)
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
    </div>
  )
}
