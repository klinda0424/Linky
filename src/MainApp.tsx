import { useEffect, useMemo, useRef, useState } from "react"
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
  depositsOf,
  groupBasis,
  initialLedger,
  payments,
  sameDay,
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
import { CleanupScreen, cleanupItems } from "@/screens/cleanup"
import { GroupSuggestSheet } from "@/screens/groupSuggest"
import { PaymentDetail } from "@/screens/payment"
import { type FoundTransfer, TransferPopup } from "@/screens/transferNotice"
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
  // 캘린더 날짜에서 연 앨범: 그날 사진을 맨 위에 먼저 보여 준다
  const [albumDay, setAlbumDay] = useState<YMD>()
  // 지도·앨범은 탭이 아니라 홈·캘린더에서 여는 화면이라, 뒤로 가기와 하단 탭 강조에 진입한 탭을 쓴다
  const [backTab, setBackTab] = useState<MainTab>("home")
  const [mapPeriod, setMapPeriod] = useState<"day" | "week" | "month">("day")
  const [returnToMonth, setReturnToMonth] = useState<YMD>()
  const [recordTarget, setRecordTarget] = useState<string>()
  // 맞아요를 누르면 화면 아래에 잠깐 떴다 사라지는 확인 알림 (같은 문구를 다시 눌러도 다시 뜨도록 key를 바꾼다)
  const [toast, setToast] = useState<{ text: string; key: number }>()
  // 오늘 송금 팝업을 이번 실행에서 이미 띄웠는지
  const [transferPopupSeen, setTransferPopupSeen] = useState(false)
  const showToast = (text: string) => setToast({ text, key: Date.now() })
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(undefined), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])
  const [splitting, setSplitting] = useState<Payment>()
  // 정리할 지출: "기록 없음으로 두기"를 누른 결제와, 모두 끝났을 때 한 번 뜨는 완료 팝업
  const [cleanupSkipped, setCleanupSkipped] = useState<string[]>([])
  const [cleanupDone, setCleanupDone] = useState(false)
  // 링키가 찾았어요: 확인 중인 송금
  const [transferId, setTransferId] = useState<string>()
  // 지출 내역 상세: 홈 오늘 지출에서 연 결제
  const [detailId, setDetailId] = useState<string>()
  const [photo, setPhoto] = useState<Photo>()
  const [event, setEvent] = useState<CalEvent>()
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
  // 그룹 결제 확인의 "아니요, 개인 지출"이 가리키는 결제
  const meetingId = meeting?.id
  const cleanup = cleanupItems(state, cleanupSkipped)
  // 정리할 건이 있다가 0이 되는 순간에만 "오늘 정리 끝"을 한 번 보인다 (어느 화면에서 끝내도 같다)
  const prevCleanup = useRef(cleanup.length)
  useEffect(() => {
    // 대화 화면 안에서는 대화가 끝날 때 팝업을 띄운다 (송금 질문이 남아 있을 수 있다)
    if (prevCleanup.current > 0 && cleanup.length === 0 && view !== "cleanup") {
      setCleanupDone(true)
    }
    prevCleanup.current = cleanup.length
  }, [cleanup.length])
  useEffect(() => {
    if (!cleanupDone) return
    const timer = window.setTimeout(() => setCleanupDone(false), 2200)
    return () => window.clearTimeout(timer)
  }, [cleanupDone])
  const toTabs = () => setView("tabs")
  const dayNumber = (payment: Payment) => payment.date.y * 10000 + payment.date.m * 100 + payment.date.d
  // 맥락을 찾았지만 아직 맞아요/아니에요를 누르지 않은 송금 (홈 알림·팝업), 최근 것부터
  const pendingTransfers: FoundTransfer[] = payments
    .filter(
      (item) =>
        item.kind === "transfer" &&
        !state.transferMatched.includes(item.id) &&
        !(state.transferDeclined ?? []).includes(item.id),
    )
    .flatMap((item) => {
      const guess = transferGuess(item, state)
      return guess ? [{ payment: item, guess }] : []
    })
    .sort((a, b) => dayNumber(b.payment) - dayNumber(a.payment))
  // 오늘 송금은 홈에 들어올 때 팝업으로 한 번만 띄운다 (닫으면 홈 상단 알림으로 남는다)
  const todayTransfer = pendingTransfers.find((item) => sameDay(item.payment.date, TODAY))
  // 오늘 정산을 확인해야 하는 그룹 결제: 홈 진입 팝업에서 송금 다음 단계로 이어 보여 준다
  // (예전에는 송금 팝업을 닫자마자 정산 시트가 따로 올라와 팝업이 연달아 떴다)
  const foundGroupOf = (payment: Payment) => {
    const deposits = depositsOf(payment, state)
    const detail = groupBasis(payment, state)
    return {
      payment,
      facts: [
        deposits.length > 0 ? `입금 내역 ${deposits.length}건 확인` : undefined,
        detail.detail ? `${detail.detail} 일정이 있던 날` : `함께 결제한 ${payment.group?.length ?? 0}명`,
      ].filter((fact): fact is string => Boolean(fact)),
    }
  }
  const todayGroup =
    meeting &&
    sameDay(meeting.date, TODAY) &&
    !settled &&
    !state.splitConfirmed.includes(meeting.id) &&
    !(state.personal ?? []).includes(meeting.id)
      ? foundGroupOf(meeting)
      : undefined
  // 오늘 이전 7일 안에 정산하지 않고 남은 그룹 결제 (최근 것부터). 오늘 것은 위 todayGroup이 맡는다
  const daysAgo = (payment: Payment) =>
    Math.round(
      (new Date(TODAY.y, TODAY.m - 1, TODAY.d).getTime() -
        new Date(payment.date.y, payment.date.m - 1, payment.date.d).getTime()) /
        86400000,
    )
  const pendingGroups = [
    ...(todayGroup ? [todayGroup] : []),
    ...payments
      .filter(
        (item) =>
          item.group &&
          item.kind !== "transfer" &&
          item.id !== meetingId &&
          daysAgo(item) >= 1 &&
          daysAgo(item) <= 7 &&
          !state.splitConfirmed.includes(item.id) &&
          !(state.personal ?? []).includes(item.id),
      )
      .sort((a, b) => dayNumber(b) - dayNumber(a))
      .map(foundGroupOf),
  ]
  const transferPayment = payments.find((item) => item.id === transferId)
  const detailPayment = payments.find((item) => item.id === detailId)
  const openDetail = (payment: Payment) => {
    setDetailId(payment.id)
    setView("paymentDetail")
  }
  // stay: 정리 대화 안에서 처리할 때는 캘린더로 나가지 않고 그 자리에서 이어간다
  const confirmTransfer = (payment: Payment, stay = false) => {
    showToast("확인했어요")
    setLedger((value) => ({
      ...value,
      transferMatched: [...value.transferMatched, payment.id],
    }))
    // 재분류된 결과를 지출 내역(날짜 시트)에서 바로 보여 준다
    if (!stay) openPayment(payment)
  }
  // 수정 → "원래 이름으로 되돌리기": 맞아요를 취소해 다시 송금(이체)으로 둔다
  const revertTransfer = (paymentId: string) => {
    showToast("원래 이름으로 되돌렸어요")
    setLedger((value) => ({
      ...value,
      transferMatched: value.transferMatched.filter((id) => id !== paymentId),
    }))
  }
  const declineTransfer = (payment: Payment, stay = false) => {
    setLedger((value) => ({
      ...value,
      transferDeclined: [...(value.transferDeclined ?? []), payment.id],
    }))
    if (!stay) toTabs()
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
  const verify = (paymentId: string) => {
    showToast("확인했어요")
    setLedger((value) => ({
      ...value,
      verified: [...(value.verified ?? []), paymentId],
    }))
  }
  const confirmRestore = (paymentId: string) => {
    showToast("확인했어요")
    setLedger((value) => ({
      ...value,
      restoreConfirmed: [...value.restoreConfirmed, paymentId],
    }))
  }
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
  const attach = (paymentId: string, text?: string, picked?: string) => {
    setLedger((value) => {
      const current = value.added[paymentId] ?? []
      return {
        ...value,
        added: {
          ...value.added,
          [paymentId]: [
            ...current,
            { kind: "added", text: picked ? `${text ?? addedPhotoText} · ${picked}` : (text ?? addedPhotoText) },
          ],
        },
      }
    })
    // 정리 화면에서 기록을 붙였을 때는 그 자리에서 다음 건을 이어서 본다
    if (view !== "paymentDetail" && view !== "cleanup") setView("tabs")
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
          openAlbum={(day) => {
            setAlbumDay(day)
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
          // 오늘 송금도 팝업을 닫고 나면 확인하지 않은 알림으로 남아 상단 카드에 함께 모인다
          pendingTransfers={pendingTransfers}
          // 알림을 누르면 첫 건(가장 최근)의 확인 화면으로. 다른 흐름으로 바꿀 때는 이 핸들러만 바꾼다
          openTransfer={(first) => {
            setTransferId(first.payment.id)
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
          cleanupCount={cleanup.length + pendingGroups.length}
          openCleanup={() => setView("cleanup")}
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
              revertTransfer={revertTransfer}
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
                  revertTransfer={revertTransfer}
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
            revertTransfer={revertTransfer}
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
      case "cleanup":
        return (
          <CleanupScreen
            addRecord={openRecord}
            back={toTabs}
            confirm={confirmRestore}
            confirmTransfer={(payment) => confirmTransfer(payment, true)}
            declineTransfer={(payment) => declineTransfer(payment, true)}
            edit={(payment) => openPayment(payment)}
            finish={() => setCleanupDone(true)}
            items={cleanup}
            skip={(id) => setCleanupSkipped((value) => [...value, id])}
            state={state}
            // 확인하지 않은 송금·그룹 결제까지 한 대화에 모은다 (홈 상단 "링키가 찾았어요")
            groups={pendingGroups}
            markPersonal={markPersonal}
            openGroup={(payment) => setSplitting(payment)}
            transfers={pendingTransfers}
          />
        )
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
            markPersonal(splitting.id)
            setSplitting(undefined)
          }}
          // "정산 완료": 내 몫만 가계에 반영(분할 확정)하고 캘린더·리포트 집계에 바로 보이게 한다
          complete={() => {
            confirmSplit(splitting.id)
            if (splitting.id === meetingId) setSettled(true)
            setSplitting(undefined)
          }}
          payment={splitting}
          state={state}
          onHeadcountConfirmed={(_, edit) =>
            // 인원 수정 결과를 원장에 남겨 홈 입금 배너·내 몫·받을 돈이 같이 바뀌게 한다
            setLedger((value) => ({
              ...value,
              groupEdit: { ...value.groupEdit, [splitting.id]: edit },
            }))
          }
        />
      )}
      {(todayTransfer || todayGroup) && !transferPopupSeen && view === "tabs" && tab === "home" && (
        <TransferPopup
          close={() => setTransferPopupSeen(true)}
          confirm={(item, last) => {
            if (last) setTransferPopupSeen(true)
            // 다음 단계(그룹 지출)가 있으면 팝업에 머물고, 마지막이면 바뀐 행을 보여 준다
            confirmTransfer(item.payment, !last)
          }}
          edit={(item) => {
            setTransferPopupSeen(true)
            setTransferId(item.payment.id)
            setView("transfer")
          }}
          group={todayGroup}
          item={todayTransfer}
          openGroup={(payment) => {
            setTransferPopupSeen(true)
            setSplitting(payment)
          }}
          state={state}
        />
      )}
      {toast && (
        <div className="app-toast" key={toast.key} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}
      {cleanupDone && (
        <div className="cl-done" role="status" aria-live="polite">
          <strong>정리 끝</strong>
          <span>밀린 기록을 모두 확인했어요</span>
        </div>
      )}
    </div>
  )
}
