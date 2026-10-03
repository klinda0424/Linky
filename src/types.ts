export type DomainKey = "spend" | "emotion" | "schedule" | "health" | "shopping"

export type PermissionKey = "payment" | "calendar" | "location" | "photos" | "health"

export type Tone = "narrative" | "numeric"

export type MainTab = "home" | "fun" | "archive" | "community"

export type MainView = "tabs" | "coachHub" | "goalAchievement" | "mood" | "dailyReport" | "dailyInsight" | "schedule" | "emotion" | "quick" | "link" | "capture" | "captureImport" | "screenRecording" | "calendar" | "expense" | "groupExpense" | "settlement" | "settlementTable" | "settlementEdit" | "settlementConfirm" | "settlementResult" | "travelStory" | "travelCost" | "shopping" | "closet" | "fridge" | "coach" | "food" | "health" | "search" | "searchResults" | "profile" | "profileInfo" | "connections" | "notifications" | "tone" | "goals"

export type GoalModeKey = "diet" | "saving" | "exercise"

export type ProfileDetails = {
  nickname: string

  birthYear: string

  job: string
}

export type NotificationKey = "pattern" | "schedule" | "health" | "report"
