// 하단 탭은 캘린더·홈·리포트 3개. 프로필은 탭이 아니라 우측 상단 아이콘으로 여는 화면이다. 지도·앨범은 탭이 아니라 홈 카드·날짜 시트에서 여는 화면이다.
export type MainTab = "calendar" | "home" | "report" | "map" | "album"

// 탭 위에 쌓이는 전체 화면
export type MainView =
  | "tabs"
  | "search"
  | "profile"
  | "photo"
  | "eventReport"
  | "profileInfo"
  | "connections"
  | "privacy"
  | "notifications"
  | "transfer"
  | "settlementList"
  | "settlement"
  | "settlementTable"
  | "settlementEdit"
  | "settlementConfirm"
  | "settlementResult"

// 연동 권한: 카드·계좌는 필수, 나머지는 개별 토글
export type PermissionKey = "payment" | "calendar" | "photos" | "location"

export type NotificationKey = "restore" | "report" | "settlement"

export type ProfileDetails = {
  nickname: string
  birthYear: string
  job: string
}
