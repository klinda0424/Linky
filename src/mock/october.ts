// 2026년 10월 목업 (주인공 김소연). 캘린더·지도·앨범·검색·리포트가 lib/ledger.ts를 거쳐 이 파일만 참조한다.
// 합계는 파일 맨 아래 verifyOctober()가 명세와 일치하는지 검증한다.
import type { CalEvent, Category, Payment, Photo, TrailPoint } from "@/lib/ledger"

const d = (day: number) => ({ y: 2026, m: 10, d: day })

// located=true면 결제 당시 내 위치 기록이 있다 (place). 일정·사진 근거는 아래 일정·사진 목록과 시각이 겹칠 때만 붙는다.
let seq = 0
const o = (
  day: number,
  time: string,
  merchant: string,
  amount: number,
  category: Category,
  zone: string,
  located: boolean,
  group?: string[],
): Payment => ({
  id: `o${++seq}`,
  date: d(day),
  time,
  merchant,
  amount,
  category,
  zone,
  place: located ? zone : undefined,
  group,
})

export const octoberEvents: CalEvent[] = [
  { id: "e7", title: "팀 회의", date: d(2), start: "14:00", end: "15:30", zone: "광화문" },
  { id: "e8", title: "대학 동기 모임", date: d(4), start: "19:00", end: "22:00", zone: "합정", people: ["지은", "민지", "수진"] },
  { id: "e9", title: "전시 보기", date: d(10), start: "14:00", end: "16:30", zone: "성수" },
  { id: "e10", title: "지은·민지 성수", date: d(12), start: "12:00", end: "14:00", zone: "성수", people: ["지은", "민지"] },
  { id: "e11", title: "영화 보기", date: d(18), start: "15:00", end: "17:30", zone: "용산" },
  { id: "e12", title: "가족 외식", date: d(24), start: "18:00", end: "20:30", zone: "합정" },
  { id: "e13", title: "핼러윈 파티", date: d(31), start: "19:00", end: "23:00", zone: "성수", people: ["지은", "민지"] },
]

export const octoberPhotos: Photo[] = [
  { id: "ph11", date: d(4), time: "19:55", zone: "합정", title: "합정 술자리" },
  { id: "ph12", date: d(4), time: "20:35", zone: "합정", title: "합정" },
  { id: "ph13", date: d(10), time: "14:20", zone: "성수", title: "디뮤지엄" },
  // 10/12: 점심 3장, 15:20 결제 근처 2장 (이 중 서울숲 사진은 잘못 붙은 사진 → 수정 시연용)
  { id: "ph14", date: d(12), time: "12:35", zone: "성수", title: "성수 점심" },
  { id: "ph15", date: d(12), time: "12:55", zone: "성수", title: "성수 점심" },
  { id: "ph16", date: d(12), time: "13:15", zone: "성수", title: "성수 점심" },
  { id: "ph17", date: d(12), time: "15:05", zone: "성수", title: "마르디 성수" },
  { id: "ph18", date: d(12), time: "15:40", zone: "서울숲", title: "서울숲 산책" },
  { id: "ph19", date: d(18), time: "14:50", zone: "용산", title: "CGV 용산" },
  { id: "ph20", date: d(24), time: "18:40", zone: "합정", title: "합정 숯불갈비" },
  { id: "ph21", date: d(31), time: "19:50", zone: "성수", title: "핼러윈 파티" },
  { id: "ph22", date: d(31), time: "22:10", zone: "성수", title: "성수" },
]

// 내 위치 기록 중 결제와 별개로 동선에 이어지는 지점 (장면 6: 성수역 → 식당 → 옷가게 → 귀가)
export const octoberTrail: TrailPoint[] = [
  { id: "t1", date: d(12), time: "12:10", name: "성수역", zone: "성수" },
  { id: "t2", date: d(12), time: "22:30", name: "집 (귀가)", zone: "역삼" },
]

// 장면 4에서 사용자가 직접 확정하는 10/12 점심을 뺀 그룹 결제 (10/4 술자리, 10/25 카페는 이미 확정)
export const octoberConfirmedSplitIds = () =>
  octoberPayments
    .filter((payment) => payment.group && payment.date.d !== 12)
    .map((payment) => payment.id)

// 근거 없는 날(10/7·14·21·28)과 부분 복원일은 결제에 위치(place)가 없거나 일부만 있다.
export const octoberPayments: Payment[] = [
  o(1, "08:40", "스타벅스 강남역점", 5800, "식비·카페", "강남역", true),
  o(1, "12:20", "맥도날드 선릉점", 7300, "식비·카페", "선릉", true),
  o(1, "18:50", "티머니 후불교통", 3100, "교통", "강남역", true),
  o(2, "13:40", "스타벅스 광화문점", 6100, "식비·카페", "광화문", true),
  o(2, "19:40", "CJ올리브영 강남타운점", 21900, "쇼핑", "강남역", true),
  o(2, "21:10", "배달의민족", 12000, "식비·카페", "역삼", true),
  o(3, "12:40", "(주)메이플베이커리 합정점", 9000, "식비·카페", "합정", true),
  o(3, "16:20", "무신사 스탠다드 홍대", 35000, "쇼핑", "합정", true),
  o(3, "21:05", "카카오T 택시", 22400, "교통", "합정", true),
  o(4, "10:30", "스타벅스 서울숲점", 6300, "식비·카페", "서울숲", true),
  o(4, "12:50", "성수 수제버거", 9500, "식비·카페", "성수", true),
  o(4, "20:10", "(주)술한잔 합정점", 120000, "식비·카페", "합정", true, ["나", "지은", "민지", "수진"]),
  o(5, "12:10", "(주)한솥도시락 선릉점", 6500, "식비·카페", "선릉", true),
  o(5, "18:40", "티머니 후불교통", 3100, "교통", "선릉", true),
  o(6, "08:50", "이디야커피 선릉점", 4100, "식비·카페", "선릉", true),
  o(6, "12:30", "구내식당", 5500, "식비·카페", "강남역", false),
  o(6, "19:20", "GS25 역삼점", 3900, "생활·기타", "역삼", false),
  o(7, "12:15", "김밥천국 역삼점", 7000, "식비·카페", "역삼", false),
  o(7, "20:30", "배달의민족", 11000, "식비·카페", "역삼", false),
  o(8, "08:35", "스타벅스 선릉점", 6200, "식비·카페", "선릉", true),
  o(8, "13:00", "(주)본도시락 선릉점", 6900, "식비·카페", "선릉", true),
  o(8, "19:10", "(주)다이소 선릉점", 12000, "생활·기타", "선릉", true),
  o(8, "22:10", "카카오T 택시", 15800, "교통", "선릉", true),
  o(9, "08:40", "스타벅스 강남역점", 5800, "식비·카페", "강남역", true),
  o(9, "12:40", "(주)샐러디 선릉점", 9500, "식비·카페", "선릉", false),
  o(9, "20:00", "CGV 강남", 15000, "문화·여가", "강남역", false),
  o(10, "11:40", "블루보틀 성수", 9800, "식비·카페", "성수", true),
  o(10, "14:30", "(주)디뮤지엄 전시", 30000, "문화·여가", "성수", true),
  o(10, "17:20", "(주)아디다스코리아 성수", 30000, "쇼핑", "성수", true),
  o(10, "19:10", "(주)샐러디 성수점", 9500, "식비·카페", "성수", true),
  o(11, "12:40", "(주)올드페리도넛 용산점", 6500, "식비·카페", "용산", true),
  o(11, "15:40", "(주)유니클로 용산아이파크몰점", 32000, "쇼핑", "용산", true),
  o(11, "18:20", "CGV 용산", 24000, "문화·여가", "용산", true),
  o(12, "12:50", "(주)한상차림 성수점", 96000, "식비·카페", "성수", true, ["나", "지은", "민지"]),
  o(12, "15:20", "(주)마르디", 42000, "쇼핑", "성수", true),
  o(12, "21:40", "(주)에이치엠코리아", 35500, "쇼핑", "성수", false),
  o(13, "12:20", "서브웨이 선릉점", 8900, "식비·카페", "선릉", true),
  o(13, "19:30", "티머니 후불교통", 3100, "교통", "선릉", true),
  o(14, "12:30", "(주)본죽 역삼점", 9500, "식비·카페", "역삼", false),
  o(14, "18:50", "GS25 역삼점", 3200, "생활·기타", "역삼", false),
  o(15, "08:30", "이디야커피 선릉점", 4100, "식비·카페", "선릉", true),
  o(15, "12:50", "(주)한솥도시락 선릉점", 6500, "식비·카페", "선릉", false),
  o(15, "19:10", "(주)올리브영 선릉점", 14000, "쇼핑", "선릉", false),
  o(16, "12:15", "(주)샐러디 선릉점", 9500, "식비·카페", "선릉", true),
  o(16, "14:00", "이디야커피 선릉점", 4200, "식비·카페", "선릉", true),
  o(16, "21:30", "카카오T 택시", 17800, "교통", "역삼", true),
  o(17, "11:50", "(주)브런치카페 서울숲점", 13500, "식비·카페", "서울숲", true),
  o(17, "14:20", "(주)서울숲 아트클래스", 45000, "문화·여가", "서울숲", true),
  o(17, "16:50", "(주)무인양품 성수", 50000, "생활·기타", "성수", true),
  o(17, "20:10", "(주)성수족발", 10600, "식비·카페", "성수", true),
  o(18, "11:30", "(주)투썸플레이스 용산점", 8000, "식비·카페", "용산", true),
  o(18, "13:20", "(주)교보문고 용산점", 21000, "문화·여가", "용산", true),
  o(18, "15:00", "CGV 용산", 15000, "문화·여가", "용산", true),
  o(18, "18:10", "용산 파스타", 15000, "식비·카페", "용산", true),
  o(19, "08:20", "스타벅스 광화문점", 5800, "식비·카페", "광화문", true),
  o(19, "12:30", "구내식당", 5500, "식비·카페", "광화문", false),
  o(19, "18:50", "티머니 후불교통", 3100, "교통", "광화문", false),
  o(20, "12:10", "(주)맘스터치 선릉점", 6800, "식비·카페", "선릉", true),
  o(20, "18:30", "티머니 후불교통", 3100, "교통", "강남역", true),
  o(21, "12:20", "김밥천국 역삼점", 7000, "식비·카페", "역삼", false),
  o(21, "19:50", "배달의민족", 12000, "식비·카페", "역삼", false),
  o(22, "08:30", "이디야커피 선릉점", 4100, "식비·카페", "선릉", true),
  o(22, "13:00", "(주)서브웨이 선릉점", 8900, "식비·카페", "선릉", false),
  o(22, "20:20", "(주)쿠팡", 23000, "쇼핑", "강남역", false),
  o(23, "12:30", "(주)본도시락 선릉점", 6900, "식비·카페", "선릉", true),
  o(23, "15:30", "스타벅스 선릉점", 6200, "식비·카페", "선릉", true),
  o(23, "19:40", "(주)이마트24 선릉점", 8500, "생활·기타", "선릉", true),
  o(23, "21:10", "카카오T 택시", 19500, "교통", "선릉", true),
  o(24, "12:00", "(주)합정한정식", 20000, "식비·카페", "합정", true),
  o(24, "15:30", "합정 베이커리", 11000, "식비·카페", "합정", true),
  o(24, "18:30", "(주)숯불갈비 합정점", 26000, "식비·카페", "합정", true),
  o(24, "21:20", "카카오T 택시", 22800, "교통", "합정", true),
  o(25, "15:00", "(주)모모커피 합정점", 12000, "식비·카페", "합정", true, ["나", "지은", "민지"]),
  o(25, "19:30", "(주)다이소 합정점", 14500, "생활·기타", "합정", false),
  o(26, "12:20", "맥도날드 선릉점", 7300, "식비·카페", "선릉", true),
  o(26, "18:50", "티머니 후불교통", 3100, "교통", "선릉", true),
  o(27, "08:40", "이디야커피 선릉점", 4100, "식비·카페", "선릉", true),
  o(27, "12:10", "구내식당", 5500, "식비·카페", "강남역", false),
  o(27, "20:15", "(주)다이소 역삼점", 13700, "생활·기타", "역삼", false),
  o(28, "12:30", "김밥천국 역삼점", 7000, "식비·카페", "역삼", false),
  o(28, "19:20", "GS25 역삼점", 4200, "생활·기타", "역삼", false),
  o(29, "12:30", "(주)한솥도시락 선릉점", 6500, "식비·카페", "선릉", true),
  o(29, "19:30", "티머니 후불교통", 3100, "교통", "선릉", true),
  o(30, "08:30", "스타벅스 광화문점", 5800, "식비·카페", "광화문", true),
  o(30, "12:40", "(주)샐러디 선릉점", 9500, "식비·카페", "선릉", false),
  o(30, "20:30", "(주)자라리테일코리아", 27600, "쇼핑", "선릉", false),
  o(31, "12:30", "(주)성수연방", 14000, "식비·카페", "성수", true),
  o(31, "16:00", "(주)아더에러 성수", 39000, "쇼핑", "성수", true),
  o(31, "19:40", "(주)파티월드 성수점", 40000, "생활·기타", "성수", true),
]

// 장면 5: 주문내역 캡처를 올리면 인식되는 구매 품목 (결제 시각 기준)

export const OCTOBER_TARGET = {
  gross: 1362000,
  settled: 162000,
  mine: 1200000,
  maxDay: { day: 12, total: 173500 },
  days: { complete: 18, partial: 9, none: 4 },
  categories: {
    "식비·카페": 480000,
    "쇼핑": 300000,
    "문화·여가": 150000,
    "생활·기타": 150000,
    "교통": 120000,
  } satisfies Record<Category, number>,
} as const

// 내 몫: 그룹 결제는 인원수로 나눈다
export const myShare = (payment: Payment) =>
  payment.group ? Math.round(payment.amount / payment.group.length) : payment.amount

// 명세 일치 여부를 검증한다. statusOf에는 ledger의 dayStatus를 넘겨 복원 일수까지 확인한다.
export function verifyOctober(
  statusOf: (day: number) => "complete" | "partial" | "none" | "empty",
) {
  const errors: string[] = []
  const expect = (label: string, actual: unknown, expected: unknown) => {
    if (actual !== expected) errors.push(`${label}: ${String(actual)} (기대 ${String(expected)})`)
  }
  const sum = (list: Payment[], pick: (payment: Payment) => number) =>
    list.reduce((total, payment) => total + pick(payment), 0)

  const gross = sum(octoberPayments, (payment) => payment.amount)
  const mine = sum(octoberPayments, myShare)
  expect("결제 총액", gross, OCTOBER_TARGET.gross)
  expect("내 지출", mine, OCTOBER_TARGET.mine)
  expect("정산 차감", gross - mine, OCTOBER_TARGET.settled)

  for (const [category, target] of Object.entries(OCTOBER_TARGET.categories))
    expect(
      `카테고리 ${category}`,
      sum(octoberPayments.filter((payment) => payment.category === category), myShare),
      target,
    )

  const totals: number[] = []
  const status = { complete: 0, partial: 0, none: 0 }
  for (let day = 1; day <= 31; day += 1) {
    const list = octoberPayments.filter((payment) => payment.date.d === day)
    if (list.length < 1 || list.length > 4) errors.push(`${day}일 결제 ${list.length}건 (기대 1~4)`)
    totals[day] = sum(list, (payment) => payment.amount)
    const result = statusOf(day)
    if (result !== "empty") status[result] += 1
  }
  expect("10/12 결제 합계", totals[OCTOBER_TARGET.maxDay.day], OCTOBER_TARGET.maxDay.total)
  const others = totals.filter((_, day) => day !== OCTOBER_TARGET.maxDay.day && day > 0)
  if (Math.max(...others) >= totals[OCTOBER_TARGET.maxDay.day])
    errors.push("10/12보다 큰(같은) 날이 있음")
  expect("복원 완료 일수", status.complete, OCTOBER_TARGET.days.complete)
  expect("부분 복원 일수", status.partial, OCTOBER_TARGET.days.partial)
  expect("기록 없음 일수", status.none, OCTOBER_TARGET.days.none)

  if (errors.length > 0) throw new Error(`10월 목업 검증 실패\n${errors.join("\n")}`)
}
