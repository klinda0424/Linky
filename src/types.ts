// 하단 탭은 홈·캘린더·마이페이지 3개. 지도·앨범은 탭이 아니라 홈·날짜 시트에서 여는 화면이다.
export type MainTab = "home" | "calendar" | "mypage" | "map" | "album"

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
