import { createClient } from './server'

// ─── 데이터베이스 타입 정의 ──────────────────────────────────────

export type Notice = {
  id: string
  title: string
  region: string
  district?: string
  type: string
  deposit: number
  rent_fee: number
  area_sqm: number
  current_market_price: number
  expected_profit_10y: number
  conversion_price: number
  source_url: string
  published_at: string
  subscription_open: string
  subscription_close: string
  winner_announce: string
  contract_date: string
}

export type NoticeWithSummary = Notice & {
  notice_ai_summary?: {
    summary_line1: string
    summary_line2: string
    summary_line3: string
    eligibility_checklist: EligibilityItem[]
  } | null
}

export type EligibilityItem = {
  key: string
  label: string
  met: boolean
}

export type Profile = {
  id: string
  name: string | null
  age: number | null
  region: string | null
  no_house_years: number | null
  subscription_count: number | null
  monthly_income: number | null
  email: string | null
  alert_enabled: boolean
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  notice_id: string
  created_at: string
  notices?: Notice
}

// ─── 공고 쿼리 ───────────────────────────────────────────────────

/** 전체 공고 목록 조회 (최신 순) */
export async function getNotices(limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notices')
    .select('*, notice_ai_summary(*)')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`공고 목록 조회 실패: ${error.message}`)
  return data as NoticeWithSummary[]
}

/** 단건 공고 조회 */
export async function getNoticeById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notices')
    .select('*, notice_ai_summary(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as NoticeWithSummary
}

/** 지역 필터 공고 조회 */
export async function getNoticesByRegion(region: string, limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notices')
    .select('*, notice_ai_summary(*)')
    .eq('region', region)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`지역 공고 조회 실패: ${error.message}`)
  return data as NoticeWithSummary[]
}

// ─── 프로필 쿼리 ─────────────────────────────────────────────────

/** 내 프로필 조회 */
export async function getMyProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

/** 프로필 생성/업데이트 (upsert) */
export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw new Error(`프로필 저장 실패: ${error.message}`)
  return data as Profile
}

/** 알림 설정 ON/OFF */
export async function toggleAlertEnabled(userId: string, enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ alert_enabled: enabled })
    .eq('id', userId)

  if (error) throw new Error(`알림 설정 변경 실패: ${error.message}`)
}

// ─── 구독 쿼리 ───────────────────────────────────────────────────

/** 구독 토글 (있으면 삭제, 없으면 추가) */
export async function toggleSubscription(userId: string, noticeId: string) {
  const supabase = await createClient()

  // 기존 구독 확인
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('notice_id', noticeId)
    .single()

  if (existing) {
    // 구독 취소
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', existing.id)
    if (error) throw new Error(`구독 취소 실패: ${error.message}`)
    return false // 구독 해제됨
  } else {
    // 구독 추가
    const { error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, notice_id: noticeId })
    if (error) throw new Error(`구독 추가 실패: ${error.message}`)
    return true // 구독됨
  }
}

/** 내 구독 목록 조회 */
export async function getMySubscriptions(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, notices(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`구독 목록 조회 실패: ${error.message}`)
  return data as Subscription[]
}

/** 특정 공고 구독 여부 확인 */
export async function isSubscribed(userId: string, noticeId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('notice_id', noticeId)
    .single()

  return !!data
}
