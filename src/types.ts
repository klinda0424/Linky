// 하단 탭 4개
export type MainTab = "calendar" | "map" | "album" | "mypage"

// 탭 위에 쌓이는 전체 화면
export type MainView =
  | "tabs"
  | "search"
  | "record"
  | "recordAttach"
  | "photo"
  | "eventReport"
  | "profileInfo"
  | "connections"
  | "privacy"
  | "notifications"
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
