import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getMyProfile, getMySubscriptions } from '@/utils/supabase/db'
import { ProfileForm } from '@/components/ProfileForm'
import { BentoBox } from '@/components/ui/BentoBox'
import { LogOut, Bell, BellOff, TrendingUp, MapPin, ChevronRight } from 'lucide-react'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const user = session.user
  const profile = await getMyProfile(user.id)
  const subscriptions = await getMySubscriptions(user.id).catch(() => [])

  const displayName = user.user_metadata?.full_name
    ?? user.user_metadata?.name
    ?? user.email?.split('@')[0]
    ?? '회원'

  return (
    <div className="pb-12 pt-6 max-w-2xl mx-auto space-y-5">

      {/* ── 상단 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-2">
        <div className="h-14 w-14 rounded-2xl bg-[#00D09E] flex items-center justify-center shadow-md shadow-[#00D09E]/20 shrink-0">
          <span className="text-2xl font-black text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-[20px] font-extrabold text-slate-800">{displayName}님</h1>
          <p className="text-[13px] text-slate-400 font-medium">{user.email}</p>
        </div>
      </div>

      {/* ── 1인가구 가점 계산기 */}
      <BentoBox>
        <h2 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-1">
          🧮 내 가점 프로필
        </h2>
        <p className="text-[12px] text-slate-400 font-medium mb-5">
          조건을 입력하면 맞춤 공고를 자동으로 찾아드려요
        </p>
        <ProfileForm
          initialData={{
            age: profile?.age ?? undefined,
            region: profile?.region ?? undefined,
            no_house_years: profile?.no_house_years ?? undefined,
            subscription_count: profile?.subscription_count ?? undefined,
            monthly_income: profile?.monthly_income ?? undefined,
          }}
        />
      </BentoBox>

      {/* ── 알림 설정 */}
      <BentoBox>
        <h2 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-4">
          🔔 이메일 알림 설정
        </h2>
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100">
          <div className="flex items-center gap-3">
            {profile?.alert_enabled !== false ? (
              <Bell className="h-5 w-5 text-[#00D09E]" />
            ) : (
              <BellOff className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <p className="text-[14px] font-bold text-slate-800">맞춤 공고 알림</p>
              <p className="text-[12px] text-slate-400 font-medium">
                {profile?.alert_enabled !== false ? '알림 수신 중' : '알림 꺼짐'}
              </p>
            </div>
          </div>
          {/* 토글은 클라이언트 컴포넌트화 예정 — 현재 정적 표시 */}
          <div className={`relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-colors ${profile?.alert_enabled !== false ? 'bg-[#00D09E]' : 'bg-slate-200'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${profile?.alert_enabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </div>
      </BentoBox>

      {/* ── 구독 중인 공고 목록 */}
      <BentoBox>
        <h2 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-4">
          📌 구독 중인 공고
        </h2>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[14px] text-slate-400 font-medium mb-3">아직 구독한 공고가 없어요</p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-[#00D09E]/10 text-[#00D09E] px-4 py-2 text-[13px] font-bold hover:bg-[#00D09E]/20 transition-colors"
            >
              공고 찾아보기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/detail/${sub.notice_id}`}
                className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5 text-[#00D09E]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 truncate">
                      {(sub.notices as any)?.title ?? '공고'}
                    </p>
                    <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {(sub.notices as any)?.region ?? '-'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </BentoBox>

      {/* ── 로그아웃 */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          id="signout-btn"
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-[15px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </form>

    </div>
  )
}
