export interface Notice {
  id: string
  title: string
  region: string
  district: string // 구/시
  type: '행복주택' | '국민임대' | '공공분양' | '장기전세' | '청년안심주택'
  ai_summary: [string, string, string] // 3줄 요약
  deposit: number // 보증금 (만 원)
  rent_fee: number // 월세 (만 원)
  area_sqm: number // 전용면적 (㎡)
  expected_profit: number // 예상 시세 차익 (만 원)
  current_market_price: number // 현재 주변 시세 (만 원)
  conversion_price: number // 예상 분양전환가 (만 원)
  is_eligible: boolean // 조건 부합 여부
  eligibility_note?: string // 조건 미충족 시 이유
  subscription_open: string // 청약 접수 시작
  subscription_close: string // 청약 접수 종료
  winner_announce: string // 당첨 발표
  contract_date: string // 계약일
  source_url: string // 원문 링크
  published_at: string // 공고일
  latitude?: number
  longitude?: number
}

export const dummyNotices: Notice[] = [
  {
    id: '1',
    title: '마곡지구 9단지 행복주택',
    region: '서울특별시',
    district: '강서구',
    type: '행복주택',
    ai_summary: [
      '🏢 지하철 5·9호선 마곡나루역 도보 3분 역세권! 직주근접 최고 입지예요.',
      '💰 보증금 6,500만 원·월세 23만 원으로 주변 시세 대비 60% 수준이에요.',
      '📋 만 19~39세 무주택 청년 대상, 소득 기준 도시근로자 120% 이하예요.',
    ],
    deposit: 6500,
    rent_fee: 23,
    area_sqm: 36,
    expected_profit: 15000,
    current_market_price: 72000,
    conversion_price: 57000,
    is_eligible: true,
    subscription_open: '2026-03-20',
    subscription_close: '2026-03-24',
    winner_announce: '2026-04-10',
    contract_date: '2026-04-20',
    source_url: 'https://apply.lh.or.kr',
    published_at: '2026-03-06',
    latitude: 37.5594,
    longitude: 126.8314,
  },
  {
    id: '2',
    title: '수서역세권 청년주택 A블록',
    region: '서울특별시',
    district: '강남구',
    type: '청년안심주택',
    ai_summary: [
      '🚇 수서역(SRT·3호선·분당선) 도보 5분, 강남 접근성 최강 입지예요.',
      '🏠 전용 26㎡ 원룸형, 빌트인 가전 완비로 이사 부담이 없어요.',
      '⚠️ 소득 기준 도시근로자 100% 이하, 만 19세~39세 무주택자 대상이에요.',
    ],
    deposit: 5800,
    rent_fee: 35,
    area_sqm: 26,
    expected_profit: 22000,
    current_market_price: 95000,
    conversion_price: 73000,
    is_eligible: true,
    subscription_open: '2026-03-25',
    subscription_close: '2026-03-27',
    winner_announce: '2026-04-15',
    contract_date: '2026-04-25',
    source_url: 'https://housing.seoul.go.kr',
    published_at: '2026-03-05',
    latitude: 37.4875,
    longitude: 127.1017,
  },
  {
    id: '3',
    title: '고덕강일 공공분양 3블록',
    region: '서울특별시',
    district: '강동구',
    type: '공공분양',
    ai_summary: [
      '🌳 강동구 최대 규모 신도시, 한강공원·자연환경 접근성 최우수예요.',
      '🏗️ 입주 예정 2028년, 지금이 분양 적기인 실제 분양 아파트예요.',
      '📊 청약 납입 횟수 24회 이상, 무주택세대 구성원만 신청 가능해요.',
    ],
    deposit: 0,
    rent_fee: 0,
    area_sqm: 59,
    expected_profit: 34000,
    current_market_price: 120000,
    conversion_price: 86000,
    is_eligible: false,
    eligibility_note: '청약 납입 횟수 14회로 조건(24회) 미충족이에요 🥲',
    subscription_open: '2026-04-01',
    subscription_close: '2026-04-05',
    winner_announce: '2026-04-20',
    contract_date: '2026-05-01',
    source_url: 'https://apply.lh.or.kr',
    published_at: '2026-03-04',
    latitude: 37.5535,
    longitude: 127.1737,
  },
  {
    id: '4',
    title: '은평뉴타운 국민임대 7단지',
    region: '서울특별시',
    district: '은평구',
    type: '국민임대',
    ai_summary: [
      '🌿 북한산 조망권, 진관사 인근 쾌적한 자연환경 속 단지예요.',
      '💵 보증금 3,200만 원·월세 18만 원, 서울 최저 수준 월세예요.',
      '✅ 전년도 도시근로자 월평균 소득 70% 이하, 무주택 2년 이상 조건이에요.',
    ],
    deposit: 3200,
    rent_fee: 18,
    area_sqm: 46,
    expected_profit: 11000,
    current_market_price: 62000,
    conversion_price: 51000,
    is_eligible: true,
    subscription_open: '2026-03-18',
    subscription_close: '2026-03-21',
    winner_announce: '2026-04-05',
    contract_date: '2026-04-15',
    source_url: 'https://apply.lh.or.kr',
    published_at: '2026-03-03',
    latitude: 37.6349,
    longitude: 126.9198,
  },
  {
    id: '5',
    title: '위례신도시 장기전세 SH 2차',
    region: '서울특별시',
    district: '송파구',
    type: '장기전세',
    ai_summary: [
      '🏆 위례신도시 알짜 입지, 8호선 위례중앙역 도보 7분 거리예요.',
      '🔑 전세 방식 장기전세(20년 거주), 재계약 거절 불가로 안정성 최고예요.',
      '📈 10년 뒤 주변 시세 대비 차익이 가장 크게 예상되는 공고예요.',
    ],
    deposit: 28000,
    rent_fee: 0,
    area_sqm: 49,
    expected_profit: 28000,
    current_market_price: 110000,
    conversion_price: 82000,
    is_eligible: true,
    subscription_open: '2026-04-08',
    subscription_close: '2026-04-10',
    winner_announce: '2026-04-25',
    contract_date: '2026-05-10',
    source_url: 'https://www.i-sh.co.kr',
    published_at: '2026-03-01',
    latitude: 37.4819,
    longitude: 127.1309,
  },
]

// 금액 포맷 헬퍼
export function formatMoney(amount: number): string {
  if (amount >= 10000) {
    const eok = Math.floor(amount / 10000)
    const man = amount % 10000
    if (man === 0) return `${eok}억`
    return `${eok}억 ${man.toLocaleString()}만`
  }
  return `${amount.toLocaleString()}만`
}
