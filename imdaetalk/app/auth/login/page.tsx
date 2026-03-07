'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, TrendingUp, Bell, CheckCircle2 } from 'lucide-react'

const BENEFITS = [
  { icon: <TrendingUp className="h-4 w-4 text-[#00D09E]" />, text: '10년 뒤 시세 차익 자동 계산' },
  { icon: <CheckCircle2 className="h-4 w-4 text-[#00D09E]" />, text: '내 가점으로 맞춤 공고 자동 필터링' },
  { icon: <Bell className="h-4 w-4 text-[#00D09E]" />, text: '조건 맞는 신규 공고 알림 수신' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState<'kakao' | 'naver' | null>(null)
  const supabase = createClient()

  async function handleLogin(provider: 'kakao' | 'naver') {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('로그인 오류:', error.message)
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-6 py-12">

      {/* 로고 & 슬로건 */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00D09E] shadow-lg shadow-[#00D09E]/30 mb-4">
          <span className="text-3xl font-black text-white">Z</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">집스텝</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
          무주택 1인 가구의 내 집 마련,<br />
          <strong className="text-slate-700">돈 되는 청약을 쉽게 찾아드려요 💸</strong>
        </p>
      </div>

      {/* 로그인 혜택 벤토 박스 */}
      <div className="w-full max-w-sm rounded-2xl border border-[#00D09E]/20 bg-[#00D09E]/5 p-4 mb-6">
        <p className="text-xs font-bold text-[#00b388] mb-3">로그인하면 이런 게 달라져요 🧮</p>
        <div className="space-y-2">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {b.icon}
              <p className="text-xs font-semibold text-slate-700">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="w-full max-w-sm space-y-3">

        {/* 카카오 */}
        <button
          onClick={() => handleLogin('kakao')}
          disabled={loading !== null}
          id="kakao-login-btn"
          className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-70 shadow-md"
          style={{ backgroundColor: '#FEE500', color: '#191919' }}
          aria-label="카카오로 로그인"
        >
          {loading === 'kakao' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <svg width="20" height="19" viewBox="0 0 20 19" fill="none" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 0C4.477 0 0 3.582 0 8c0 2.86 1.724 5.375 4.327 6.891l-1.1 4.009c-.097.355.327.637.633.42L8.92 16.45A11.51 11.51 0 0010 16.5c5.523 0 10-3.582 10-8S15.523 0 10 0z"
                  fill="#191919"
                />
              </svg>
              카카오로 1초 로그인
            </>
          )}
        </button>

        {/* 네이버 (준비 중) */}
        <button
          onClick={() => handleLogin('naver')}
          disabled={true} // TO-DO: 네이버 OAuth 연동 완료 후 활성화
          id="naver-login-btn"
          className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold text-slate-400 transition-all cursor-not-allowed shadow-none"
          style={{ backgroundColor: '#F1F5F9' }} // Tailwind slate-100 색상
          aria-label="네이버로 로그인 (준비 중)"
          title="네이버 로그인은 준비 중입니다."
        >
          <span className="text-base font-black leading-none opacity-50">N</span>
          네이버 로그인 (준비 중)
        </button>

      </div>

      <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
        로그인 시 집스텝 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주됩니다.
      </p>
    </div>
  )
}
