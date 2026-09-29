export type DomainKey = "spend" | "emotion" | "schedule" | "health" | "shopping"
export type PermissionKey = "payment" | "calendar" | "location" | "photos" | "health"
export type Tone = "narrative" | "numeric"
export type MainTab = "home" | "fun" | "archive" | "community"
export type MainView = "tabs" | "coachHub" | "goalAchievement" | "mood" | "dailyReport" | "quick" | "link" | "capture" | "calendar" | "expense" | "groupExpense" | "settlement" | "settlementTable" | "settlementEdit" | "settlementConfirm" | "settlementResult" | "travelStory" | "travelCost" | "shopping" | "closet" | "fridge" | "coach" | "food" | "health" | "search" | "searchResults" | "profile" | "tone" | "goals"
export type RecognizedFields = {
  title: string
  date: string
  people: string
  place: string
}
export type GoalModeKey = "diet" | "saving" | "exercise"
