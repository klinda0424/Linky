import { useEffect, useMemo, useState } from "react"
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
import { utMilestone, utScreen } from "@/lib/ut"
import { SCENARIO } from "@/mock/scenario"
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
  SettlementList,
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
  utTaskId,
}: {
  profile: ProfileDetails
  setProfile: (value: ProfileDetails) => void
  permissions: Record<PermissionKey, boolean>
  setPermissions: (
    update: (value: Record<PermissionKey, boolean>) => Record<PermissionKey, boolean>,
  ) => void
  utTaskId?: string
}) {
  const [tab, setTab] = useState<MainTab>("home")
  const [view, setView] = useState<MainView>("tabs")
  const [homeDay, setHomeDay] = useState<YMD>(TODAY)
  const [ledger, setLedger] = useState<LedgerState>(() =>
    utTaskId === "T8"
      ? { ...initialLedger, splitConfirmed: [...initialLedger.splitConfirmed, SCENARIO.meal.id] }
      : initialLedger,
  )
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
  // 캘린더 날짜에서 연 앨범: 그날 사진을 맨 위에 먼저 보여 준다
  const [albumDay, setAlbumDay] = useState<YMD>()
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
  const [settled, setSettled] = useState(utTaskId === "T8")
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
  useEffect(() => {
    utScreen(view === "tabs" ? `tab:${tab}` : `view:${view}`)
    if (view === "settlementList") utMilestone("t8_settlement_list")
  }, [tab, view])
  useEffect(() => {
    if (
      state.restoreConfirmed.includes(SCENARIO.taxi.id) &&
      state.restoreConfirmed.includes(SCENARIO.photoism.id)
    )
      utMilestone("t3_both_confirmed")
  }, [state.restoreConfirmed])
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
    utMilestone("t5_transfer_yes", payment.id)
    setLedger((value) => ({
      ...value,
      transferMatched: [...value.transferMatched, payment.id],
    }))
    // 재분류된 결과를 지출 내역(날짜 시트)에서 바로 보여 준다
    openPayment(payment)
  }
  const declineTransfer = (payment: Payment) => {
    utMilestone("t5_transfer_no", payment.id)
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
    if (paymentId === "o85") utMilestone("t6_attached", paymentId)
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
            setAlbumDay(undefined)
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
          // 정산 알림 → 정산 바텀시트(제안 → 그룹 결제 확인 → 결과·정산 완료)
          openSettlement={() => {
            if (meeting) setSplitting(meeting)
            else setView("settlementList")
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
                  const pending = summarize([])
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
                if (meeting) setSplitting(meeting)
                else setView("settlementList")
              }}
              openSplit={setSplitting}
              relink={relink}
              relinkPhoto={relinkPhoto}
              settlementPaymentId={meetingId}
              openAlbum={(day) => {
                setAlbumDay(day)
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
            // 정산 대기 중인 모임 지출은 바텀시트로 이어서 정산한다
            open={meeting ? () => setSplitting(meeting) : undefined}
            state={state}
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
              focusDay={albumDay}
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
            utMilestone("t4_declined", splitting.id)
            markPersonal(splitting.id)
            setSplitting(undefined)
          }}
          // "정산 완료": 내 몫만 가계에 반영(분할 확정)하고 캘린더·리포트 집계에 바로 보이게 한다
          complete={() => {
            utMilestone("t4_settled", splitting.id)
            confirmSplit(splitting.id)
            if (splitting.id === meetingId) setSettled(true)
            setSplitting(undefined)
          }}
          payment={splitting}
          state={state}
          onHeadcountConfirmed={(headcount) => {
            if (headcount === 3) utMilestone("t4b_headcount3", "3")
          }}
        />
      )}
    </div>
  )
}
